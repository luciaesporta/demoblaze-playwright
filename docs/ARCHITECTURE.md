# Architecture

How this suite is put together, and why each layer exists.

For what gets tested and at what depth, see [TEST_STRATEGY.md](./TEST_STRATEGY.md).
For how to run it, see the [README](../README.md).

---

## 1. Layers

```
┌──────────────────────────────────────────────────────────────┐
│  tests/          *.spec.ts                                   │
│  Arrange, act, assert. The only layer that calls expect().   │
└──────────┬─────────────────────────┬─────────────────────────┘
           │                         │
           ▼                         ▼
┌──────────────────────┐  ┌──────────────────────────┐
│  fixtures/           │  │  pages/                  │
│  Reusable test state │  │  Page Objects. Locators  │
│  (auth, seeded cart) │  │  and interactions        │
└──────────┬───────────┘  └────────────┬─────────────┘
           │                           │
           └─────────────┬─────────────┘
                         ▼
           ┌──────────────────────────────┐
           │  utils/                      │
           │  Data, constants, API and    │
           │  measurement helpers.        │
           │  Imports nothing above it.   │
           └──────────────────────────────┘
```

Dependencies point one way only. Measured on the current tree:

| Layer       | Imports from                               | Imported by      |
| ----------- | ------------------------------------------ | ---------------- |
| `tests/`    | `pages` (31), `utils` (14), `fixtures` (5) | —                |
| `fixtures/` | `utils` (2)                                | `tests`          |
| `pages/`    | `utils` (3)                                | `tests`          |
| `utils/`    | nothing                                    | everything above |

`utils/` importing nothing is what makes the rest safe to move: no cycles are
possible, and a change to a page object can never ripple into the data layer.

`fixtures/` not importing `pages/` is recent. It used to drive the UI to build
its state; once setup moved to the API it stopped needing page objects at all.
That decoupling was a side effect worth keeping.

---

## 2. Data flow

A typical cart test:

```
test('deleting an item updates the cart')
  │
  ├─ requests fixture ──────► fixtures/authFixtures.ts
  │                             │
  │                             ├─ generateUser()          utils/testData
  │                             ├─ createUserViaAPI()      utils/apiHelpers ──► POST /signup
  │                             ├─ loginViaAPI()           utils/apiHelpers ──► POST /login
  │                             ├─ addCookies(tokenp_)     browser context
  │                             ├─ page.goto('/')          site loads session
  │                             ├─ getProductViaAPI()      utils/apiHelpers ──► POST /view
  │                             └─ addToCartViaAPI()       utils/apiHelpers ──► POST /addtocart
  │
  ├─ receives { page, name, price } ── cart already populated
  │
  ├─ cartPage.goto() ───────► pages/CartPage.ts ──► browser
  ├─ cartPage.deleteRowByName(name)
  │
  └─ expect(cartPage.cartRows).toHaveCount(1)   ◄── assertions live here only
```

Two things to notice:

**Setup goes through HTTP, verification through the UI.** State is built the
cheapest way available; behaviour is checked the way a user would experience it.
Building a cart through the UI to then test the cart would make the setup part
of what is under test.

**The fixture hands back plain data** (`name`, `price`) rather than locators or
page objects. Tests decide what to do with it.

---

## 3. Design decisions

### Why Page Objects

The DOM is the least stable thing in the system. demoblaze's markup is generated
by a Bootstrap template with almost no semantic hooks — most elements are reached
by class or position. When that shifts, the change should land in one file, not
across forty tests.

Encapsulation is enforced, not just encouraged. On the current tree:

- **63 private locators**, exposed through **41 read-only getters**
- **0 `expect()` calls** inside `pages/`
- **1 raw locator interaction** in the whole `tests/` directory

Tests call semantic methods — `homePage.openCategory('Phones')`,
`authPage.logout()` — not `page.locator('#x').click()`. What a test says is what
a user does; how that is achieved is the page object's problem.

**Assertions stay out of page objects.** A page object that asserts decides for
the test what "correct" means, and becomes impossible to reuse for a negative
case. Getters exist so tests can still pass a locator to `expect()` and keep
Playwright's auto-retry:

```ts
await expect(authPage.loggedInUsername).toBeVisible(); // test asserts
```

### Why fixtures

Three fixtures — `authenticatedPage`, `cartWithOneProduct`, `cartWithTwoProducts`
— cover the preconditions most tests need.

**They remove repetition that would otherwise be untestable itself.** 38 tests
declare one of these fixtures — 24 alone need a cart holding one product.
Without a fixture that is 38 copies of the same setup, each free to drift.

**They make setup cost a single decision.** Moving auth and cart seeding from the
UI to the API changed one file and made every consumer ~31% faster. With the
setup inlined, that would have been a 38-test change nobody would have
attempted.

**They scope teardown automatically.** Each fixture registers its own user, so
tests never share an account and can run fully in parallel without collisions —
which is what makes `fullyParallel: true` safe.

The trade-off is indirection: reading a test no longer tells you the whole
precondition. That is worth it at this ratio, and the fixture names are chosen
to say what state they produce rather than how.

### Why constants and test data are separate modules

`utils/constants.ts` holds what the application _is_ — expected messages, URL
patterns, category contents, viewport sizes. `utils/testData.ts` holds what a
test _sends_ — generated users, order details, invalid inputs.

They are split because they change for different reasons. Constants change when
the application changes; test data changes when we want to exercise a different
case. Keeping them apart means a copy change touches one file and a new boundary
case touches the other.

Both are separate from the tests because the same expected value is asserted from
several places. `MESSAGES.signUpSuccess` appears in auth tests, mobile tests and
a11y tests; as a literal it would be three strings that drift apart.

The rule that keeps this honest: **no magic strings in tests.** A literal in a
test is a fact about the application with no single home.

### Why `utils/` depends on nothing

Everything in `utils/` is either pure (`testData`, `constants`, `tags`) or talks
only to HTTP and the Performance API (`apiHelpers`, `webVitals`, `a11y`). None of
it knows what a page object is.

This is what allows the helpers to be used from a fixture, a test, or a throwaway
script during investigation — several of the findings recorded in earlier PRs
came from calling `apiHelpers` directly to capture a contract before writing
anything.

---

## 4. Where things live

```
tests/          One spec per feature area. Assertions only live here.
fixtures/       Preconditions: authenticated session, pre-seeded carts.
pages/          One class per page or major surface. Locators private.
utils/
  constants.ts  Expected application values
  testData.ts   Generated and parametrised inputs
  apiHelpers.ts Direct API calls for setup
  webVitals.ts  Performance measurement
  a11y.ts       axe scanning
  tags.ts       Tag constants
docs/           This file and the test strategy
```

### Adding to the suite

| Adding…                      | Goes in                                                    |
| ---------------------------- | ---------------------------------------------------------- |
| A new interaction            | A semantic method on the relevant page object              |
| A new expected value         | `utils/constants.ts`                                       |
| A new input or data set      | `utils/testData.ts`                                        |
| A precondition 3+ tests need | A fixture                                                  |
| A new page                   | A class in `pages/`, following the private-locator pattern |

The one rule worth restating: assertions belong in `tests/`. If a helper or page
object needs to assert something to be useful, it is usually a sign the test
should be receiving data instead.
