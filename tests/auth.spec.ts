import { test, expect } from '@playwright/test';
import { step } from 'allure-js-commons';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import {
  generateUser,
  INVALID_LOGIN_SCENARIOS,
  INVALID_SIGNUP_SCENARIOS,
  SPECIAL_CHAR_SIGNUP_SCENARIOS,
  type TestUser,
} from '../utils/testData';
import { MESSAGES } from '../utils/constants';

test.describe('Auth', () => {
  test('successful user registration', { tag: '@smoke' }, async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await step('Open home page', async () => {
      await homePage.goto();
    });

    await step('Register new user', async () => {
      const message = await authPage.register(username, password);
      expect(message).toContain(MESSAGES.signUpSuccess);
    });
  });

  test('sign up rejects duplicate username', { tag: '@regression' }, async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    await authPage.register(username, password);
    const message = await authPage.register(username, password);

    expect(message).toContain(MESSAGES.signUpExists);
  });

  test(
    'sign up safely handles XSS payload in username (no script execution)',
    { tag: '@regression' },
    async ({ page }) => {
      const homePage = new HomePage(page);
      const authPage = new AuthPage(page);
      const { password } = generateUser();
      const uniqueSuffix = Date.now().toString(36);
      const xssUsername = `<script>alert(1)</script>_${uniqueSuffix}`;

      await homePage.goto();
      await authPage.register(xssUsername, password);

      const unexpectedDialogs: string[] = [];
      page.on('dialog', async (dialog) => {
        unexpectedDialogs.push(dialog.message());
        await dialog.dismiss();
      });

      await authPage.login(xssUsername, password);

      expect(unexpectedDialogs).toEqual([]);
      expect(await authPage.loggedInUsernameInnerHTML()).toContain('&lt;script&gt;');
      await expect(authPage.loggedInUsername).toContainText(xssUsername);
    },
  );

  test(
    'sign up safely handles basic SQL injection payload in username',
    { tag: '@regression' },
    async ({ page }) => {
      const homePage = new HomePage(page);
      const authPage = new AuthPage(page);
      const { password } = generateUser();
      const uniqueSuffix = Date.now().toString(36);
      const sqlInjectionUsername = `' OR '1'='1_${uniqueSuffix}`;

      await homePage.goto();
      const message = await authPage.register(sqlInjectionUsername, password);

      expect(message).toContain(MESSAGES.signUpSuccess);
    },
  );

  test(
    'sign up accepts username longer than 100 characters',
    { tag: '@regression' },
    async ({ page }) => {
      const homePage = new HomePage(page);
      const authPage = new AuthPage(page);
      const { password } = generateUser();
      const uniqueSuffix = Date.now().toString(36);
      const longUsername = `${'qa'.repeat(100)}_${uniqueSuffix}`;

      await homePage.goto();
      const message = await authPage.register(longUsername, password);

      expect(message).toContain(MESSAGES.signUpSuccess);
    },
  );

  test('login username is case-sensitive', { tag: '@regression' }, async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    await authPage.register(username, password);
    const message = await authPage.loginExpectingError(username.toUpperCase(), password);

    expect(message).toContain(MESSAGES.loginUserNotFound);
    await expect(authPage.loggedInUsername).toBeHidden();
  });

  test(
    'login does not trim leading or trailing whitespace from username',
    { tag: '@regression' },
    async ({ page }) => {
      const homePage = new HomePage(page);
      const authPage = new AuthPage(page);
      const { username, password } = generateUser();

      await homePage.goto();
      await authPage.register(username, password);
      const message = await authPage.loginExpectingError(`  ${username}  `, password);

      expect(message).toContain(MESSAGES.loginUserNotFound);
      await expect(authPage.loggedInUsername).toBeHidden();
    },
  );

  test('successful login after registration', { tag: '@smoke' }, async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await step('Register new user', async () => {
      await homePage.goto();
      await authPage.register(username, password);
    });

    await step('Login with registered user', async () => {
      await authPage.login(username, password);
    });

    await step('Verify logged in', async () => {
      await expect(authPage.loggedInUsername).toBeVisible();
      await expect(authPage.loggedInUsername).toContainText(username);
    });
  });

  test(
    'login and sign up forms reject empty submission',
    { tag: '@regression' },
    async ({ page }) => {
      const homePage = new HomePage(page);
      const authPage = new AuthPage(page);

      await homePage.goto();

      await authPage.openLoginModal();
      await authPage.submitEmptyLogin();
      await expect(authPage.logInModal).toBeVisible();
      await expect(authPage.loggedInUsername).toBeHidden();

      await homePage.goto();

      await authPage.openSignUpModal();
      await authPage.submitEmptySignUp();
      await expect(authPage.signUpModal).toBeVisible();
    },
  );

  test(
    'login modal fields are cleared after closing with X and reopening',
    { tag: '@regression' },
    async ({ page }) => {
      test.fail();
      const homePage = new HomePage(page);
      const authPage = new AuthPage(page);

      await homePage.goto();
      await authPage.fillLoginAndCloseWithX('testuser', 'testpass');
      await authPage.openLoginModal();

      expect(await authPage.loginFieldValues()).toEqual({ username: '', password: '' });
    },
  );

  test('ESC key closes login modal', { tag: '@regression' }, async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await homePage.goto();
    await authPage.openLoginModal();
    await authPage.pressEscOnLoginModal();

    await expect(authPage.logInModal).not.toBeVisible({ timeout: 3_000 });
  });

  test('ESC key closes sign up modal', { tag: '@regression' }, async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await homePage.goto();
    await authPage.openSignUpModal();
    await authPage.pressEscOnSignUpModal();

    await expect(authPage.signUpModal).not.toBeVisible({ timeout: 3_000 });
  });

  test('clicking outside closes login modal', { tag: '@regression' }, async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await homePage.goto();
    await authPage.openLoginModal();
    await authPage.clickOutsideLoginModal();

    await expect(authPage.logInModal).not.toBeVisible({ timeout: 3_000 });
  });

  test('clicking outside closes sign up modal', { tag: '@regression' }, async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await homePage.goto();
    await authPage.openSignUpModal();
    await authPage.clickOutsideSignUpModal();

    await expect(authPage.signUpModal).not.toBeVisible({ timeout: 3_000 });
  });

  test('password fields mask their input', { tag: '@regression' }, async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await homePage.goto();

    await expect(authPage.logInPassword).toHaveAttribute('type', 'password');
    await expect(authPage.signUpPassword).toHaveAttribute('type', 'password');
  });
});

