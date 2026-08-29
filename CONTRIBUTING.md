# Contributing

How to work on this suite: setup, the conventions it follows, and what a change
needs before it merges.

Background reading, if you have not seen it:
[ARCHITECTURE.md](docs/ARCHITECTURE.md) explains why the layers are shaped the
way they are, and [TEST_STRATEGY.md](docs/TEST_STRATEGY.md) covers what gets
tested and at what depth.

---

## Getting set up

```bash
git clone git@github.com:luciaesporta/demoblaze-playwright.git
cd demoblaze-playwright
npm install
npx playwright install chromium    # add firefox / webkit if you need them
```

Check it works:

```bash
npm run test:smoke    # ~15s, 14 tests
```

No `.env` file is required — `playwright.config.ts` falls back to the live site
and sensible timeouts. Copy `.env.example` to `.env` only if you need to point
somewhere else.

`npm install` sets up a pre-commit hook that runs ESLint and Prettier on staged
files. It fixes what it can and blocks the commit if it cannot.

---

## Adding a test

### 1. Pick the file

One spec per feature area: `auth`, `cart`, `checkout`, `ui`, `mobile`, `api`,
`a11y`, `performance`. Add to the existing file rather than creating a parallel
one.

### 2. Name it as a behaviour

The title should read as a statement about the application, not about the test.

```ts
✅ test('cart persists across page navigation', ...)
✅ test('login fails with wrong password', ...)
❌ test('test cart 2', ...)
❌ test('should work', ...)
```

Negative cases say what is prevented: `purchase blocked when country empty`.

### 3. Tag it

```ts
test('guest user can add a product to cart', { tag: '@smoke' }, async ({ page }) => {
```

| Tag              | Use for                                                                     |
| ---------------- | --------------------------------------------------------------------------- |
| `@smoke`         | One happy path per critical area. Keep this set small — it is 14.           |
| `@regression`    | Everything else of consequence. This is the default.                        |
| `@chromium-only` | Tests relying on APIs only Chromium implements (`layout-shift`, `longtask`) |

Tags are written as string literals. `utils/tags.ts` exports `SMOKE`,
`REGRESSION` and `CRITICAL` constants, but **no spec currently imports it** — and
`@critical` is not used at all. Follow the literals until that is reconciled;
switching to the constants would be a worthwhile change on its own, not something
to do halfway in an unrelated PR.

### 4. Use a fixture if the precondition already exists

```ts
test('...', async ({ cartWithOneProduct }) => {
  const { page, name, price } = cartWithOneProduct;
```

| Fixture               | Gives you                                     |
| --------------------- | --------------------------------------------- |
| `authenticatedPage`   | A registered, signed-in user on the home page |
| `cartWithOneProduct`  | The above, plus one product in the cart       |
| `cartWithTwoProducts` | The above, with two products                  |

These set up over the API, so they cost ~3.6s rather than ~5.2s. If three or more
tests would need a new precondition, add a fixture instead of repeating setup.

### 5. Keep the body arrange / act / assert

No loops or conditionals inside a `test()` body. Parametrise outside it:

```ts
for (const invalidEmail of INVALID_EMAILS) {
  test(`contact form rejects invalid email: "${invalidEmail}"`, async ({ page }) => {
    // one clear case
  });
}
```

---

## Writing page objects

Every page object follows the same shape. Locators are private; tests reach them
only through getters or semantic methods.

```ts
import type { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;

  // 1. Locators are private and defined once, in the constructor.
  private readonly _cartRows: Locator;
  private readonly _placeOrderButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this._cartRows = page.locator('#tbodyid tr');
    this._placeOrderButton = page.getByRole('button', { name: 'Place Order' });
  }

  // 2. Read-only getters expose them, so tests can assert with auto-retry.
  get cartRows(): Locator {
    return this._cartRows;
  }

  // 3. Actions are named for intent, and wait for their own result.
  async openPlaceOrderModal(): Promise<void> {
    await this._placeOrderButton.click();
    await this._orderModal.waitFor({ state: 'visible' });
  }
}
```

