import { test as base, type Page } from '@playwright/test';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { generateUser } from '../utils/testData';
import { AUTH_COOKIE_NAME, createUserViaAPI, loginViaAPI } from '../utils/apiHelpers';

const BASE_URL = process.env.BASE_URL || 'https://www.demoblaze.com';

export interface AuthenticatedSession {
  page: Page;
  username: string;
}

export interface CartWithOneProduct {
  page: Page;
  name: string;
  price: string;
}

export interface CartWithTwoProducts {
  page: Page;
  first: { name: string; price: string };
  second: { name: string; price: string };
}

interface Fixtures {
  authenticatedPage: AuthenticatedSession;
  cartWithOneProduct: CartWithOneProduct;
  cartWithTwoProducts: CartWithTwoProducts;
}

/**
 * Creates a signed-in session without touching the UI.
 *
 * Registering and logging in through the modals costs two page interactions
 * and two dialogs. Both calls have plain API equivalents, and demoblaze decides
 * who is signed in purely from the `tokenp_` cookie, so seeding that cookie is
 * enough for the browser to come up authenticated.
 *
 * Leaves the page on the home page, matching what the UI flow used to do, so
 * tests that assume they start there keep working.
 */
async function registerAndLogin(page: Page): Promise<string> {
  const { username, password } = generateUser();
  const request = page.request;

  await createUserViaAPI(username, password, { request });
  const token = await loginViaAPI(username, password, { request });

  await page.context().addCookies([
    {
      name: AUTH_COOKIE_NAME,
      value: token,
      url: BASE_URL,
    },
  ]);

  // The cookie is only read on load, so the page has to be (re)loaded for the
  // session to take effect.
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  return username;
}

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    const username = await registerAndLogin(page);
    await use({ page, username });
  },

  cartWithOneProduct: async ({ page }, use) => {
    await registerAndLogin(page);
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);

    await homePage.goto();
    await homePage.openFirstProduct();
    const { name, price } = await productPage.addToCartAndCapture();

    await use({ page, name, price });
  },

  cartWithTwoProducts: async ({ page }, use) => {
    await registerAndLogin(page);
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);

    await homePage.goto();
    await homePage.openProduct(0);
    const first = await productPage.addToCartAndCapture();

    await homePage.goto();
    await homePage.openProduct(1);
    const second = await productPage.addToCartAndCapture();

    await use({ page, first, second });
  },
});

export { expect } from '@playwright/test';
