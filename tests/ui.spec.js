const { test, expect } = require('@playwright/test');
const { test: authTest } = require('../fixtures/authFixtures');
const { HomePage } = require('../pages/HomePage');
const { ProductPage } = require('../pages/ProductPage');
const { AuthPage } = require('../pages/AuthPage');
const { CartPage } = require('../pages/CartPage');
const { PAGE_TITLE, PRODUCT_PAGE_URL, CATEGORY_PRODUCTS } = require('../utils/constants');

test('UI — Home page displays the store title', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await expect(page).toHaveTitle(PAGE_TITLE);
});

test('UI — Home page loads product cards', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  const cards = homePage.productCards;
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);
});

test('UI — Filtering by category updates the product list', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openCategory('Phones');
  await expect(homePage.firstProductLink).toBeVisible();

  await homePage.openCategory('Monitors');
  await expect(homePage.firstProductLink).toBeVisible();
});

test('UI — Clicking a product card navigates to its detail page', async ({ page }) => {
  const homePage = new HomePage(page);
  const productPage = new ProductPage(page);
  await homePage.goto();
  await homePage.openProduct(0);
  await expect(page).toHaveURL(PRODUCT_PAGE_URL);
  await expect(productPage.productName).toBeVisible();
  await expect(productPage.productPrice).toBeVisible();
});

test('UI — Navbar logo navigates back to home from a product page', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.openProduct(0);
  await expect(page).toHaveURL(PRODUCT_PAGE_URL);

  await homePage.clickNavBrand();

  await expect(page).toHaveTitle(PAGE_TITLE);
  await expect(homePage.firstProductLink).toBeVisible();
});

test('UI — Cart link in navbar navigates to the cart page', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.clickCart();
  await expect(page).toHaveURL(/cart\.html/);
});

test('UI — Category filters return correct products', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  for (const [category, expectedProducts] of Object.entries(CATEGORY_PRODUCTS)) {
    await homePage.openCategory(category);
    await expect(async () => {
      const shown = await homePage.getProductNames();
      for (const name of shown) {
        expect(expectedProducts).toContain(name);
      }
    }).toPass();
  }
});

authTest('UI — Logged-in user can log out', async ({ authenticatedPage }) => {
  const { page } = authenticatedPage;
  const authPage = new AuthPage(page);

  await expect(authPage.loggedInUsername).toBeVisible();

  await authPage.logoutButton.click();

  await expect(authPage.loggedInUsername).not.toBeVisible();
  await expect(authPage.logInNavButton).toBeVisible();
});

test('UI — Pagination navigates between product pages', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await expect(homePage.firstProductLink).toBeVisible();
  const initialProducts = await homePage.getProductNames();
  expect(initialProducts.length).toBeGreaterThan(0);

  await homePage.clickNext();
  await expect(async () => {
    const nextProducts = await homePage.getProductNames();
    expect(nextProducts).not.toEqual(initialProducts);
    expect(nextProducts.length).toBeGreaterThan(0);
  }).toPass();

  await homePage.clickPrev();
  await expect(async () => {
    const prevProducts = await homePage.getProductNames();
    expect(initialProducts).toContain(prevProducts[0]);
  }).toPass();
});

test('UI — Hero banner auto-advances and responds to manual controls', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await expect(homePage.activeCarouselItem).toBeVisible();

  const initialSlideSrc = await homePage.getActiveCarouselSrc();
  const seenSlides = new Set([initialSlideSrc]);

  await expect(async () => {
    const nextSlideSrc = await homePage.getActiveCarouselSrc();
    expect(nextSlideSrc).not.toEqual(initialSlideSrc);
  }).toPass({ timeout: 10000 });

  let currentSlideSrc = await homePage.getActiveCarouselSrc();
  seenSlides.add(currentSlideSrc);

  await homePage.clickCarouselNext();
  await expect(async () => {
    const newSlideSrc = await homePage.getActiveCarouselSrc();
    expect(newSlideSrc).not.toEqual(currentSlideSrc);
  }).toPass();

  currentSlideSrc = await homePage.getActiveCarouselSrc();
  seenSlides.add(currentSlideSrc);

  await homePage.clickCarouselPrev();
  await expect(async () => {
    const prevSlideSrc = await homePage.getActiveCarouselSrc();
    expect(prevSlideSrc).not.toEqual(currentSlideSrc);
  }).toPass();

  currentSlideSrc = await homePage.getActiveCarouselSrc();
  seenSlides.add(currentSlideSrc);

  expect(seenSlides.size).toBeGreaterThanOrEqual(3);
});

test('UI — Contact form can be submitted with valid data', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openContactModal();
  await homePage.fillContactForm({
    email: 'test@example.com',
    name: 'Test User',
    message: 'This is a test message.',
  });
  const message = await homePage.submitContactForm();

  expect(message).toContain('Thanks');
});

test('UI — Application is usable on mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  const homePage = new HomePage(page);
  await homePage.goto();

  await expect(homePage.hamburger).toBeVisible();

  await homePage.clickHamburger();
  await expect(homePage.navbarCollapsible).toBeVisible();
  await expect(homePage.cartNavLink).toBeVisible();

  await expect(homePage.firstProductLink).toBeVisible();

  await homePage.openFirstProduct();

  const productPage = new ProductPage(page);
  await productPage.addToCart();

  await expect(homePage.hamburger).toBeVisible();
  await homePage.clickHamburger({ force: true });
  await expect(homePage.cartNavLink).toBeVisible();

  await homePage.clickCart({ force: true });

  const cartPage = new CartPage(page);
  await expect(cartPage.placeOrderButton).toBeVisible();
  await cartPage.openPlaceOrderModal();
  await expect(cartPage.orderModal).toBeVisible();
  await cartPage.closePlaceOrderModal();
});
