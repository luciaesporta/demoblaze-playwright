import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';
import {
  generateUser,
  INVALID_LOGIN_SCENARIOS,
  type TestUser,
} from '../utils/testData';
import { MESSAGES } from '../utils/constants';

test.describe('Auth', () => {
  test('successful user registration', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    const message = await authPage.register(username, password);

    expect(message).toContain(MESSAGES.signUpSuccess);
  });

  test('successful login after registration', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    await authPage.register(username, password);
    await authPage.login(username, password);

    await expect(authPage.loggedInUsername).toBeVisible();
    await expect(authPage.loggedInUsername).toContainText(username);
  });

  test('login and sign up forms reject empty submission', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

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

  test('password fields mask their input', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await homePage.goto();

    await expect(authPage.logInPassword).toHaveAttribute('type', 'password');
    await expect(authPage.signUpPassword).toHaveAttribute('type', 'password');
  });
});

test.describe('Auth — login with invalid credentials', () => {
  let registeredUser: TestUser;

  test.beforeAll(async ({ browser }) => {
    const page = await browser.newPage();
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    registeredUser = generateUser();
    await homePage.goto();
    await authPage.register(registeredUser.username, registeredUser.password);
    await page.close();
  });

  for (const scenario of INVALID_LOGIN_SCENARIOS) {
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
