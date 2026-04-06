const { test: base } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { AuthPage } = require('../pages/AuthPage');
const { generateUser } = require('../utils/userData');

const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    await authPage.register(username, password);
    await authPage.login(username, password);

    await use({ page, username });
  },
});

module.exports = { test };
