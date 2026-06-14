import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';
import { generateUser } from '../utils/testData';
import { MESSAGES } from '../utils/constants';

test.describe('A11y — Login modal', () => {
  test('tab navigation follows logical focus order', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await homePage.goto();
    await authPage.openLoginModal();

    await authPage.logInUsername.click();
    await expect(authPage.logInUsername).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(authPage.logInPassword).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(authPage.logInSubmit).toBeFocused();

    await page.keyboard.press('Tab');
    await expect(authPage.logInModalCloseX).toBeFocused();
  });

  test('pressing Enter on password field submits login', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    await authPage.register(username, password);

    await authPage.openLoginModal();
    await authPage.logInUsername.fill(username);
    await authPage.logInPassword.fill(password);
    await authPage.logInPassword.press('Enter');

    await expect(authPage.logInModal).not.toBeVisible({ timeout: 5_000 });
    await expect(authPage.loggedInUsername).toBeVisible();
    await expect(authPage.loggedInUsername).toContainText(username);
  });
});

test.describe('A11y — Sign up modal', () => {
  test('pressing Enter on password field submits sign up', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();
    await authPage.openSignUpModal();
    await authPage.signUpUsername.fill(username);
    await authPage.signUpPassword.fill(password);

    const dialogPromise = page.waitForEvent('dialog', { timeout: 5_000 });
    await authPage.signUpPassword.press('Enter');
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();

    expect(message).toContain(MESSAGES.signUpSuccess);
  });
});

test.describe('A11y — Labels', () => {
  test('login modal inputs have associated labels', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await homePage.goto();
    await authPage.openLoginModal();

    const hasLabels = await page.evaluate(() => {
      const inputs = document.querySelectorAll('#logInModal input');
      return Array.from(inputs).every((input) => {
        const id = input.id;
        return !!document.querySelector(`label[for="${id}"]`);
      });
    });
    expect(hasLabels).toBe(true);
  });

  test('sign up modal inputs have associated labels', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await homePage.goto();
    await authPage.openSignUpModal();

    const hasLabels = await page.evaluate(() => {
      const inputs = document.querySelectorAll('#signInModal input');
      return Array.from(inputs).every((input) => {
        const id = input.id;
        return !!document.querySelector(`label[for="${id}"]`);
      });
    });
    expect(hasLabels).toBe(true);
  });

  test('contact modal inputs have associated labels', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);

    await homePage.goto();
    await homePage.openContactModal();

    const hasLabels = await page.evaluate(() => {
      const inputs = document.querySelectorAll('#exampleModal input, #exampleModal textarea');
      return Array.from(inputs).every((input) => {
        const id = input.id;
        return !!document.querySelector(`label[for="${id}"]`);
      });
    });
    expect(hasLabels).toBe(true);
  });
});

test.describe('A11y — Images', () => {
  test('product card images have alt text', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    await homePage.goto();
    await expect(homePage.firstProductLink).toBeVisible();

    const allHaveAlt = await page.evaluate(() => {
      const images = document.querySelectorAll('.card-img-top');
      return Array.from(images).every((img) => {
        const alt = img.getAttribute('alt');
        return alt !== null && alt.trim().length > 0;
      });
    });
    expect(allHaveAlt).toBe(true);
  });

  test('product detail image has alt text', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.openProduct(0);

    const hasAlt = await page.evaluate(() => {
      const img = document.querySelector('.product-image img, #imgp img');
      if (!img) return false;
      const alt = img.getAttribute('alt');
      return alt !== null && alt.trim().length > 0;
    });
    expect(hasAlt).toBe(true);
  });
});

test.describe('A11y — Semantics', () => {
  test('home page has correct heading hierarchy', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    await homePage.goto();
    await expect(homePage.firstProductLink).toBeVisible();

    const hierarchy = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const visible = Array.from(headings).filter(
        (h) => (h as HTMLElement).offsetParent !== null,
      );
      const levels = visible.map((h) => parseInt(h.tagName.charAt(1), 10));
      const hasH1 = levels.includes(1);
      const noSkips = levels.every(
        (level, i) => i === 0 || level <= (levels[i - 1] ?? 0) + 1,
      );
      return { hasH1, noSkips };
    });

    expect(hierarchy.hasH1).toBe(true);
    expect(hierarchy.noSkips).toBe(true);
  });
});
