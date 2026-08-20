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

export interface TTIOptions {
  /** How long the page must stay quiet before it counts as interactive. */
  quietWindowMs?: number;
  /** Give up waiting for a quiet window after this long. */
  timeoutMs?: number;
}

/** Default quiet window used to decide the page has settled. */
export const DEFAULT_QUIET_WINDOW_MS = 2_000;

/**
 * Time to Interactive, in ms, measured heuristically.
 *
 * Real TTI needs a full long-task trace. demoblaze reports zero long tasks on
 * every page, so a long-task-only definition would collapse to FCP and measure
 * nothing. This uses the wider heuristic instead: the page is interactive once
 * it has painted and then stayed quiet — no resource finishing loading and no
 * long task running — for `quietWindowMs`.
 *
 * The returned value is the end of the last busy moment, not the end of the
 * quiet window, so the wait itself is not counted.
 *
 * Long tasks are only observed on Chromium; elsewhere the network signal and
 * FCP carry the measurement, which is why this works in all three browsers.
 *
 * Media downloads are ignored. demoblaze preloads the About-us video, and
 * WebKit fetches the whole thing, so counting those segments would keep the
 * page "busy" for 20s while it was in fact interactive within 3s. A video
 * streaming in the background does not stop a user from clicking.
 *
 * If the page never goes quiet (a poll, a media stream), this returns the last
 * busy timestamp seen before `timeoutMs` rather than throwing — a page that
 * never settles has no meaningful TTI, and the caller's budget will catch it.
 */
export async function getTTI(page: Page, options: TTIOptions = {}): Promise<number> {
  const { quietWindowMs = DEFAULT_QUIET_WINDOW_MS, timeoutMs = 30_000 } = options;

  const tti = await page.evaluate(
    ({ quietWindow, timeout }) =>
      new Promise<number | null>((resolve) => {
        const paint = performance
          .getEntriesByType('paint')
          .find((entry) => entry.name === 'first-contentful-paint');
        if (!paint) {
          resolve(null);
          return;
        }

        // The page cannot be interactive before it has painted, so FCP is the
        // floor; every later signal can only push the busy mark forward.
        let lastBusy = paint.startTime;

        const observers: PerformanceObserver[] = [];
        const observe = (type: string, toEnd: (entry: PerformanceEntry) => number) => {
          if (!PerformanceObserver.supportedEntryTypes.includes(type)) return;
          const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
              lastBusy = Math.max(lastBusy, toEnd(entry));
            }
          });
          observer.observe({ type, buffered: true });
          observers.push(observer);
        };

        const MEDIA_INITIATORS = ['video', 'audio', 'track'];
        observe('resource', (entry) => {
          const resource = entry as PerformanceResourceTiming;
          if (MEDIA_INITIATORS.includes(resource.initiatorType)) return 0;
          return resource.responseEnd;
        });
        observe('longtask', (entry) => entry.startTime + entry.duration);

        const startedAt = performance.now();
        const poll = setInterval(() => {
          const now = performance.now();
          const quietFor = now - lastBusy;
          if (quietFor >= quietWindow || now - startedAt >= timeout) {
            clearInterval(poll);
            observers.forEach((observer) => observer.disconnect());
            resolve(lastBusy);
          }
        }, 100);
      }),
    { quietWindow: quietWindowMs, timeout: timeoutMs },
  );

  if (tti === null) throw unavailable('TTI', 'the page has not painted any content yet.');
  return tti;
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
