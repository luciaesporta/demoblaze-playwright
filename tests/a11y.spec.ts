import { test, expect } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';

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
});
