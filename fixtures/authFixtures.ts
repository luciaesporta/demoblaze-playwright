import { test as base, type Page } from '@playwright/test';
import { generateUser } from '../utils/testData';
import {
  addToCartViaAPI,
  AUTH_COOKIE_NAME,
  createUserViaAPI,
  getProductViaAPI,
  loginViaAPI,
} from '../utils/apiHelpers';

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
async function registerAndLogin(
  page: Page,
  options: { navigate?: boolean } = {},
): Promise<{ username: string; token: string }> {
  const { navigate = true } = options;
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

  // The cookie is only read on load, so a page has to be loaded before the UI
  // reflects the session. Callers that navigate somewhere specific first can
  // skip this and save a round trip.
  if (navigate) {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  }
  return { username, token };
}

/**
 * The home grid lists products in id order, so the nth card is product n + 1.
 * Verified against the grid's own links: index 0 is `prod.html?idp_=1`.
 */
function productIdForGridIndex(index: number): number {
  return index + 1;
}

/**
 * Fills the cart over HTTP and reports each product's name and price.
 *
 * Replaces a navigate-open-add-dialog cycle per item with two requests. The
 * values come from the API rather than the DOM, and match it exactly: `title`
 * is the rendered name and `String(price)` the rendered digits.
 *
 * Assumes the page has already been loaded, since the cart cookie the API keys
 * on is created by client-side script.
 */
async function seedCartViaAPI(
  page: Page,
  token: string,
  gridIndexes: number[],
): Promise<{ name: string; price: string }[]> {
  const request = page.request;

  const items: { name: string; price: string }[] = [];
  for (const index of gridIndexes) {
    const productId = productIdForGridIndex(index);
    const product = await getProductViaAPI(productId, { request });
    await addToCartViaAPI(token, productId, { request, authenticated: true });
    items.push({ name: product.title, price: String(product.price) });
  }
  return items;
}

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    const { username } = await registerAndLogin(page);
    await use({ page, username });
  },

  cartWithOneProduct: async ({ page }, use) => {
    // No navigation here: every consumer opens the page it needs, so landing
    // on the home page first would just be a wasted load.
    const { token } = await registerAndLogin(page, { navigate: false });
    const [item] = await seedCartViaAPI(page, token, [0]);

    await use({ page, name: item!.name, price: item!.price });
  },

  cartWithTwoProducts: async ({ page }, use) => {
    const { token } = await registerAndLogin(page, { navigate: false });
    const [first, second] = await seedCartViaAPI(page, token, [0, 1]);

    await use({ page, first: first!, second: second! });
  },
});

export { expect } from '@playwright/test';
