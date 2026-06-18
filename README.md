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
| Auth | Sign up rejects duplicate username |
| Auth | Sign up fails with only username (missing password) |
| Auth | Sign up fails with only password (missing username) |
| Auth | Sign up accepts username with special characters (parametrized: punctuation, emoji, whitespace) |
| Auth | Sign up accepts username longer than 100 characters |
| Auth | Sign up safely handles basic SQL injection payload in username (security smoke test) |
| Auth | Sign up safely handles XSS payload in username — no script execution (security smoke test) |
| Auth | Successful login after registration |
| Auth | Login and sign up forms reject empty submission |
| Auth | Login modal fields are cleared after closing with X and reopening (known bug — `test.fail`) |
| Auth | ESC key closes login modal (known bug — `test.fail`) |
| Auth | ESC key closes sign up modal (known bug — `test.fail`) |
| Auth | Clicking outside closes login modal (known bug — `test.fail`) |
| Auth | Clicking outside closes sign up modal (known bug — `test.fail`) |
| Auth | Password fields mask their input |
| Auth | Login fails with non-existent user |
| Auth | Login fails with wrong password |
| Auth | Login does not trim whitespace around username |
| Auth | Login username is case-sensitive |
| Auth | Session persists after page refresh |
| Auth | Session persists after closing and reopening tab |
| Auth | Logout clears the cart |
| Auth | Consecutive logins with different users switch session correctly |
| Cart | Guest user can add a product to cart |
| Cart | Authenticated user can add a product to cart |
| Cart | Empty cart shows no items and blank total |
| Cart | Cart displays full list when multiple products are added |
| Cart | Total reflects all added items |
| Cart | Deleting an item updates the cart correctly |
| Cart | Cart persists across page navigation |
| Cart | Cart state is preserved after interrupting the purchase flow |
| Cart | Adding the same product twice results in two rows |
| Cart | Adding 10+ products sums total correctly |
| Cart | Deleting all items one by one empties the cart |
| Cart | Deleting first item keeps second item in place |
| Cart | Deleting last item keeps first item in place |
| Cart | Cart is not shared between different users |
| Cart | Place Order on empty cart should not allow checkout (known bug — `test.fail`) |
| Cart | Cart persists after page refresh |
| Cart | Products from different categories coexist in cart |
| Cart | Cart price matches product detail page price |
| Cart | Cart name matches product detail page name |
| Checkout | Successful purchase with all fields completed |
| Checkout | Purchase cannot be submitted with mandatory fields empty |
| Checkout | Total in modal matches cart total |
| Checkout | Order confirmation message contains purchase details |
| Checkout | Modal can be dismissed without placing an order |
| Checkout | Credit card field rejects non-numeric characters (known bug — `test.fail`) |
| Checkout | Credit card field validates length (known bug — `test.fail`) |
| Checkout | Purchase blocked when name empty |
| Checkout | Purchase blocked when credit card empty |
| Checkout | Purchase blocked when country empty (known bug — `test.fail`) |
| Checkout | Purchase blocked when city empty (known bug — `test.fail`) |
| Checkout | Purchase blocked when month empty (known bug — `test.fail`) |
| Checkout | Purchase blocked when year empty (known bug — `test.fail`) |
| Checkout | Purchase blocked when name contains only numbers (known bug — `test.fail`) |
| Checkout | Purchase blocked when country contains only numbers (known bug — `test.fail`) |
| Checkout | Purchase blocked when city contains special characters (known bug — `test.fail`) |
| Checkout | Purchase blocked when month out of range — 13 (known bug — `test.fail`) |
| Checkout | Purchase blocked when year in the past — 2020 (known bug — `test.fail`) |
| Checkout | Purchase blocked when credit card with spaces (known bug — `test.fail`) |
| Checkout | Purchase blocked when credit card with dashes (known bug — `test.fail`) |
| Checkout | Place Order modal can be closed with X button |
| Checkout | Place Order modal can be closed with ESC key (known bug — `test.fail`) |
| Checkout | Confirmation ID and Amount have valid format |
| Checkout | Confirmation date matches current date (known bug — `test.fail`) |
| UI | Home page displays the store title |
| UI | Home page loads product cards |
| UI | Filtering by category updates the product list |
| UI | Clicking a product card navigates to its detail page |
| UI | Detail page loads correctly from catalog |
| UI | Navbar logo returns to home from a product page |
| UI | Navbar logo returns to home from the cart page |
| UI | Navbar logo is not clickable while Place Order modal is open |
| UI | Cart link in navbar navigates to the cart page |
| UI | Pagination navigates between product pages |
| UI | Previous button on first page does not change product list (known bug — `test.fail`) |
| UI | Next button on last page does not change product list (known bug — `test.fail`) |
| UI | Category shows exact product count (parametrized: Phones 7, Laptops 6, Monitors 2) |
| UI | Switching category resets pagination to first page |
| UI | Products load correctly after page refresh |
| UI | Browser back/forward after category filter preserves navigation (known bug — `test.fail`) |
| UI | Non-existent product URL shows empty detail page |
| UI | Direct URL to cart without products renders correctly |
| UI | Category filters return correct products (parametrized per category) |
| UI | Product card and detail images load (parametrized per category / product) |
| UI | Hero banner auto-advances and responds to manual controls |
| UI | Page title and favicon are present and correct |
| UI | About us modal loads video content |
| UI | About us modal can be closed with X button |
| UI | About us modal can be closed with ESC key (known bug — `test.fail`) |
| UI | About us modal can be closed by clicking outside (known bug — `test.fail`) |
| UI | Contact form can be submitted with valid data |
| UI | Contact form with empty fields should not submit (known bug — `test.fail`) |
| UI | Contact modal closes after sending message (known bug — `test.fail`) |
| UI | Contact form fields are cleared after closing and reopening (known bug — `test.fail`) |
| UI | Contact form rejects invalid email (parametrized: no @, no domain, no user) (known bug — `test.fail`) |
| UI | Logged-in user can log out |
| UI | Log out link visible regardless of session state (known bug — `test.fail`) |
| Mobile | Application is usable on mobile viewport |
| Mobile | Login and sign up modals are usable |
| Mobile | Category filters work through collapsed navbar (parametrized per category) |
| Mobile | Category list expands and collapses with tap on mobile |
| Mobile | Cart layout does not overflow on mobile viewport |
| Mobile | Carousel responds to swipe gestures (known bug — `test.fail`) |
| Mobile | Place Order modal fields are visible without horizontal scroll (known bug — `test.fail`) |
| Mobile | Orientation change from portrait to landscape does not break layout |
| Mobile | Full purchase flow completes on mobile viewport |
| A11y | Login modal tab navigation follows logical focus order (known bug — `test.fail`) |
| A11y | Pressing Enter on password field submits login (known bug — `test.fail`) |
| A11y | Pressing Enter on password field submits sign up (known bug — `test.fail`) |
| A11y | Login modal inputs have associated labels (known bug — `test.fail`) |
| A11y | Sign up modal inputs have associated labels |
| A11y | Contact modal inputs have associated labels (known bug — `test.fail`) |
| A11y | Product card images have alt text (known bug — `test.fail`) |
| A11y | Product detail image has alt text (known bug — `test.fail`) |
| A11y | Home page has correct heading hierarchy (known bug — `test.fail`) |
| A11y | Login error displays inline feedback, not just alert (known bug — `test.fail`) |
| A11y | Product card text meets WCAG AA contrast ratio |
| API | Intercept addtocart request and validate payload |
| API | Intercept deleteitem request and validate payload and response |

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
  api.spec.ts        API/network request interception and payload validation
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
