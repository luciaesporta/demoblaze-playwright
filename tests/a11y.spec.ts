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

test.describe('A11y — Error visibility and contrast', () => {
  test('login error displays inline feedback, not just alert', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);

    await homePage.goto();
    await authPage.loginExpectingError('nonexistent_user_xyz', 'wrongpass');

    const hasInlineError = await page.evaluate(() => {
      const modal = document.querySelector('#logInModal');
      if (!modal) return false;
      const errorElements = modal.querySelectorAll(
        '.alert, .error, .invalid-feedback, .text-danger, [role="alert"]',
      );
      return errorElements.length > 0;
    });
    expect(hasInlineError).toBe(true);
  });

  test('product card text meets WCAG AA contrast ratio', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await expect(homePage.firstProductLink).toBeVisible();

    const meetsContrast = await page.evaluate(() => {
      function luminance(r: number, g: number, b: number): number {
        const srgb = [r, g, b].map((c) => {
          const s = c / 255;
          return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * srgb[0]! + 0.7152 * srgb[1]! + 0.0722 * srgb[2]!;
      }

      function parseColor(color: string): [number, number, number] {
        const match = color.match(/\d+/g);
        if (!match) return [0, 0, 0];
        return [parseInt(match[0]!, 10), parseInt(match[1]!, 10), parseInt(match[2]!, 10)];
      }

      function contrastRatio(l1: number, l2: number): number {
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        return (lighter + 0.05) / (darker + 0.05);
      }

      const cards = document.querySelectorAll('.card-title a');
      const WCAG_AA_NORMAL = 4.5;
      return Array.from(cards).every((card) => {
        const style = window.getComputedStyle(card);
        const fg = parseColor(style.color);
        const parent = card.closest('.card-body');
        const bg = parent
          ? parseColor(window.getComputedStyle(parent).backgroundColor)
          : [255, 255, 255] as [number, number, number];
        const fgLum = luminance(...fg);
        const bgLum = luminance(...bg);
        return contrastRatio(fgLum, bgLum) >= WCAG_AA_NORMAL;
      });
    });
    expect(meetsContrast).toBe(true);
  });
});
