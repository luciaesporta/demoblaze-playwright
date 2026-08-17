import { test, expect } from '../fixtures/authFixtures';
import { step, attachment } from 'allure-js-commons';
import type { Page } from '@playwright/test';
import type { Result } from 'axe-core';
import { HomePage } from '../pages/HomePage';
import { AuthPage } from '../pages/AuthPage';
import { CartPage } from '../pages/CartPage';
import { generateUser } from '../utils/testData';
import { MESSAGES } from '../utils/constants';
import { checkA11y, formatViolations } from '../utils/a11y';

/** Axe rules that fail when an interactive element has no accessible name. */
const INTERACTIVE_NAME_RULES = [
  'button-name',
  'link-name',
  'input-button-name',
  'aria-command-name',
  'aria-input-field-name',
  'label',
];

/** Runs a scan and attaches the formatted report to Allure under a labelled step. */
async function scanAndAttach(page: Page, label: string): Promise<Result[]> {
  const violations = await step(`Run axe scan against WCAG 2.1 AA — ${label}`, () =>
    checkA11y(page),
  );
  await attachment(`Axe scan — ${label}`, formatViolations(violations), 'text/plain');
  return violations;
}

test.describe('A11y — Axe scan (home page)', { tag: '@regression' }, () => {
  test('home page passes axe WCAG 2.1 AA scan', async ({ page }) => {
    // Known defects: the navbar brand and carousel images ship without alt text
    // (critical `image-alt`), and the site also violates `link-name` and
    // `color-contrast`. Expected to fail until those are fixed upstream.
    test.fail();
    const homePage = new HomePage(page);

    await step('Load home page', async () => {
      await homePage.goto();
      await expect(homePage.firstProductLink).toBeVisible();
    });

    const violations = await scanAndAttach(page, 'home page');

    // Soft assertions first so the full list of broken rules is reported in a
    // single run instead of stopping at the first one.
    for (const violation of violations) {
      expect.soft(violation.nodes, formatViolations([violation])).toHaveLength(0);
    }

    const critical = violations.filter((violation) => violation.impact === 'critical');
    expect(critical, formatViolations(critical)).toEqual([]);
  });
});

test.describe('A11y — Axe scan (cart page)', { tag: '@regression' }, () => {
  test('empty cart passes axe WCAG 2.1 AA scan', async ({ page }) => {
    // Known defects: navbar and footer images ship without alt text (critical
    // `image-alt`), plus `color-contrast`. Expected to fail until fixed upstream.
    test.fail();
    const cartPage = new CartPage(page);

    await step('Open empty cart', async () => {
      await cartPage.goto();
      // The total is an empty node on an empty cart, so it is never "visible".
      // Anchor on Place Order, which is always rendered.
      await expect(cartPage.placeOrderButton).toBeVisible();
      await expect(cartPage.cartRows).toHaveCount(0);
    });

    const violations = await scanAndAttach(page, 'empty cart');

    for (const violation of violations) {
      expect.soft(violation.nodes, formatViolations([violation])).toHaveLength(0);
    }

    const critical = violations.filter((violation) => violation.impact === 'critical');
    expect(critical, formatViolations(critical)).toEqual([]);
  });

  test('cart with a product passes axe WCAG 2.1 AA scan', async ({ cartWithOneProduct }) => {
    // Same upstream defects as the empty cart; the product row adds no new rules
    // but is scanned separately because it renders the table and Delete links.
    test.fail();
    const { page } = cartWithOneProduct;
    const cartPage = new CartPage(page);

    await step('Open cart holding one product', async () => {
      await cartPage.goto();
      await expect(cartPage.cartRows).toHaveCount(1);
    });

    const violations = await scanAndAttach(page, 'cart with one product');

    for (const violation of violations) {
      expect.soft(violation.nodes, formatViolations([violation])).toHaveLength(0);
    }

    const critical = violations.filter((violation) => violation.impact === 'critical');
    expect(critical, formatViolations(critical)).toEqual([]);
  });

  test('cart interactive elements expose accessible names', async ({ cartWithOneProduct }) => {
    const { page } = cartWithOneProduct;
    const cartPage = new CartPage(page);

    await step('Open cart holding one product', async () => {
      await cartPage.goto();
      await expect(cartPage.cartRows).toHaveCount(1);
    });

    await step('Verify controls are reachable by their accessible name', async () => {
      await expect(cartPage.placeOrderButton).toBeVisible();
      await expect(page.getByRole('link', { name: 'Delete' })).toBeVisible();
    });

    const violations = await scanAndAttach(page, 'cart with one product');
    const nameViolations = violations.filter((violation) =>
      INTERACTIVE_NAME_RULES.includes(violation.id),
    );

    expect(nameViolations, formatViolations(nameViolations)).toEqual([]);
  });
});

test.describe('A11y — Login modal', { tag: '@regression' }, () => {
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

test.describe('A11y — Sign up modal', { tag: '@regression' }, () => {
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

test.describe('A11y — Labels', { tag: '@regression' }, () => {
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

test.describe('A11y — Images', { tag: '@regression' }, () => {
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

test.describe('A11y — Semantics', { tag: '@regression' }, () => {
  test('home page has correct heading hierarchy', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    await homePage.goto();
    await expect(homePage.firstProductLink).toBeVisible();

    const hierarchy = await page.evaluate(() => {
      const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
      const visible = Array.from(headings).filter((h) => (h as HTMLElement).offsetParent !== null);
      const levels = visible.map((h) => parseInt(h.tagName.charAt(1), 10));
      const hasH1 = levels.includes(1);
      const noSkips = levels.every((level, i) => i === 0 || level <= (levels[i - 1] ?? 0) + 1);
      return { hasH1, noSkips };
    });

    expect(hierarchy.hasH1).toBe(true);
    expect(hierarchy.noSkips).toBe(true);
  });
});

test.describe('A11y — Error visibility and contrast', { tag: '@regression' }, () => {
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
          : ([255, 255, 255] as [number, number, number]);
        const fgLum = luminance(...fg);
        const bgLum = luminance(...bg);
        return contrastRatio(fgLum, bgLum) >= WCAG_AA_NORMAL;
      });
    });
    expect(meetsContrast).toBe(true);
  });
});
