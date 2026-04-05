const { test, expect } = require('@playwright/test');
const { HomePage } = require('../pages/HomePage');
const { AuthPage } = require('../pages/AuthPage');
const { generateUser } = require('../utils/userData');

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
