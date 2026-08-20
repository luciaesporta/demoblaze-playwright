import { test, expect } from '@playwright/test';
import { step, attachment } from 'allure-js-commons';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { getCLS, getFCP, getLCP } from '../utils/webVitals';

test.describe('Visual regression', { tag: ['@chromium-only', '@regression'] }, () => {
  test('home page matches screenshot', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await expect(homePage.firstProductLink).toBeVisible();
    await expect(page).toHaveScreenshot('home.png', { fullPage: true });
  });

  test('cart page matches screenshot', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await homePage.goto();
    await homePage.openFirstProduct();
    await productPage.addToCart();

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(1);
    await expect(page).toHaveScreenshot('cart.png', { fullPage: true });
  });

  test('checkout modal matches screenshot', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await homePage.goto();
    await homePage.openFirstProduct();
    await productPage.addToCart();

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(1);
    await cartPage.openPlaceOrderModal();
    await expect(cartPage.orderModal).toBeVisible();
    await expect(page).toHaveScreenshot('checkout-modal.png', { fullPage: true });
  });
});

test.describe('Performance — Image size', { tag: '@regression' }, () => {
  const MAX_IMAGE_SIZE_KB = 500;

  test('product card images do not exceed size limit', async ({ page }) => {
    const homePage = new HomePage(page);
    const oversized: { url: string; sizeKB: number }[] = [];

    page.on('response', (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] ?? '';
      if (contentType.startsWith('image/')) {
        const contentLength = parseInt(response.headers()['content-length'] ?? '0', 10);
        const sizeKB = contentLength / 1024;
        if (sizeKB > MAX_IMAGE_SIZE_KB) {
          oversized.push({ url, sizeKB: Math.round(sizeKB) });
        }
      }
    });

    await homePage.goto();
    await expect(homePage.firstProductLink).toBeVisible();

    expect(oversized).toEqual([]);
  });

  test('product detail image does not exceed size limit', async ({ page }) => {
    const homePage = new HomePage(page);
    const oversized: { url: string; sizeKB: number }[] = [];

    page.on('response', (response) => {
      const url = response.url();
      const contentType = response.headers()['content-type'] ?? '';
      if (contentType.startsWith('image/')) {
        const contentLength = parseInt(response.headers()['content-length'] ?? '0', 10);
        const sizeKB = contentLength / 1024;
        if (sizeKB > MAX_IMAGE_SIZE_KB) {
          oversized.push({ url, sizeKB: Math.round(sizeKB) });
        }
      }
    });

    await homePage.goto();
    await homePage.openFirstProduct();

    expect(oversized).toEqual([]);
  });
});

test.describe('Performance', { tag: '@regression' }, () => {
  /** Budget for First Contentful Paint on the home page. */
  const FCP_BUDGET_MS = 2_000;
  /** Budget for Largest Contentful Paint on the home page. */
  const LCP_BUDGET_MS = 3_000;
  /** Budget for Cumulative Layout Shift — a unitless score, not a duration. */
  const CLS_BUDGET = 0.1;

  /**
   * Records a measured metric in both reports so a regression shows the number
   * rather than a bare pass/fail: Allure gets an attachment, the HTML report an
   * annotation. Returns the string for reuse in the assertion message.
   */
  async function recordMetric(label: string, value: number, budgetMs: number): Promise<string> {
    const measured = `${Math.round(value)} ms (budget ${budgetMs} ms)`;
    await attachment(label, measured, 'text/plain');
    test.info().annotations.push({ type: label, description: measured });
    return measured;
  }

  test('home page loads in under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('https://www.demoblaze.com', { waitUntil: 'domcontentloaded' });

    const homePage = new HomePage(page);
    await expect(homePage.firstProductLink).toBeVisible();
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(3_000);
  });

  test('home page paints first content within budget', async ({ page }) => {
    const homePage = new HomePage(page);

    await step('Load home page', async () => {
      await homePage.goto();
      await expect(homePage.firstProductLink).toBeVisible();
    });

    const fcp = await step('Measure First Contentful Paint', () => getFCP(page));
    const measured = await recordMetric('FCP', fcp, FCP_BUDGET_MS);

    expect(fcp, `FCP was ${measured}`).toBeLessThan(FCP_BUDGET_MS);
  });

  test('home page paints largest content within budget', async ({ page }) => {
    const homePage = new HomePage(page);

    await step('Load home page', async () => {
      await homePage.goto();
      await expect(homePage.firstProductLink).toBeVisible();
    });

    // LCP keeps being reported as larger elements paint, so getLCP() waits out
    // a quiet window before reading the final buffered entry.
    const lcp = await step('Measure Largest Contentful Paint', () => getLCP(page));
    const measured = await recordMetric('LCP', lcp, LCP_BUDGET_MS);

    expect(lcp, `LCP was ${measured}`).toBeLessThan(LCP_BUDGET_MS);
  });

  test(
    'browsing from home to cart stays within the layout shift budget',
    // CLS needs the layout-shift entry type, which only Chromium implements.
    { tag: '@chromium-only' },
    async ({ page }) => {
      // Known defect: the home page alone shifts by ~0.09-0.10, and the three
      // pages together total ~0.18-0.19, well past the 0.1 budget.
      test.fail();
      const homePage = new HomePage(page);
      const productPage = new ProductPage(page);
      const cartPage = new CartPage(page);

      // Each navigation starts a new document, so the layout-shift buffer is
      // reset and getCLS() only ever reports the current page. Read the score
      // before leaving each page and add the pieces up to get the journey total.
      const perPage: Record<string, number> = {};

      await step('Measure home page', async () => {
        await homePage.goto();
        await expect(homePage.firstProductLink).toBeVisible();
        perPage.home = await getCLS(page);
      });

      await step('Measure product page', async () => {
        await homePage.openFirstProduct();
        await productPage.addToCart();
        perPage.product = await getCLS(page);
      });

      await step('Measure cart page', async () => {
        await cartPage.goto();
        await expect(cartPage.cartRows).toHaveCount(1);
        perPage.cart = await getCLS(page);
      });

      const total = Object.values(perPage).reduce((sum, score) => sum + score, 0);
      const breakdown = Object.entries(perPage)
        .map(([name, score]) => `  ${name}: ${score.toFixed(4)}`)
        .join('\n');
      const measured = `${total.toFixed(4)} (budget ${CLS_BUDGET})`;

      await attachment('CLS', `total: ${measured}\n${breakdown}`, 'text/plain');
      test.info().annotations.push({ type: 'CLS', description: measured });

      expect(total, `Cumulative CLS was ${measured}\n${breakdown}`).toBeLessThan(CLS_BUDGET);
    },
  );
});
