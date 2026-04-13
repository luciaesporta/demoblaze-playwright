const { test } = require('../fixtures/authFixtures');
const { expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { ProductPage } = require('../pages/ProductPage');
const { CartPage } = require('../pages/CartPage');
const { PAGE_TITLE, PRODUCT_PAGE_URL } = require('../utils/constants');

test('Cart — Guest user can add a product to cart', async ({ page }) => {
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);

  await homePage.goto();
  await expect(page).toHaveTitle(PAGE_TITLE);

  await homePage.openFirstProduct();
  await expect(page).toHaveURL(PRODUCT_PAGE_URL);
  await expect(productPage.productName).toBeVisible();

  const expectedName = await productPage.getProductName();

  await productPage.addToCart();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(1);
  await expect(cartPage.getRowCell(0, 1)).toContainText(expectedName);
});

test('Cart — Cart displays full list when multiple products are added', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);

  await homePage.openProduct(0);
  await expect(productPage.productName).toBeVisible();
  const firstName = await productPage.getProductName();
  const firstPrice = await productPage.getProductPrice();
  await productPage.addToCart();

  await homePage.goto();
  await homePage.openProduct(1);
  await expect(productPage.productName).toBeVisible();
  const secondName = await productPage.getProductName();
  const secondPrice = await productPage.getProductPrice();
  await productPage.addToCart();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(2);

  const names = [
    await cartPage.getRowCell(0, 1).textContent(),
    await cartPage.getRowCell(1, 1).textContent(),
  ];
  const prices = [
    await cartPage.getRowCell(0, 2).textContent(),
    await cartPage.getRowCell(1, 2).textContent(),
  ];

  expect(names).toContain(firstName);
  expect(names).toContain(secondName);
  expect(prices).toContain(firstPrice);
  expect(prices).toContain(secondPrice);
});

test('Cart — Total reflects all added items', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);

  await homePage.openProduct(0);
  await expect(productPage.productName).toBeVisible();
  const firstPrice = await productPage.getProductPrice();
  await productPage.addToCart();

  await homePage.goto();
  await homePage.openProduct(1);
  await expect(productPage.productName).toBeVisible();
  const secondPrice = await productPage.getProductPrice();
  await productPage.addToCart();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(2);

  const expectedTotal = String(Number(firstPrice) + Number(secondPrice));
  await expect(cartPage.cartTotal).toHaveText(expectedTotal);
});

test('Cart — Authenticated user can add a product to cart', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);

  await homePage.openFirstProduct();
  await expect(page).toHaveURL(PRODUCT_PAGE_URL);
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
