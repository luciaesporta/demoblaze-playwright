import { randomUUID } from 'crypto';
import {
  request as playwrightRequest,
  type APIRequestContext,
  type BrowserContext,
} from '@playwright/test';

/**
 * Direct calls to the demoblaze API, for setting up state without driving the
 * UI. Registering through the sign-up modal costs a page load, a modal, a form
 * fill and a dialog; this does the same work in one request.
 *
 * Usage:
 *   const { username, password } = generateUser();
 *   await createUserViaAPI(username, password);
 *   // the user now exists and can log in through the UI
 *
 * Reuse the test's own context when there is one, to avoid standing up a
 * second HTTP stack per call:
 *   test('...', async ({ request }) => {
 *     await createUserViaAPI(username, password, { request });
 *   });
 */

/** The API lives on a different host than the site under test. */
export const API_BASE_URL = process.env.API_BASE_URL || 'https://api.demoblaze.com';

export interface ApiCallOptions {
  /** Reuse an existing context instead of creating a throwaway one. */
  request?: APIRequestContext;
}

/** Shape demoblaze returns when a call fails. It still answers HTTP 200. */
interface ErrorBody {
  errorMessage?: string;
}

/**
 * demoblaze sends the password base64-encoded, and stores whatever it receives.
 * Posting a plain password would create an account whose real password is the
 * plain text, so a later UI login with the same value would fail.
 */
function encodePassword(password: string): string {
  return Buffer.from(password, 'utf-8').toString('base64');
}

/**
 * Runs `call` against the given context, or against a throwaway one that is
 * disposed afterwards.
 */
async function withContext<T>(
  options: ApiCallOptions,
  call: (context: APIRequestContext) => Promise<T>,
): Promise<T> {
  if (options.request) {
    return call(options.request);
  }

  const context = await playwrightRequest.newContext({ baseURL: API_BASE_URL });
  try {
    return await call(context);
  } finally {
    await context.dispose();
  }
}

/**
 * Registers a user through POST /signup.
 *
 * Resolves once the account exists. Throws if the API reports a problem —
 * including a duplicate username, since a caller asking for a new user did not
 * get one.
 */
export async function createUserViaAPI(
  username: string,
  password: string,
  options: ApiCallOptions = {},
): Promise<void> {
  // Read the body inside the callback: disposing a throwaway context also
  // disposes its responses, so reading afterwards fails.
  const { ok, status, statusText, body } = await withContext(options, async (context) => {
    const response = await context.post(`${API_BASE_URL}/signup`, {
      data: { username, password: encodePassword(password) },
    });
    return {
      ok: response.ok(),
      status: response.status(),
      statusText: response.statusText(),
      body: await response.text(),
    };
  });

  if (!ok) {
    throw new Error(`Sign up failed for "${username}": HTTP ${status} ${statusText} — ${body}`);
  }

  // demoblaze answers 200 even when it refuses the request, so the status is
  // not enough — a rejection is only visible in the body.
  const errorMessage = parseErrorMessage(body);
  if (errorMessage) {
    throw new Error(`Sign up failed for "${username}": ${errorMessage}`);
  }
}

/** Name of the cookie demoblaze reads to decide who is signed in. */
export const AUTH_COOKIE_NAME = 'tokenp_';

/** Prefix wrapping the token in a successful login response. */
const AUTH_TOKEN_PREFIX = 'Auth_token: ';

/**
 * Logs in through POST /login and returns the auth token.
 *
 * The token is the value demoblaze stores in the `tokenp_` cookie, so setting
 * that cookie on a browser context is enough to make the UI treat the session
 * as signed in — see the `authenticatedPage` fixture.
 */
export async function loginViaAPI(
  username: string,
  password: string,
  options: ApiCallOptions = {},
): Promise<string> {
  const { ok, status, statusText, body } = await withContext(options, async (context) => {
    const response = await context.post(`${API_BASE_URL}/login`, {
      data: { username, password: encodePassword(password) },
    });
    return {
      ok: response.ok(),
      status: response.status(),
      statusText: response.statusText(),
      body: await response.text(),
    };
  });

  if (!ok) {
    throw new Error(`Login failed for "${username}": HTTP ${status} ${statusText} — ${body}`);
  }

  // Wrong credentials also come back as 200, with the reason in the body.
  const errorMessage = parseErrorMessage(body);
  if (errorMessage) {
    throw new Error(`Login failed for "${username}": ${errorMessage}`);
  }

  const token = parseAuthToken(body);
  if (!token) {
    throw new Error(`Login for "${username}" returned no auth token. Body was: ${body}`);
  }
  return token;
}

/**
 * Pulls the token out of a login response.
 *
 * The body is a JSON string of the form "Auth_token: <token>".
 */
function parseAuthToken(body: string): string | null {
  try {
    const parsed: unknown = JSON.parse(body.trim());
    if (typeof parsed !== 'string' || !parsed.startsWith(AUTH_TOKEN_PREFIX)) {
      return null;
    }
    return parsed.slice(AUTH_TOKEN_PREFIX.length).trim() || null;
  } catch {
    return null;
  }
}

/**
 * Returns the API's error message, or null when the body carries none.
 *
 * A successful sign up returns the JSON string "", so an unparseable or empty
 * body is treated as success rather than as a failure.
 */
