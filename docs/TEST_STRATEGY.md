# Test Strategy

How this suite decides what to test, how hard, and when a run counts as good
enough to act on.

For how to run the tests, see the [README](../README.md). This document covers
the reasoning behind them.

---

## 1. Scope

### Application under test

[Product Store](https://www.demoblaze.com) — a public demo e-commerce site with
a product catalog, user accounts, a cart, and a single-step checkout.

### In scope

| Area           | What is covered                                                          |
| -------------- | ------------------------------------------------------------------------ |
| Purchase flow  | Cart → Place Order → confirmation, including field validation            |
| Authentication | Sign up, log in, log out, session persistence, negative cases            |
| Cart           | Add, delete, totals, persistence across navigation and refresh           |
| Catalog & UI   | Category filtering, product detail, images, carousel, modals, navigation |
| Mobile         | Collapsed navbar, mobile auth and checkout at a 390x844 viewport         |
| API            | Request payload shape, status codes, network-failure handling            |
| Accessibility  | axe WCAG 2.1 AA scans, keyboard and focus behaviour, labels, contrast    |
| Performance    | FCP, LCP, CLS, TTI budgets; image weight; visual regression              |

### Out of scope

- **Load and stress testing.** demoblaze is a shared public site; deliberately
  loading it would degrade it for everyone else using it.
- **Security testing** beyond the two smoke checks in `auth.spec.ts` (SQL
  injection and XSS payloads in the username field). No authorisation matrix,
  session-fixation or penetration testing.
- **Cross-device testing** on real hardware. Mobile coverage is viewport
  emulation only.
- **Backend and database verification.** No access; state is confirmed through
  the API and the UI.
- **Payment processing.** The site does not take real payments.
- **Localisation.** Single language, single currency.

---

## 2. Risk analysis

Priority is `business impact x likelihood of breaking`. The ranking drives which
tests carry the `@smoke` tag and which failures block a merge.

### Critical — a failure here stops the business

**Purchase flow (`checkout.spec.ts`)**
Place Order is the only revenue path in the application, and it consolidates
shipping and payment into a single step. Any break loses every transaction, with
no partial degradation and no workaround for the user. It also has the most
input surface of any feature — six fields, all free-text — so it has the most
ways to fail.

**Cart (`cart.spec.ts`)**
The cart is the entry point to checkout and holds state across navigation. A
cart that loses items produces abandoned purchases that look like user choice
rather than a defect, so failures here are both costly and easy to miss.
Empirically this is also the least stable area against the live site — see
§6.

### High — a failure blocks a subset of users

**Authentication (`auth.spec.ts`)**
Sign up and log in gate cart persistence across sessions. A break locks existing
users out entirely, but browsing and guest checkout survive, so impact is
serious rather than total.

**Catalog and navigation (`ui.spec.ts`)**
Product discovery drives conversion. Broken category filtering or product pages
means users cannot reach the purchase flow at all, but the failure is visible
and users can still navigate around parts of it.

### Medium — degrades experience without blocking

**Mobile (`mobile.spec.ts`)** — a broken collapsed navbar makes the site hard to
use on a phone, but the desktop path is unaffected.

**Performance (`performance.spec.ts`)** — slow pages cost conversion gradually
rather than breaking anything outright. Budgets are treated as guardrails.

**Accessibility (`a11y.spec.ts`)** — real user impact and a compliance concern,
but does not stop a transaction completing. This is also where most known
defects sit: 16 of the 39 currently-tracked bugs.

### Deliberately lower priority

**API tests (`api.spec.ts`)** verify payload shape and error handling. They are
fast and stable, but they check contracts we do not own and cannot fix, so they
inform rather than gate.

---

## 3. Test levels

Counts below are for a single browser project and reflect the suite as it
stands.

| Level          | Selector             | Tests | Runtime (chromium) | Used for                                 |
| -------------- | -------------------- | ----- | ------------------ | ---------------------------------------- |
| **Smoke**      | `--grep @smoke`      | 14    | ~15 s              | Fast confidence: is the core path alive? |
| **Regression** | `--grep @regression` | 154   | ~2.8 min           | Pre-merge and scheduled verification     |
| **Full**       | no filter            | 168   | ~3 min             | Everything, including untagged tests     |

```bash
npx playwright test --grep @smoke          # smoke
npx playwright test --grep @regression     # regression
npx playwright test                        # full
```

### Smoke

One happy path per critical area — register, log in, add to cart, complete a
purchase, load the catalog. If smoke fails, the build is broken in a way no
amount of detail testing will clarify; stop and fix.

### Regression

Everything of consequence: negative cases, boundaries, parametrised data sets,
accessibility, performance budgets. This is the pre-merge gate.

### Full

Adds the handful of untagged tests. In practice regression and full differ by
14 tests, so full is the default for CI.

### Browser coverage

| Project  | Gates the build | Rationale                                                          |
| -------- | --------------- | ------------------------------------------------------------------ |
| chromium | **Yes**         | Primary target; the only project whose failure blocks a merge      |
| firefox  | No              | `continue-on-error` — engine differences produce noise, not signal |
| webkit   | No              | Same                                                               |

Four tests are tagged `@chromium-only` and skipped elsewhere, because they rely
on Performance API entry types (`layout-shift`, `longtask`) that only Chromium
implements.

---

## 4. Entry and exit criteria

### Entry — before a run is worth starting

- `npm run typecheck` passes; a type error means the suite cannot be trusted.
- `npm run lint` passes.
- The target environment is reachable and the site returns a page.
- Test data is generated per run (`generateUser()`), so no seeding is required
  and runs never collide over a shared account.

### Exit — before a change merges

- **Every chromium test passes**, or fails only in a way already recorded as a
  known defect (`test.fail()`).
- **No new `test.fail()` without a written reason.** The marker documents a
  defect in the application; using it to silence a test the suite itself broke
  hides a regression.
- Firefox and WebKit results are reviewed but do not gate.
- Any new flake is either fixed or explained in the PR — not retried away.

### When a failure blocks

| Failure                             | Blocks? | Action                                     |
| ----------------------------------- | ------- | ------------------------------------------ |
| Chromium, reproducible              | Yes     | Fix before merge                           |
| Chromium, passes in isolation       | No      | Investigate and record; see §6             |
| Firefox / WebKit only               | No      | Record; fix if it points at real behaviour |
| A `test.fail()` test starts passing | Yes     | The bug was fixed — remove the marker      |

That last row matters: Playwright reports an unexpectedly-passing `test.fail()`
as a failure, on purpose. It is the mechanism that stops known-bug markers
outliving the bug.

---

## 5. Environments

All environments point at the same public site. There is no dedicated test
instance, which is the single biggest constraint on this strategy — see §6.

| Environment | Config       | Retries | Headless | Workers            |
| ----------- | ------------ | ------- | -------- | ------------------ |
| Local       | `.env.local` | 0       | No       | Playwright default |
| CI          | `.env.ci`    | 1       | Yes      | 2 (pinned)         |
| Docker      | image env    | 2       | Yes      | 2 (`CI` is set)    |

```bash
npm run test:local    # NODE_ENV=local
npm run test:ci       # NODE_ENV=ci
docker compose run --rm tests
```

Precedence: `NODE_ENV` selects an env file, real environment variables win over
it, and `playwright.config.ts` supplies defaults for anything unset. Nothing
requires a `.env` file to exist.

**Local** uses zero retries deliberately: a flake should be visible while
developing, not smoothed over. **CI** retries once so a single third-party hiccup
does not fail a build, while a genuine break still fails twice.

---

## 6. Constraint: a third-party site under test

The application is a shared public demo, and this shapes the strategy more than
anything else in this document.

**It degrades under concurrency.** Measured directly: raising local workers
produced cart failures that looked like test bugs but were the site dropping
requests. CI workers are pinned at 2 for that reason, not for speed.

**Consequences:**

- Worker count is a stability setting, not a throughput dial. Raising it trades
  wall-clock for flakiness.
- Some failures are genuinely not ours. A run that fails only in `cart.spec.ts`
  and passes in isolation is site behaviour, and the PR should say so rather
  than paper over it with retries.
- Load testing is excluded (§1), since we would be the load.
- Setup goes through the API wherever possible (`utils/apiHelpers.ts`) — fewer
  page loads means less pressure on the site and less exposure to its
  instability.

**Known defects.** 39 tests are marked `test.fail()`, documenting real
application bugs rather than test weaknesses: 16 accessibility, 9 UI, 5 auth,
5 checkout, 2 mobile, 1 cart, 1 performance. Each is a bug the suite has pinned
down and will notice if it is ever fixed.
