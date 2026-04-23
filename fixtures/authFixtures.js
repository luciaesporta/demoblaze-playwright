const { test: base } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { HomePage } = require('../pages/HomePage');
const { ProductPage } = require('../pages/ProductPage');
const { generateUser } = require('../utils/userData');

const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await authPage.register(username, password);
    await authPage.login(username, password);

    await use({ page, username });
  },

  cartWithTwoProducts: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const { username, password } = generateUser();

    await authPage.register(username, password);
    await authPage.login(username, password);

    await homePage.goto();
    await homePage.openProduct(0);
    const first = await productPage.addToCartAndCapture();

    await homePage.goto();
    await homePage.openProduct(1);
    const second = await productPage.addToCartAndCapture();

    await use({ page, first, second });
  },

  cartWithOneProduct: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const { username, password } = generateUser();

    await authPage.register(username, password);
    await authPage.login(username, password);

    await homePage.goto();
    await homePage.openFirstProduct();
    const { name, price } = await productPage.addToCartAndCapture();

    await use({ page, name, price });
  },
});

module.exports = { test };
