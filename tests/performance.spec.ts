import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';

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
  test('home page loads in under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('https://www.demoblaze.com', { waitUntil: 'domcontentloaded' });

    const homePage = new HomePage(page);
    await expect(homePage.firstProductLink).toBeVisible();
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(3_000);
  });
});
