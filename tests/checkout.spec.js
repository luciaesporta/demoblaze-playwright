const { test } = require('../fixtures/authFixtures');
const { expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { ProductPage } = require('../pages/ProductPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');
const { DEFAULT_ORDER } = require('../utils/userData');

test('Checkout — Successful purchase with all fields completed', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage = new CheckoutPage(page);

  await homePage.openProduct(0);
  await productPage.addToCart();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(1);

  await cartPage.openPlaceOrderModal();
  await expect(cartPage.orderModal).toBeVisible();

  await checkoutPage.fillOrderForm(DEFAULT_ORDER);

  await checkoutPage.submitPurchase();

  await expect(checkoutPage.confirmationTitle).toHaveText('Thank you for your purchase!');
  await expect(checkoutPage.confirmationBody).toContainText('1234567890123456');

  await checkoutPage.dismissConfirmation();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(0);
});

test('Checkout — Purchase cannot be submitted with mandatory fields empty', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage = new CheckoutPage(page);

  await homePage.openProduct(0);
  await productPage.addToCart();

  await cartPage.goto();
  await cartPage.openPlaceOrderModal();
  await expect(cartPage.orderModal).toBeVisible();

  await checkoutPage.clickPurchase();

  await expect(checkoutPage.confirmationModal).not.toBeVisible();
  await expect(cartPage.orderModal).toBeVisible();
});

test('Checkout — Credit card field rejects non-numeric characters', async ({ authenticatedPage }) => {
  // BUG: demoblaze accepts any value in the credit card field and processes
  // the purchase without validation. This test is marked as expected to fail
  // and should be removed once proper numeric validation is implemented.
  test.fail();
  const { page } = authenticatedPage;
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage = new CheckoutPage(page);

  await homePage.openProduct(0);
  await productPage.addToCart();

  await cartPage.goto();
  await cartPage.openPlaceOrderModal();
  await expect(cartPage.orderModal).toBeVisible();

  await checkoutPage.fillOrderForm({ ...DEFAULT_ORDER, creditCard: 'abcd' });

  await checkoutPage.clickPurchase();

  await expect(checkoutPage.confirmationModal).not.toBeVisible();
  await expect(cartPage.orderModal).toBeVisible();

  await checkoutPage.fillCreditCard('@@##');
  await checkoutPage.clickPurchase();

  await expect(checkoutPage.confirmationModal).not.toBeVisible();
  await expect(cartPage.orderModal).toBeVisible();
});

test('Checkout — Total in modal matches cart total', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage = new CheckoutPage(page);

  await homePage.openProduct(0);
  await productPage.addToCartAndCapture();

  await homePage.goto();
  await homePage.openProduct(1);
  await productPage.addToCartAndCapture();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(2);
  const cartTotal = await cartPage.getTotal();

  await cartPage.openPlaceOrderModal();
  await expect(cartPage.orderModal).toBeVisible();

  const modalTotal = await checkoutPage.getModalTotal();

  expect(modalTotal).toBe(cartTotal);
});

test('Checkout — Order confirmation message contains purchase details', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage = new CheckoutPage(page);

  await homePage.openProduct(0);
  await productPage.addToCart();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(1);
  await cartPage.openPlaceOrderModal();
  await expect(cartPage.orderModal).toBeVisible();

  const modalTotal = await checkoutPage.getModalTotal();

  await checkoutPage.fillOrderForm(DEFAULT_ORDER);

  await checkoutPage.submitPurchase();

  const { id, amount } = await checkoutPage.getConfirmationDetails();

  expect(id).toBeTruthy();
  expect(amount).toBe(modalTotal);
});

test('Checkout — Credit card field validates length', async ({ authenticatedPage }) => {
  // BUG: demoblaze accepts any credit card value regardless of digit count and
  // processes the purchase without length validation. This test is marked as
  // expected to fail and should be removed once proper 16-digit validation is
  // implemented.
  test.fail();
  const { page } = authenticatedPage;
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage = new CheckoutPage(page);

  await homePage.openProduct(0);
  await productPage.addToCart();

  await cartPage.goto();
  await cartPage.openPlaceOrderModal();
  await expect(cartPage.orderModal).toBeVisible();

  await checkoutPage.fillOrderFormWithShortCard(DEFAULT_ORDER);

  await checkoutPage.clickPurchase();

  await expect(checkoutPage.confirmationModal).not.toBeVisible();
  await expect(cartPage.orderModal).toBeVisible();
  await checkoutPage.fillOrderFormWithLongCard();
  await checkoutPage.clickPurchase();

  await expect(checkoutPage.confirmationModal).not.toBeVisible();
  await expect(cartPage.orderModal).toBeVisible();
});

test('Checkout — Modal can be dismissed without placing an order', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);

  await homePage.openProduct(0);
  const { name: expectedName, price: expectedPrice } = await productPage.addToCartAndCapture();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(1);
  const totalBefore = await cartPage.getTotal();

  await cartPage.openPlaceOrderModal();
  await expect(cartPage.orderModal).toBeVisible();
  await cartPage.closePlaceOrderModal();

  await expect(cartPage.orderModal).not.toBeVisible();
  await expect(cartPage.cartRows).toHaveCount(1);
  await expect(cartPage.getRowCell(0, 1)).toContainText(expectedName);
  await expect(cartPage.getRowCell(0, 2)).toContainText(expectedPrice);
  await expect(cartPage.cartTotal).toHaveText(totalBefore);
});
