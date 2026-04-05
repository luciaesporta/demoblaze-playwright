const { test, expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { ProductPage } = require('../pages/ProductPage');
const { CartPage } = require('../pages/CartPage');

test('Add a product to the cart as guest user', async ({ page }) => {
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  const cartPage = new CartPage(page);

  await homePage.goto();
  await expect(page).toHaveTitle(/STORE/);

  await homePage.openFirstProduct();
  await expect(page).toHaveURL(/prod\.html/);
  await expect(productPage.productName).toBeVisible();

  await productPage.addToCart();

  await cartPage.goto();
  await expect(cartPage.cartRows).toHaveCount(1);
  await expect(cartPage.getRowCell(0, 1)).toContainText('Samsung');
});
