import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';
import { generateUser } from '../utils/testData';

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