**Three rules, in order of how much they matter:**

1. **No `expect()` inside a page object.** A page object that asserts decides for
   the test what "correct" means, and cannot be reused for a negative case. There
   are currently zero assertions in `pages/` — keep it that way.
2. **No raw locator calls in tests.** `page.locator('#x').click()` in a spec means
   a missing page object method. Tests say what a user does; the page object owns
   how.
3. **Prefer role and label locators** (`getByRole`, `getByLabel`) over CSS. Not
   always possible on this site — the markup has few semantic hooks — but reach
   for it first.

A method should describe intent: `authPage.logout()`, not `clickLogoutLink()`.

---

## Where values live

| What                                            | Goes in               |
| ----------------------------------------------- | --------------------- |
| Expected messages, URL patterns, viewport sizes | `utils/constants.ts`  |
| Generated users, order data, invalid inputs     | `utils/testData.ts`   |
| Direct API calls for setup                      | `utils/apiHelpers.ts` |

**No string literals in tests.** A literal is a fact about the application with
no single home — `MESSAGES.signUpSuccess` is asserted from three spec files, and
as a literal it would be three strings free to drift apart.

---

## Documenting an application bug

When a test fails because the application is broken, not the test:

```ts
test('ESC key closes login modal', { tag: '@regression' }, async ({ page }) => {
  // BUG: Bootstrap's keyboard dismiss is disabled site-wide. Remove this
  // marker once ESC closes the modal.
  test.fail();
```

Then add an entry to [KNOWN_BUGS.md](docs/KNOWN_BUGS.md) with severity, repro
steps, expected vs actual, and a workaround if one exists.

`test.fail()` is for **application defects only**. Using it to silence a test the
suite itself broke hides a regression — and it will mask setup failures too, not
just the assertion you meant to mark.

If a marked test starts passing, Playwright reports that as a failure. That is
deliberate: remove the marker and the KNOWN_BUGS entry together.

---

## Before you open a PR

```bash
npm run typecheck                       # must pass
npm run lint
npm run format:check
npx playwright test --project=chromium  # chromium is what gates CI
```

Expectations:

- **Chromium passes**, or fails only as an already-documented known defect.
- **New flake is explained, not retried away.** If a test passes in isolation but
  fails in a full run, say so and say why. The site degrades under concurrency,
  so "it is the site" is a legitimate conclusion — but demonstrate it.
- **Numbers in a description are measured**, not estimated.

Firefox and WebKit are `continue-on-error` in CI. Review their results; they do
not block.

### Commits and branches

Branches: `test/`, `feat/`, `fix/`, `chore/`, `ci/`, `docs/`, `refactor/`,
`infra/`, `perf/` — then a short description. `test/a11y-cart`,
`fix/cart-flaky-timeouts`.

Commits follow [Conventional Commits](https://www.conventionalcommits.org/):

```
test(a11y): add axe scans for empty and filled cart page

Explain why, and what you ruled out. A future reader wants the reasoning,
not a restatement of the diff.
```

### Stacked PRs

If your branch depends on another open PR, base it on `main` and wait, or accept
that it may need re-targeting. Basing a PR on an unmerged branch and assuming
GitHub will retarget it has already cost this repo one lost merge — the work had
to be recovered in a follow-up.

---

## PR template

```markdown
## Summary

What changed and why. Lead with the reasoning, not a file list.

## Verification

- Commands run and their results
- Measured numbers, if the change claims a performance effect
- What you could not verify, and why

## Notes

- Deviations from the ticket, and the reason
- Anything you found but deliberately left alone
```

The Verification section is the one that matters. "Tests pass" is not
verification; "full chromium suite 166/166, twice, plus the failing test isolated
and repeated 4x" is.
