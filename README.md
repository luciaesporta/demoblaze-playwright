# demoblaze-playwright

End-to-end test suite for [Product Store](https://www.demoblaze.com), built with Playwright and TypeScript.

## About the application

Product Store is a web-based e-commerce application that allows users to browse and purchase technology products across three categories: phones, laptops, and monitors.

Its most critical feature is the purchase flow — specifically the Place Order functionality, which consolidates shipping details and payment information into a single step. Any failure in this flow has a direct business impact, making it the highest priority area from a testing perspective.

Supporting features include user authentication (sign up and log in), which enables session-based cart persistence, and the product catalog with category filtering, which drives product discoverability and ultimately conversion. The UI is designed for desktop and mobile, with a responsive layout that adapts to different screen sizes.

## Tech stack

- [Playwright](https://playwright.dev/) — test framework
- TypeScript (strict mode) — all source files are `.ts`
- Page Object Model — test architecture (locators encapsulated, semantic methods only)
- Playwright Fixtures — reusable authenticated session and pre-seeded-cart setup
- Data-driven testing — parametrized category, image and invalid-login scenarios
- GitHub Actions — CI/CD

## Test coverage

| Area | Scenario |
|------|----------|
| Auth | Successful user registration |
| Auth | Successful login after registration |
| Auth | Login and sign up forms reject empty submission |
| Auth | Password fields mask their input |
| Auth | Login fails with non-existent user |
| Auth | Login fails with wrong password |
| Cart | Guest user can add a product to cart |
| Cart | Authenticated user can add a product to cart |
| Cart | Empty cart shows no items and blank total |
| Cart | Cart displays full list when multiple products are added |
| Cart | Total reflects all added items |
| Cart | Deleting an item updates the cart correctly |
| Cart | Cart persists across page navigation |
| Cart | Cart state is preserved after interrupting the purchase flow |
| Cart | Adding the same product twice results in two rows |
| Checkout | Successful purchase with all fields completed |
| Checkout | Purchase cannot be submitted with mandatory fields empty |
| Checkout | Total in modal matches cart total |
| Checkout | Order confirmation message contains purchase details |
| Checkout | Modal can be dismissed without placing an order |
| Checkout | Credit card field rejects non-numeric characters (known bug — `test.fail`) |
| Checkout | Credit card field validates length (known bug — `test.fail`) |
| UI | Home page displays the store title |
| UI | Home page loads product cards |
| UI | Filtering by category updates the product list |
| UI | Clicking a product card navigates to its detail page |
| UI | Detail page loads correctly from catalog |
| UI | Navbar logo returns to home from a product page |
| UI | Cart link in navbar navigates to the cart page |
| UI | Pagination navigates between product pages |
| UI | Category filters return correct products (parametrized per category) |
| UI | Product card and detail images load (parametrized per category / product) |
| UI | Hero banner auto-advances and responds to manual controls |
| UI | Page title and favicon are present and correct |
| UI | About us modal loads video content |
| UI | Contact form can be submitted with valid data |
| UI | Logged-in user can log out |
| UI | Log out link visible regardless of session state (known bug — `test.fail`) |
| Mobile | Application is usable on mobile viewport |
| Mobile | Login and sign up modals are usable |
| Mobile | Category filters work through collapsed navbar (parametrized per category) |
| Mobile | Full purchase flow completes on mobile viewport |

## Run locally

```bash
npm install
npx playwright install chromium
npm test                  
npm run test:headed       
npm run test:report       
npm run typecheck         
```

## Project structure

```
pages/               Page Object classes (TS, one per page or major surface)
  HomePage.ts        Catalog, navbar, category list, contact + about-us modals, carousel
  ProductPage.ts     Product detail: name, price, image, description, add-to-cart
  CartPage.ts        Cart rows, total, delete row, Place Order modal trigger
  CheckoutPage.ts    Place Order form + SweetAlert purchase confirmation
  AuthPage.ts        Sign up, log in (desktop + mobile), log out
fixtures/
  authFixtures.ts    authenticatedPage / cartWithOneProduct / cartWithTwoProducts fixtures
tests/
  auth.spec.ts       Registration, login, negative-login scenarios
  cart.spec.ts       Cart CRUD + persistence
  checkout.spec.ts   Purchase flow + known-bug placeholders
  ui.spec.ts         Desktop UI scenarios (home, navigation, images, carousel, modals)
  mobile.spec.ts     Mobile-viewport scenarios (collapsed navbar, mobile auth, mobile checkout)
utils/
  constants.ts       PAGE_TITLE, URL patterns, MESSAGES, CATEGORY_PRODUCTS, viewport, etc.
  testData.ts        generateUser(), DEFAULT_ORDER, invalid-login scenarios, CC constants
.github/workflows/
  playwright.yml     CI workflow (install → typecheck → install browsers → run tests → upload report)
playwright.config.ts Project config, reporter, timeouts, baseURL
tsconfig.json        TypeScript strict mode configuration
```

### Conventions

- Locators are private inside each Page Object. Tests never call `.click()` / `.fill()` on a raw locator — they go through a semantic POM method (`homePage.openCategory('Phones')`, `authPage.logout()`, etc.).
- Locators may appear inside `expect()` assertions to leverage Playwright auto-retry (e.g. `expect(authPage.loggedInUsername).toBeVisible()`). Each POM exposes read-only getters for this purpose.
- No `expect()` calls live inside a Page Object — assertions belong in the test layer.
- Magic strings (URLs, dialog text, expected messages) live in `utils/constants.ts`; test data lives in `utils/testData.ts`.
- Tests contain arrange / act / assert only — no loops or conditionals inside `test()` bodies. Parametrization happens outside the test body (`for (...) test(...)`).
- Each Page Object has a header comment documenting the URL inspected and the HTML structure backing the key locators, so future DOM changes can be traced back to the source.

## CI

Tests run automatically on every push and pull request to `main`:

1. Checkout + Node 20 setup (npm cache enabled)
2. `npm ci`
3. `npm run typecheck` — TypeScript strict compile check
4. `npx playwright install chromium --with-deps`
5. `npm test` — full Playwright run
6. The HTML report is always uploaded as a `playwright-report` artifact (7-day retention)
7. On failure, `test-results/` is additionally uploaded as `playwright-traces` for trace/video inspection

Configured at `.github/workflows/playwright.yml`.
