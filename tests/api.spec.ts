import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';

test.describe('API — Add to cart', () => {
  test('addtocart request contains valid payload', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();
    await homePage.openFirstProduct();

    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('addtocart') && req.method() === 'POST',
    );

    page.once('dialog', (dialog) => {
      void dialog.accept();
    });
    await page.getByRole('link', { name: 'Add to cart' }).click();

    const request = await requestPromise;
    const payload = request.postDataJSON();

    expect(payload).toHaveProperty('id');
    expect(payload).toHaveProperty('cookie');
    expect(payload).toHaveProperty('prod_id');
    expect(payload).toHaveProperty('flag');
    expect(payload.prod_id).toBeGreaterThan(0);
    expect(typeof payload.cookie).toBe('string');
    expect(payload.cookie.length).toBeGreaterThan(0);
  });
});

test.describe('API — Delete from cart', () => {
  test('deleteitem request sends valid payload and returns 200', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await homePage.goto();
    await homePage.openFirstProduct();
    await productPage.addToCart();

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(1);

    const requestPromise = page.waitForRequest(
      (req) => req.url().includes('deleteitem') && req.method() === 'POST',
    );
    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('deleteitem'),
    );
    await cartPage.deleteRow(0);

    const request = await requestPromise;
    const payload = request.postDataJSON();
    expect(payload).toHaveProperty('id');
    expect(typeof payload.id).toBe('string');
    expect(payload.id.length).toBeGreaterThan(0);

    const response = await responsePromise;
    expect(response.status()).toBe(200);
  });
});