test.describe('Auth — login with invalid credentials', { tag: '@regression' }, () => {
  let registeredUser: TestUser;

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    registeredUser = generateUser();
    await homePage.goto();
    await authPage.register(registeredUser.username, registeredUser.password);
    await context.close();
  });

  for (const scenario of INVALID_LOGIN_SCENARIOS) {
    test(`fails with ${scenario.description}`, async ({ page }) => {
      const homePage = new HomePage(page);
      const authPage = new AuthPage(page);
      const username = scenario.username ?? registeredUser.username;

      await homePage.goto();
      await authPage.loginExpectingError(username, scenario.password);

      await expect(authPage.loggedInUsername).toBeHidden();
    });
  }
});

test.describe('Auth — session persistence', { tag: '@regression' }, () => {
  test('session persists after page refresh', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    await authPage.register(username, password);
    await authPage.login(username, password);

    await expect(authPage.loggedInUsername).toBeVisible();

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(authPage.loggedInUsername).toBeVisible();
    await expect(authPage.loggedInUsername).toContainText(username);
  });

  test('session persists after closing and reopening tab', async ({ context }) => {
    const page = await context.newPage();
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    await authPage.register(username, password);
    await authPage.login(username, password);
    await expect(authPage.loggedInUsername).toBeVisible();

    await page.close();

    const newPage = await context.newPage();
    const newHomePage = new HomePage(newPage);
    const newAuthPage = new AuthPage(newPage);

    await newHomePage.goto();

    await expect(newAuthPage.loggedInUsername).toBeVisible();
    await expect(newAuthPage.loggedInUsername).toContainText(username);
  });

  test('logout clears the cart', async ({ page }, testInfo) => {
    testInfo.setTimeout(120_000);
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    await authPage.register(username, password);
    await authPage.login(username, password);
    await expect(authPage.loggedInUsername).toBeVisible();

    await homePage.openProduct(0);
    await productPage.addToCart();
    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(1);

    await authPage.logout();
    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(0);
  });

  test('consecutive logins with different users switch session correctly', async ({
    page,
  }, testInfo) => {
    testInfo.setTimeout(120_000);
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const userA = generateUser();
    const userB = generateUser();

    await homePage.goto();
    await authPage.register(userA.username, userA.password);
    await authPage.login(userA.username, userA.password);
    await expect(authPage.loggedInUsername).toContainText(userA.username);

    await authPage.logout();
    await expect(authPage.logInNavButton).toBeVisible();

    await authPage.register(userB.username, userB.password);
    await authPage.login(userB.username, userB.password);
    await expect(authPage.loggedInUsername).toContainText(userB.username);
  });
});

test.describe('Auth — sign up field validation', { tag: '@regression' }, () => {
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
      await expect(authPage.loggedInUsername).toBeHidden();
    });
  }
});

test.describe('Auth — sign up with special characters in username', { tag: '@regression' }, () => {
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
