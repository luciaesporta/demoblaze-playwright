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

test('Auth — Login and sign up forms reject empty submission', async ({ page }) => {
  const homePage = new HomePage(page);
  const authPage = new AuthPage(page);

  page.on('dialog', dialog => dialog.accept());

  await homePage.goto();

  await authPage.openLoginModal();
  await authPage.submitEmptyLogin();
  await expect(authPage.logInModal).toBeVisible();
  await expect(authPage.loggedInUsername).not.toBeVisible();

  await homePage.goto();

  await authPage.openSignUpModal();
  await authPage.submitEmptySignUp();
  await expect(authPage.signUpModal).toBeVisible();
});

test('Auth — Password field masks input', async ({ page }) => {
  const homePage = new HomePage(page);
  const authPage = new AuthPage(page);

  await homePage.goto();

  await expect(authPage.logInPassword).toHaveAttribute('type', 'password');
  await expect(authPage.signUpPassword).toHaveAttribute('type', 'password');
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
