const { test: base } = require('@playwright/test');
const { AuthPage } = require('../pages/AuthPage');
const { generateUser } = require('../utils/userData');

const test = base.extend({
  authenticatedPage: async ({ page }, use) => {
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await authPage.register(username, password);
    await authPage.login(username, password);

    await use({ page, username });
  },
});

module.exports = { test };
