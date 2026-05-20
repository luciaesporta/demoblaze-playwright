import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';
import {
  generateUser,
  INVALID_LOGIN_SCENARIOS,
  INVALID_SIGNUP_SCENARIOS,
  SPECIAL_CHAR_SIGNUP_SCENARIOS,
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

  test('sign up rejects duplicate username', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    await authPage.register(username, password);
    const message = await authPage.register(username, password);

    expect(message).toContain(MESSAGES.signUpExists);
  });

  test('sign up safely handles basic SQL injection payload in username', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { password } = generateUser();
    const uniqueSuffix = Date.now().toString(36);
    const sqlInjectionUsername = `' OR '1'='1_${uniqueSuffix}`;

    await homePage.goto();
    const message = await authPage.register(sqlInjectionUsername, password);

    expect(message).toContain(MESSAGES.signUpSuccess);
  });

  test('sign up accepts username longer than 100 characters', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { password } = generateUser();
    const uniqueSuffix = Date.now().toString(36);
    const longUsername = `${'qa'.repeat(100)}_${uniqueSuffix}`;

    await homePage.goto();
    const message = await authPage.register(longUsername, password);

    expect(message).toContain(MESSAGES.signUpSuccess);
  });

  test('login username is case-sensitive', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    await authPage.register(username, password);
    const message = await authPage.loginExpectingError(username.toUpperCase(), password);

    expect(message).toContain(MESSAGES.loginUserNotFound);
    await expect(authPage.loggedInUsername).not.toBeVisible();
  });

  test('login does not trim leading or trailing whitespace from username', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    await authPage.register(username, password);
    const message = await authPage.loginExpectingError(`  ${username}  `, password);

    expect(message).toContain(MESSAGES.loginUserNotFound);
    await expect(authPage.loggedInUsername).not.toBeVisible();
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

test.describe('Auth — sign up field validation', () => {
  for (const scenario of INVALID_SIGNUP_SCENARIOS) {
    test(`sign up fails with ${scenario.description}`, async ({ page }) => {
      const homePage = new HomePage(page);
      const authPage = new AuthPage(page);

      await homePage.goto();
      const message = await authPage.submitSignUpAndCaptureMessage(
        scenario.username,
        scenario.password,
      );

      expect(message).toContain(MESSAGES.signUpMissingFields);
      await expect(authPage.signUpModal).toBeVisible();
      await expect(authPage.loggedInUsername).not.toBeVisible();
    });
  }
});

test.describe('Auth — sign up with special characters in username', () => {
  for (const scenario of SPECIAL_CHAR_SIGNUP_SCENARIOS) {
    test(`accepts username with ${scenario.description}`, async ({ page }) => {
      const homePage = new HomePage(page);
      const authPage = new AuthPage(page);
      const { password } = generateUser();
      const uniqueSuffix = Date.now().toString(36);
      const username = `qa${scenario.usernameChars}user_${uniqueSuffix}`;

      await homePage.goto();
      const message = await authPage.register(username, password);

      expect(message).toContain(MESSAGES.signUpSuccess);
    });
  }
});
