import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { generateUser } from '../utils/testData';

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

test.describe('API — Network failure', () => {
  test('mocked login network failure does not break the UI', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await homePage.goto();

    await page.route('**/login', (route) => route.abort('connectionfailed'));

    await authPage.openLoginModal();
    await authPage.logInUsername.fill('testuser');
    await authPage.logInPassword.fill('testpass');
    await authPage.logInSubmit.click();

    await expect(authPage.logInModal).toBeVisible({ timeout: 5_000 });
    await expect(homePage.navbarBrand).toBeVisible();

    await page.unroute('**/login');

    await homePage.goto();
    await expect(homePage.firstProductLink).toBeVisible();
  });
});

test.describe('API — Login check', () => {
  test('login triggers /check request with 200 status', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    await authPage.register(username, password);

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/check') && res.request().method() === 'POST',
    );
    await authPage.login(username, password);
    const response = await responsePromise;

    expect(response.status()).toBe(200);
    expect(response.url()).toContain('/check');
  });
});

test.describe('API — Slow response', () => {
  test('delayed catalog response does not break the UI', async ({ page }) => {
    const homePage = new HomePage(page);

    await page.route('**/entries', async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 3_000));
      await route.continue();
    });

    await homePage.goto();

    await expect(homePage.navbarBrand).toBeVisible();

    await expect(homePage.firstProductLink).toBeVisible({ timeout: 15_000 });

    const cardCount = await homePage.getProductCardCount();
    expect(cardCount).toBeGreaterThan(0);
  });
});
