const { test } = require('../fixtures/authFixtures');
const { expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { ProductPage } = require('../pages/ProductPage');
const { CartPage } = require('../pages/CartPage');

test('Cart — Guest user can add a product to cart', async ({ page }) => {
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);

  await homePage.goto();
  await expect(page).toHaveTitle(/STORE/);

  await homePage.openFirstProduct();
  await expect(page).toHaveURL(/prod\.html/);
  await expect(productPage.productName).toBeVisible();

  const expectedName = await productPage.getProductName();

  await productPage.addToCart();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(1);
  await expect(cartPage.getRowCell(0, 1)).toContainText(expectedName);
});

test('Cart — Authenticated user can add a product to cart', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);

  await homePage.openFirstProduct();
  await expect(page).toHaveURL(/prod\.html/);
  await expect(productPage.productName).toBeVisible();
  await expect(productPage.productPrice).toBeVisible();

  const expectedName = await productPage.getProductName();
  const expectedPrice = await productPage.getProductPrice();

  await productPage.addToCart();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(1);
  await expect(cartPage.getRowCell(0, 1)).toContainText(expectedName);
  await expect(cartPage.getRowCell(0, 2)).toContainText(expectedPrice);
  await expect(cartPage.cartTotal).toHaveText(expectedPrice);
});
