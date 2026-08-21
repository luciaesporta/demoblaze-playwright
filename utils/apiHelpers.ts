import { request as playwrightRequest, type APIRequestContext } from '@playwright/test';

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
