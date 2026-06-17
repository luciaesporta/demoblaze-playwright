import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';

test.describe('API — Add to cart', () => {
  test('addtocart request contains valid payload', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);

    await homePage.goto();
    await homePage.openFirstProduct();

    const productName = await productPage.getProductName();
    const productPrice = await productPage.getProductPrice();

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
