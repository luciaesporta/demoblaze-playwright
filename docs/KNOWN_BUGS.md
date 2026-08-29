# Known Bugs

Defects in [demoblaze](https://www.demoblaze.com) that this suite has pinned
down. Each one is covered by a test marked `test.fail()`, so the suite fails if a
bug is silently fixed — the marker cannot outlive the defect.

**38 `test.fail()` markers, expanding to 51 tests at runtime** (two are
parametrised). They group into **24 distinct defects** below.

The "Evidenced by" column counts tests demonstrating each defect, and sums to
more than 51: a single axe scan reports several rule violations at once, so those
tests appear against more than one defect.

None of these are test weaknesses. They are application behaviour we cannot
change, since the site is third-party.

> **How to read severity.** Ranked by user impact, following
> [TEST_STRATEGY.md](./TEST_STRATEGY.md) §2: **Critical** blocks or corrupts a
> purchase; **High** blocks a subset of users or lets bad data through;
> **Medium** degrades experience; **Low** is cosmetic or advisory.

---

## Summary

| ID   | Defect                                          | Severity | Area          | Evidenced by |
| ---- | ----------------------------------------------- | -------- | ------------- | ------------ |
| B-01 | Checkout accepts any credit card value          | Critical | Checkout      | 2            |
| B-02 | Checkout accepts empty and invalid order fields | Critical | Checkout      | 12           |
| B-03 | Place Order works on an empty cart              | High     | Cart          | 1            |
| B-04 | Log out link shown to signed-out users          | High     | Session       | 1            |
| B-05 | Contact form submits with empty fields          | High     | UI            | 1            |
| B-06 | Contact form accepts malformed email addresses  | High     | UI            | 3            |
| B-07 | Images ship without alt text                    | High     | Accessibility | 6            |
| B-08 | Form inputs have no associated labels           | High     | Accessibility | 2            |
| B-09 | Links have no accessible name                   | High     | Accessibility | 2            |
| B-10 | Mobile menu sets an unsupported ARIA attribute  | High     | Accessibility | 1            |
| B-11 | Modals do not close with ESC                    | Medium   | UI            | 4            |
| B-12 | Modals do not close on outside click            | Medium   | UI            | 3            |
| B-13 | Modal fields retain values after reopening      | Medium   | UI            | 2            |
| B-14 | Contact modal stays open after sending          | Medium   | UI            | 1            |
| B-15 | Text fails WCAG AA contrast                     | Medium   | Accessibility | 3            |
| B-16 | Enter does not submit auth forms                | Medium   | Accessibility | 2            |
| B-17 | Login errors appear only as a browser alert     | Medium   | Accessibility | 1            |
| B-18 | Tab order does not follow the visual layout     | Medium   | Accessibility | 1            |
| B-19 | Heading hierarchy is not sequential             | Medium   | Accessibility | 1            |
| B-20 | Browser back/forward loses category state       | Medium   | Navigation    | 1            |
| B-21 | Cumulative layout shift is ~2x the budget       | Medium   | Performance   | 1            |
| B-22 | Order confirmation shows the wrong date         | Low      | Checkout      | 1            |
| B-23 | Carousel ignores swipe gestures                 | Low      | Mobile        | 1            |
| B-24 | Touch targets below the 44px guideline          | Low      | Mobile        | 1            |

---

## Critical

### B-01 — Checkout accepts any credit card value

**Tests** `checkout.spec.ts` — `credit card field rejects non-numeric characters`, `credit card field validates length`

**Steps**

1. Add any product to the cart and open Place Order.
2. Fill the form with a credit card of `abc-def-ghi`, or a single digit.
3. Purchase.

**Expected** The purchase is rejected with a validation message.
**Actual** The order completes and a confirmation is issued.

**Workaround** None. Any string is accepted, including empty-adjacent values.

---

### B-02 — Checkout accepts empty and invalid order fields

**Tests** `checkout.spec.ts` — `purchase blocked when ${scenario}`, 12 parametrised cases: country / city / month / year empty, name or country containing only digits, city with special characters, month out of range (13), year in the past (2020), credit card with spaces or dashes.

**Steps**

1. Add a product, open Place Order.
2. Leave a required field blank, or enter nonsense (`month = 13`, `year = 2020`).
3. Purchase.

**Expected** The purchase is blocked and the modal stays open.
**Actual** The order completes. Only Name and Credit Card are enforced at all,
and then only for emptiness.

**Workaround** None. Orders can be placed with unusable delivery details.

---

## High

### B-03 — Place Order works on an empty cart

**Test** `cart.spec.ts` — `Place Order on empty cart should not allow checkout`

**Steps** Sign in, go to the cart with no items, click Place Order.

**Expected** The button is disabled, or the modal does not open.
**Actual** The order modal opens and a purchase can be completed for nothing.

**Workaround** None.

---

### B-04 — Log out link shown to signed-out users

**Test** `ui.spec.ts` — `log out link visible regardless of session state (bug verification)`

**Steps** Open the site without signing in and inspect the navbar.

**Expected** "Log out" appears only in an authenticated session.
**Actual** The link is present in the DOM regardless of session state.

**Workaround** None. Clicking it while signed out is a no-op, so the impact is
confusion rather than breakage.

---

### B-05 — Contact form submits with empty fields

**Test** `ui.spec.ts` — `contact form with empty fields should not submit`

**Steps** Open Contact, leave every field blank, Send message.

**Expected** Validation blocks the send.
**Actual** The success alert appears as though a message were sent.

**Workaround** None.

---

### B-06 — Contact form accepts malformed email addresses

**Test** `ui.spec.ts` — `contact form rejects invalid email: "..."`, 3 parametrised
cases: `usernoatsign`, `user@`, `@nodomain.com`

**Steps** Open Contact, enter one of the values above as the email, Send message.

**Expected** The form rejects an address with no `@`, no domain, or no local part.
**Actual** The message is accepted and reported as sent.

**Workaround** None.

---

### B-07 — Images ship without alt text

**Tests** `a11y.spec.ts` — axe `image-alt` (critical) on the home page, empty
cart, cart with a product, and mobile home; plus `product card images have alt
text` and `product detail image has alt text`.

**Steps** Run an axe scan on any page, or inspect any `.card-img-top` or the
navbar brand.

**Expected** Every meaningful image carries descriptive `alt` text.
**Actual** `alt` is absent. 2 nodes on the home page, 12 on the empty cart.

**Workaround** None. Screen reader users get no product identification from the
catalog.

---

### B-08 — Form inputs have no associated labels

**Tests** `a11y.spec.ts` — `login modal inputs have associated labels`, `contact
modal inputs have associated labels`

**Steps** Open the login or contact modal, check each input for a matching
`<label for>`.

**Expected** Every input is programmatically labelled.
**Actual** The login and contact modals have no `label[for]` pairing. The sign-up
modal is correct, which is why its equivalent test passes.

**Workaround** None.

> The Place Order modal is the exception across the whole site: all six of its
> fields are labelled correctly and its axe scan is clean.

---

### B-09 — Links have no accessible name

**Tests** `a11y.spec.ts` — axe `link-name` (serious) on the home page and mobile
home page

**Steps** Run an axe scan on the home page.

**Expected** Every link exposes a name to assistive technology.
**Actual** 9 nodes fail. Notably, the cart page does **not** have this problem —
its Delete links and Place Order button are named correctly.

**Workaround** None.

---

### B-10 — Mobile menu sets an unsupported ARIA attribute

**Test** `a11y.spec.ts` — `expanded navigation menu passes axe WCAG 2.1 AA scan`

**Steps** Load the site at a mobile viewport, open the hamburger menu, run an
axe scan.

**Expected** No ARIA violations.
**Actual** Critical `aria-allowed-attr` on `#navbarExample`.

This one is **invisible with the menu closed** — it only exists while the mobile
navigation is expanded, which is why it has a dedicated test.

**Workaround** None.

---

## Medium

### B-11 — Modals do not close with ESC

**Tests** `auth.spec.ts` — login, sign up; `checkout.spec.ts` — Place Order;
`ui.spec.ts` — About us

**Steps** Open any of those modals and press Escape.

**Expected** The modal closes, per standard dialog behaviour.
**Actual** It stays open.

**Workaround** Use the × or Close button.

> Bootstrap's `keyboard` dismiss option appears to be disabled site-wide. The
> Place Order modal _does_ restore focus to its trigger on close, so focus
> management itself is implemented — only ESC dismissal is missing.

---

### B-12 — Modals do not close on outside click

**Tests** `auth.spec.ts` — login, sign up; `ui.spec.ts` — About us

**Steps** Open the modal, click the backdrop outside it.

**Expected** The modal closes.
**Actual** It stays open.

**Workaround** Use the × or Close button.

---

### B-13 — Modal fields retain values after reopening

**Tests** `auth.spec.ts` — `login modal fields are cleared after closing with X
and reopening`; `ui.spec.ts` — `contact form fields are cleared after closing and
reopening`

**Steps** Open the modal, type into the fields, close with ×, reopen.

**Expected** Fields are empty.
**Actual** Previous input is still there.

**Workaround** Clear the fields manually. Worth noting for shared machines — a
previously typed username stays visible.

---

### B-14 — Contact modal stays open after sending

**Test** `ui.spec.ts` — `contact modal closes after sending message`

**Steps** Open Contact, fill valid data, Send message, dismiss the alert.

**Expected** The modal closes once the message is sent.
**Actual** It remains open, giving no clear signal the interaction finished.

**Workaround** Close manually.

---

### B-15 — Text fails WCAG AA contrast

**Tests** `a11y.spec.ts` — axe `color-contrast` (serious) on the home page, cart
and mobile home

**Steps** Run an axe scan on the home page.

**Expected** Text meets the 4.5:1 AA ratio against its background.
**Actual** 18 nodes fail on the home page — product card titles and prices
against the card background.

**Workaround** None.

---

### B-16 — Enter does not submit auth forms

**Tests** `a11y.spec.ts` — `pressing Enter on password field submits login`,
`... submits sign up`

**Steps** Open the login or sign-up modal, fill both fields, press Enter in the
password field.

**Expected** The form submits.
**Actual** Nothing happens; the button must be clicked.

**Workaround** Click the submit button. Keyboard-only users can still Tab to it.

---

### B-17 — Login errors appear only as a browser alert

**Test** `a11y.spec.ts` — `login error displays inline feedback, not just alert`

**Steps** Attempt to log in with a non-existent user.

**Expected** An inline error near the form, in a live region.
**Actual** A native `alert()` only. Nothing in the modal indicates a problem, and
the error is not announced in context.

**Workaround** None.

---

### B-18 — Tab order does not follow the visual layout

**Test** `a11y.spec.ts` — `tab navigation follows logical focus order`

**Steps** Open the login modal, focus the username field, Tab through.

**Expected** username → password → Log in → close.
**Actual** Focus does not follow that sequence.

**Workaround** None.

---

### B-19 — Heading hierarchy is not sequential

**Test** `a11y.spec.ts` — `home page has correct heading hierarchy`

**Steps** Inspect the visible headings on the home page.

**Expected** One `h1`, and no skipped levels.
**Actual** The page either lacks an `h1` or skips a level.

**Workaround** None.

---

### B-20 — Browser back/forward loses category state

**Test** `ui.spec.ts` — `browser back/forward after category filter preserves navigation`

**Steps** Load the home page, filter by Phones, press Back, then Forward.

**Expected** Back restores the full catalog; Forward returns to the filtered list.
**Actual** The product list does not match what the history entry should show.

Category filtering is done in script without a URL change, so history has nothing
to restore.

**Workaround** Re-apply the filter after navigating.

---

### B-21 — Cumulative layout shift is ~2x the budget

**Test** `performance.spec.ts` — `browsing from home to cart stays within the layout shift budget`

**Steps** Load the home page, open a product, go to the cart, measuring CLS on
each page.

**Expected** Total CLS under 0.1.
**Actual** ~0.18–0.19 across the journey. Measured per page: home 0.091,
product 0.089, cart 0.004 — the home page alone nearly exhausts the budget.

**Workaround** None. Content moves under the pointer while the page settles.

---

## Low

### B-22 — Order confirmation shows the wrong date

**Test** `checkout.spec.ts` — `confirmation date matches current date`

**Steps** Complete a purchase and read the confirmation.

**Expected** The confirmation shows today's date as `d/m/yyyy`.
**Actual** The date does not match the current date.

**Workaround** None. Cosmetic — the order still completes.

---

### B-23 — Carousel ignores swipe gestures

**Test** `mobile.spec.ts` — `carousel responds to swipe gestures`

**Steps** On a mobile viewport, swipe left on the hero carousel.

**Expected** The carousel advances.
**Actual** The active slide does not change.

**Workaround** Use the Previous/Next controls, which work.

---

### B-24 — Touch targets below the 44px guideline

**Tests** `a11y.spec.ts` — `interactive targets meet the comfortable mobile
target size`; `mobile.spec.ts` — `Place Order modal fields are visible without
horizontal scroll`

**Steps** Load the site at 390x844 and measure interactive elements.

**Expected** At least 44x44 CSS pixels (WCAG 2.1 AAA / common mobile guidance).
**Actual** 15 of 32 visible targets fall short: product links render 29px tall,
carousel controls 36px.

This clears the **WCAG 2.2 AA minimum of 24x24** — that test passes. It is a
usability gap, not an AA failure, which is why it is ranked Low.

**Workaround** None.

---

## Maintaining this list

When a defect is fixed upstream, its `test.fail()` test starts passing, and
Playwright reports an unexpectedly-passing test as a **failure**. That is
deliberate: it forces the marker and this entry to be removed together.

If that happens:

1. Remove `test.fail()` from the test.
2. Confirm it passes for the right reason.
3. Delete the entry here and update the counts at the top.
