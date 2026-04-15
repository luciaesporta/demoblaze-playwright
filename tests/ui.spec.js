const { test, expect } = require('@playwright/test');
const { test: authTest } = require('../fixtures/authFixtures');
const { HomePage } = require('../pages/HomePage');
const { ProductPage } = require('../pages/ProductPage');
const { AuthPage } = require('../pages/AuthPage');
const { PAGE_TITLE, PRODUCT_PAGE_URL } = require('../utils/constants');

test('UI — Home page displays the store title', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await expect(page).toHaveTitle(PAGE_TITLE);
});

test('UI — Home page loads product cards', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  const cards = page.locator('.card-title a');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);
});

test('UI — Filtering by category updates the product list', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openCategory('Phones');
  await expect(page.locator('.card-title a').first()).toBeVisible();

  await homePage.openCategory('Monitors');
  await expect(page.locator('.card-title a').first()).toBeVisible();
});

test('UI — Clicking a product card navigates to its detail page', async ({ page }) => {
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  await homePage.goto();
  await homePage.openProduct(0);
  await expect(page).toHaveURL(PRODUCT_PAGE_URL);
  await expect(productPage.productName).toBeVisible();
  await expect(productPage.productPrice).toBeVisible();
});

test('UI — Navbar logo navigates back to home from a product page', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.openProduct(0);
  await expect(page).toHaveURL(PRODUCT_PAGE_URL);

  await homePage.navbarBrand.click();

  await expect(page).toHaveTitle(PAGE_TITLE);
  await expect(page.locator('.card-title a').first()).toBeVisible();
});

test('UI — Cart link in navbar navigates to the cart page', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.cartNavLink.click();
  await expect(page).toHaveURL(/cart\.html/);
});

authTest('UI — Logged-in user can log out', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  const authPage = new AuthPage(page);

  await expect(authPage.loggedInUsername).toBeVisible();

  await authPage.logoutButton.click();

  await expect(authPage.loggedInUsername).not.toBeVisible();
  await expect(authPage.logInNavButton).toBeVisible();
});
