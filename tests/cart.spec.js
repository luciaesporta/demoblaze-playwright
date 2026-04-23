const { test } = require('../fixtures/authFixtures');
const { expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { ProductPage } = require('../pages/ProductPage');
const { CartPage } = require('../pages/CartPage');
const { PAGE_TITLE, PRODUCT_PAGE_URL } = require('../utils/constants');

test('Cart — Cart persists across page navigation', async ({ cartWithOneProduct }) => {
  const { page, name: expectedName, price: expectedPrice } = cartWithOneProduct;
  const homePage = new HomePage(page);
  const cartPage = new CartPage(page);

  await homePage.goto();
  await homePage.openCategory('Laptops');
  await cartPage.goto();

  await expect(cartPage.cartRows).toHaveCount(1);
  await expect(cartPage.getRowCell(0, 1)).toContainText(expectedName);
  await expect(cartPage.cartTotal).toHaveText(expectedPrice);
});

test('Cart — Empty cart shows no items and blank total', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  const cartPage = new CartPage(page);

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(0);
  const total = await cartPage.getTotal();
  expect(total === '' || total === '0').toBeTruthy();
});

test('Cart — Guest user can add a product to cart', async ({ page }) => {
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);

  await homePage.goto();
  await expect(page).toHaveTitle(PAGE_TITLE);

  await homePage.openFirstProduct();
  await expect(page).toHaveURL(PRODUCT_PAGE_URL);
  const { name: expectedName } = await productPage.addToCartAndCapture();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(1);
  await expect(cartPage.getRowCell(0, 1)).toContainText(expectedName);
});

test('Cart — Cart displays full list when multiple products are added', async ({ cartWithTwoProducts }) => {
  const { page, first: { name: firstName, price: firstPrice }, second: { name: secondName, price: secondPrice } } = cartWithTwoProducts;
  const cartPage = new CartPage(page);

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(2);

  const names = [
    await cartPage.getItemName(0),
    await cartPage.getItemName(1),
  ];
  const prices = [
    await cartPage.getItemPrice(0),
    await cartPage.getItemPrice(1),
  ];

  expect(names).toContain(firstName);
  expect(names).toContain(secondName);
  expect(prices).toContain(firstPrice);
  expect(prices).toContain(secondPrice);
});

test('Cart — Total reflects all added items', async ({ cartWithTwoProducts }) => {
  const { page, first: { price: firstPrice }, second: { price: secondPrice } } = cartWithTwoProducts;
  const cartPage = new CartPage(page);

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(2);

  const expectedTotal = String(Number(firstPrice) + Number(secondPrice));
  await expect(cartPage.cartTotal).toHaveText(expectedTotal);
});

test('Cart — Deleting an item updates the cart correctly', async ({ cartWithTwoProducts }) => {
  const { page, first: { name: firstName, price: firstPrice }, second: { name: secondName, price: secondPrice } } = cartWithTwoProducts;
  const cartPage = new CartPage(page);

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(2);

  const names = [
    await cartPage.getItemName(0),
    await cartPage.getItemName(1),
  ];
  const deleteIndex = names.indexOf(firstName) !== -1 ? names.indexOf(firstName) : 0;
  const deletedName = await cartPage.getItemName(deleteIndex);
  const deletedPrice = Number(await cartPage.getItemPrice(deleteIndex));

  await cartPage.deleteRow(deleteIndex);
  await expect(cartPage.cartRows).toHaveCount(1);

  const remainingName = await cartPage.getItemName(0);
  expect(remainingName).not.toBe(deletedName);

  const expectedTotal = String(Number(firstPrice) + Number(secondPrice) - deletedPrice);
  await expect(cartPage.cartTotal).toHaveText(expectedTotal);
});

test('Cart — Cart state is preserved after interrupting the purchase flow', async ({ cartWithOneProduct }) => {
  const { page, name: expectedName, price: expectedPrice } = cartWithOneProduct;
  const cartPage = new CartPage(page);

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(1);
  const totalBefore = await cartPage.getTotal();

  await cartPage.openPlaceOrderModal();
  await expect(cartPage.orderModal).toBeVisible();
  await cartPage.closePlaceOrderModal();

  await expect(cartPage.cartRows).toHaveCount(1);
  await expect(cartPage.getRowCell(0, 1)).toContainText(expectedName);
  await expect(cartPage.getRowCell(0, 2)).toContainText(expectedPrice);
  await expect(cartPage.cartTotal).toHaveText(totalBefore);
});

test('Cart — Adding the same product twice results in two rows', async ({ cartWithOneProduct }) => {
  const { page, name: productName, price: productPrice } = cartWithOneProduct;
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);

  await homePage.goto();
  await homePage.openFirstProduct();
  await productPage.addToCartAndCapture();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(2);

  const row0Name = await cartPage.getItemName(0);
  const row1Name = await cartPage.getItemName(1);
  expect(row0Name).toBe(productName);
  expect(row1Name).toBe(productName);

  const expectedTotal = String(Number(productPrice) * 2);
  await expect(cartPage.cartTotal).toHaveText(expectedTotal);
});

test('Cart — Authenticated user can add a product to cart', async ({ cartWithOneProduct }) => {
  const { page, name: expectedName, price: expectedPrice } = cartWithOneProduct;
  const cartPage = new CartPage(page);

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(1);
  await expect(cartPage.getRowCell(0, 1)).toContainText(expectedName);
  await expect(cartPage.getRowCell(0, 2)).toContainText(expectedPrice);
  await expect(cartPage.cartTotal).toHaveText(expectedPrice);
});
