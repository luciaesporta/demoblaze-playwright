# demoblaze-playwright

End-to-end test suite for [Product Store](https://www.demoblaze.com), built with Playwright.

## About the application

Product Store is a web-based e-commerce application that allows users to browse and purchase technology products across three categories: phones, laptops, and monitors.

Its most critical feature is the purchase flow — specifically the Place Order functionality, which consolidates shipping details and payment information into a single step. Any failure in this flow has a direct business impact, making it the highest priority area from a testing perspective.

Supporting features include user authentication (sign up and log in), which enables session-based cart persistence, and the product catalog with category filtering, which drives product discoverability and ultimately conversion. The UI is designed for desktop and mobile, with a responsive layout that adapts to different screen sizes.

## Test coverage

| Area | Cases |
|------|-------|
| Cart | Guest user can add a product to cart |
| Cart | Authenticated user can add a product to cart |
| Auth | Successful user registration |
| Auth | Successful login |
| Auth | Login fails with non-existent user |
| Auth | Login fails with wrong password |

## Tech stack

- [Playwright](https://playwright.dev/) — test framework
- Page Object Model (POM) — test architecture
- Playwright Fixtures — reusable authenticated session setup
- Data-driven testing — parameterized negative scenarios
- GitHub Actions — CI/CD

## Project structure

```
pages/          # Page Object classes
fixtures/       # Playwright fixtures (e.g. authenticated session)
tests/          # Test specs
utils/          # Test data utilities
.github/        # CI workflow
```

## Run locally

```bash
npm install
npx playwright install chromium
npm test
```

## CI

Tests run automatically on every push and pull request to `main`. The HTML report is uploaded as an artifact on each run.
