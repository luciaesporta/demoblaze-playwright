const { test } = require('../fixtures/authFixtures');
const { expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { ProductPage } = require('../pages/ProductPage');
const { CartPage } = require('../pages/CartPage');
const { CheckoutPage } = require('../pages/CheckoutPage');

test('Checkout — Successful purchase with all fields completed', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);
  const checkoutPage = new CheckoutPage(page);

  await homePage.openProduct(0);
  await expect(productPage.productName).toBeVisible();
  await productPage.addToCart();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(1);

  await cartPage.openPlaceOrderModal();
  await expect(cartPage.orderModal).toBeVisible();

  await checkoutPage.fillOrderForm({
    name: 'Test User',
    country: 'Spain',
    city: 'Madrid',
    creditCard: '1234567890123456',
    month: 'April',
    year: '2026',
  });

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
  await expect(productPage.productName).toBeVisible();
  await productPage.addToCart();

  await cartPage.goto();
  await cartPage.openPlaceOrderModal();
  await expect(cartPage.orderModal).toBeVisible();

  await checkoutPage.clickPurchase();

  await expect(checkoutPage.confirmationModal).not.toBeVisible();
  await expect(cartPage.orderModal).toBeVisible();
});
