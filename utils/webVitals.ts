import type { Page } from '@playwright/test';

/**
 * Core Web Vitals collected from the browser's Performance API.
 *
 * Usage:
 *   await homePage.goto();
 *   const vitals = await collectWebVitals(page);
 *   expect(vitals.lcp).toBeLessThan(2_500);
 *
 * LCP and CLS keep changing while the page settles, so both are read after a
 * short quiet window (see `settleMs`). Call them once the page has rendered.
 *
 * Browser support: TTFB, FCP and LCP are available in all three Playwright
 * browsers. CLS relies on the `layout-shift` entry type, which only Chromium
 * implements — getCLS() and collectWebVitals() throw elsewhere, so tests that
 * use them belong under the `@chromium-only` tag.
 */

/** Quiet window, in ms, waited before reading metrics that accumulate. */
export const DEFAULT_SETTLE_MS = 1_000;

export interface VitalsOptions {
  /** How long to let LCP and CLS accumulate before reading them. */
  settleMs?: number;
}

export interface WebVitals {
  /** Time to First Byte, in ms. */
  ttfb: number;
  /** First Contentful Paint, in ms. */
  fcp: number;
  /** Largest Contentful Paint, in ms. */
  lcp: number;
  /** Cumulative Layout Shift — a unitless score, not a duration. */
  cls: number;
}

function unavailable(metric: string, reason: string): Error {
  return new Error(`${metric} is unavailable: ${reason}`);
}

/** Time to First Byte, in ms, from the navigation timing entry. */
export async function getTTFB(page: Page): Promise<number> {
  const ttfb = await page.evaluate(() => {
    const [navigation] = performance.getEntriesByType(
      'navigation',
    ) as PerformanceNavigationTiming[];
    if (!navigation) return null;
    return navigation.responseStart - navigation.startTime;
  });

  if (ttfb === null) throw unavailable('TTFB', 'the page has no navigation timing entry.');
  return ttfb;
}

/** First Contentful Paint, in ms, from the paint timing entries. */
export async function getFCP(page: Page): Promise<number> {
  const fcp = await page.evaluate(() => {
    const entry = performance
      .getEntriesByType('paint')
      .find((paint) => paint.name === 'first-contentful-paint');
    return entry ? entry.startTime : null;
  });

  if (fcp === null) throw unavailable('FCP', 'the page has not painted any content yet.');
  return fcp;
}

/**
 * Largest Contentful Paint, in ms.
 *
 * LCP is reported repeatedly as bigger elements paint, so this waits for the
 * page to settle and then takes the most recent buffered entry.
 */
export async function getLCP(page: Page, options: VitalsOptions = {}): Promise<number> {
  const { settleMs = DEFAULT_SETTLE_MS } = options;
  await page.waitForTimeout(settleMs);

  const lcp = await page.evaluate(
    () =>
      new Promise<number | null>((resolve) => {
        let latest: number | null = null;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            latest = entry.startTime;
          }
        });
        observer.observe({ type: 'largest-contentful-paint', buffered: true });

        // Buffered entries arrive on the next task, not synchronously.
        setTimeout(() => {
          observer.disconnect();
          resolve(latest);
        }, 0);
      }),
  );

  if (lcp === null) throw unavailable('LCP', 'no contentful element has painted yet.');
  return lcp;
}

/**
 * Cumulative Layout Shift — a unitless score, not a duration.
 *
 * Sums every layout shift that was not triggered by recent user input, which
 * is what Google's own CLS definition measures.
 */
export async function getCLS(page: Page, options: VitalsOptions = {}): Promise<number> {
  const { settleMs = DEFAULT_SETTLE_MS } = options;
  await page.waitForTimeout(settleMs);

  const cls = await page.evaluate(
    () =>
      new Promise<number | null>((resolve) => {
        interface LayoutShiftEntry extends PerformanceEntry {
          value: number;
          hadRecentInput: boolean;
        }

        // A page that never shifted reports no entries at all, so an empty
        // buffer is a real score of 0. Only an unsupported entry type means
        // the metric could not be measured.
        if (!PerformanceObserver.supportedEntryTypes.includes('layout-shift')) {
          resolve(null);
          return;
        }

        let total = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as LayoutShiftEntry[]) {
            if (!entry.hadRecentInput) {
              total += entry.value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });

        setTimeout(() => {
          observer.disconnect();
          resolve(total);
        }, 0);
      }),
  );

  if (cls === null)
    throw unavailable('CLS', 'this browser does not implement the layout-shift entry type.');
  return cls;
}

/** Collects all four metrics, waiting out the settle window only once. */
export async function collectWebVitals(
  page: Page,
  options: VitalsOptions = {},
): Promise<WebVitals> {
  const { settleMs = DEFAULT_SETTLE_MS } = options;
  await page.waitForTimeout(settleMs);

  const [ttfb, fcp, lcp, cls] = await Promise.all([
    getTTFB(page),
    getFCP(page),
    getLCP(page, { settleMs: 0 }),
    getCLS(page, { settleMs: 0 }),
  ]);

  return { ttfb, fcp, lcp, cls };
}

/** Builds a readable summary for assertion messages and Allure attachments. */
export function formatWebVitals(vitals: WebVitals): string {
  return [
    `TTFB: ${Math.round(vitals.ttfb)} ms`,
    `FCP:  ${Math.round(vitals.fcp)} ms`,
    `LCP:  ${Math.round(vitals.lcp)} ms`,
    `CLS:  ${vitals.cls.toFixed(4)}`,
  ].join('\n');
}
