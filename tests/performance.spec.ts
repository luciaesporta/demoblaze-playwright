import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { DEFAULT_ORDER } from '../utils/testData';

test.describe('Visual regression', () => {
  test('home page matches screenshot', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await expect(homePage.firstProductLink).toBeVisible();
    await expect(page).toHaveScreenshot('home.png', { fullPage: true, maxDiffPixelRatio: 0.05 });
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
    await expect(page).toHaveScreenshot('cart.png', { fullPage: true, maxDiffPixelRatio: 0.05 });
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
    await expect(page).toHaveScreenshot('checkout-modal.png', { fullPage: true, maxDiffPixelRatio: 0.05 });
  });
});

test.describe('Performance', () => {
  test('home page loads in under 3 seconds', async ({ page }) => {
    const start = Date.now();
    await page.goto('https://www.demoblaze.com', { waitUntil: 'domcontentloaded' });

    const homePage = new HomePage(page);
    await expect(homePage.firstProductLink).toBeVisible();
    const loadTime = Date.now() - start;

    expect(loadTime).toBeLessThan(3_000);
  });
});
