const { test, expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { AuthPage } = require('../pages/AuthPage');
const { generateUser, invalidLoginScenarios } = require('../utils/userData');

test('Auth — Successful user registration', async ({ page }) => {
  const homePage = new HomePage(page);
  const authPage = new AuthPage(page);
  const { username, password } = generateUser();

  await homePage.goto();

  const message = await authPage.register(username, password);
  expect(message).toContain('Sign up successful');
});

test('Auth — Successful login', async ({ page }) => {
  const homePage = new HomePage(page);
  const authPage = new AuthPage(page);
  const { username, password } = generateUser();

  await homePage.goto();

  await authPage.register(username, password);
  await authPage.login(username, password);

  await expect(authPage.loggedInUsername).toBeVisible();
  await expect(authPage.loggedInUsername).toContainText(username);
});

test.describe('Auth — Login with invalid credentials', () => {
  let registeredUser;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    registeredUser = generateUser();
    await homePage.goto();
    await authPage.register(registeredUser.username, registeredUser.password);
    await page.close();
  });

  for (const scenario of invalidLoginScenarios) {
    test(`fails with ${scenario.description}`, async ({ page }) => {
      const homePage = new HomePage(page);
      const authPage = new AuthPage(page);
      const username = scenario.username ?? registeredUser.username;

      await homePage.goto();
      await authPage.loginExpectingError(username, scenario.password);

      await expect(authPage.loggedInUsername).not.toBeVisible();
    });
  }
});