function parseErrorMessage(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed) return null;

  try {
    const parsed: unknown = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object') {
      const { errorMessage } = parsed as ErrorBody;
      return errorMessage ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

/** Name of the cookie demoblaze keys a cart on. */
export const CART_COOKIE_NAME = 'user';

/**
 * Reads the cart cookie from a browser context, waiting for it to appear.
 *
 * The site creates this cookie in client-side script, so it does not exist the
 * moment a navigation resolves — measured at roughly 260ms after
 * domcontentloaded on the home page. Reading it immediately after goto() finds
 * nothing, so this polls rather than looking once.
 */
export async function getCartCookie(
  context: BrowserContext,
  options: { timeoutMs?: number } = {},
): Promise<string> {
  const { timeoutMs = 10_000 } = options;
  const deadline = Date.now() + timeoutMs;

  do {
    const cookies = await context.cookies();
    const cartCookie = cookies.find((cookie) => cookie.name === CART_COOKIE_NAME);
    if (cartCookie?.value) {
      return cartCookie.value;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  } while (Date.now() < deadline);

  throw new Error(
    `No "${CART_COOKIE_NAME}" cookie after ${timeoutMs}ms. The page creates it in script, ` +
      `so make sure a page has been loaded before calling this.`,
  );
}

export interface AddToCartOptions extends ApiCallOptions {
  /**
   * Id for the new cart line. Each row carries its own, so adding the same
   * product twice needs two different ids. Defaults to a fresh UUID.
   */
  id?: string;
  /**
   * Set when `cookie` is an auth token from loginViaAPI rather than a guest
   * cart cookie. The API keys a signed-in cart on the token and expects
   * `flag: true`; a guest cart is keyed on `user=<uuid>` with `flag: false`.
   * Sending the wrong pair puts the items somewhere the UI will never read.
   */
  authenticated?: boolean;
}

/**
 * Normalises a cart cookie into the `user=<uuid>` form the API expects.
 *
 * The API takes the cookie as a string in that exact shape, not as the bare
 * UUID. Passing just the UUID silently keys the cart under a value the browser
 * will never send back, so the items would exist but never show up in the UI.
 * Accepting both forms removes that trap.
 */
function normaliseCartCookie(cookie: string): string {
  const value = cookie.trim();
  if (!value) {
    throw new Error('A cart cookie is required to add an item.');
  }
  return value.startsWith(`${CART_COOKIE_NAME}=`) ? value : `${CART_COOKIE_NAME}=${value}`;
}

/**
 * Adds a product to a cart through POST /addtocart, and returns the id of the
 * line it created.
 *
 * `cookie` is the browser's cart cookie — either the raw UUID or the full
 * `user=<uuid>` string. Read it from a context with:
 *   const [{ value }] = await context.cookies().then(c =>
 *     c.filter(x => x.name === CART_COOKIE_NAME));
 *
 * `productId` is the site's numeric product id, the `idp_` query parameter on
 * a product page (`/prod.html?idp_=1`).
 */
export async function addToCartViaAPI(
  cookie: string,
  productId: number,
  options: AddToCartOptions = {},
): Promise<string> {
  const { id = randomUUID(), authenticated = false, ...callOptions } = options;

  // A signed-in cart is keyed on the raw auth token; a guest cart on the
  // `user=<uuid>` cookie. The flag tells the API which one it is looking at.
  const cartCookie = authenticated ? cookie.trim() : normaliseCartCookie(cookie);
  if (!cartCookie) {
    throw new Error('A cart cookie or auth token is required to add an item.');
  }

  const { ok, status, statusText, body } = await withContext(callOptions, async (context) => {
    const response = await context.post(`${API_BASE_URL}/addtocart`, {
      data: { id, cookie: cartCookie, prod_id: productId, flag: authenticated },
    });
    return {
      ok: response.ok(),
      status: response.status(),
      statusText: response.statusText(),
      body: await response.text(),
    };
  });

  if (!ok) {
    throw new Error(
      `Add to cart failed for product ${productId}: HTTP ${status} ${statusText} — ${body}`,
    );
  }

  // As everywhere else in this API, a refusal arrives as 200 with a message.
  const errorMessage = parseErrorMessage(body);
  if (errorMessage) {
    throw new Error(`Add to cart failed for product ${productId}: ${errorMessage}`);
  }

  return id;
}

/** A product as the API describes it. */
export interface ApiProduct {
  id: number;
  title: string;
  price: number;
  cat: string;
  desc: string;
  img: string;
}

/**
 * Reads a product through POST /view.
 *
 * `title` and `price` match what the product page renders — `String(price)`
 * equals the digits the UI shows — so a fixture can report the same name and
 * price it used to scrape from the DOM.
 */
export async function getProductViaAPI(
  productId: number,
  options: ApiCallOptions = {},
): Promise<ApiProduct> {
  const { ok, status, statusText, body } = await withContext(options, async (context) => {
    const response = await context.post(`${API_BASE_URL}/view`, {
      data: { id: productId },
    });
    return {
      ok: response.ok(),
      status: response.status(),
      statusText: response.statusText(),
      body: await response.text(),
    };
  });

  if (!ok) {
    throw new Error(`Reading product ${productId} failed: HTTP ${status} ${statusText} — ${body}`);
  }

  const errorMessage = parseErrorMessage(body);
  if (errorMessage) {
    throw new Error(`Reading product ${productId} failed: ${errorMessage}`);
  }

  const product = JSON.parse(body) as ApiProduct;
  if (typeof product?.title !== 'string' || typeof product?.price !== 'number') {
    throw new Error(`Product ${productId} came back without a title and price: ${body}`);
  }
  return product;
}
