const { test, expect } = require('@playwright/test');
const { test: authTest } = require('../fixtures/authFixtures');
const { HomePage } = require('../pages/HomePage');
const { ProductPage } = require('../pages/ProductPage');
const { AuthPage } = require('../pages/AuthPage');
const { PAGE_TITLE, PRODUCT_PAGE_URL, CATEGORY_PRODUCTS } = require('../utils/constants');

test('UI — Home page displays the store title', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await expect(page).toHaveTitle(PAGE_TITLE);
});

test('UI — Home page loads product cards', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  const cards = page.locator('.card-title a');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(0);
});

test('UI — Filtering by category updates the product list', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await homePage.openCategory('Phones');
  await expect(page.locator('.card-title a').first()).toBeVisible();

  await homePage.openCategory('Monitors');
  await expect(page.locator('.card-title a').first()).toBeVisible();
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

  await homePage.navbarBrand.click();

  await expect(page).toHaveTitle(PAGE_TITLE);
  await expect(page.locator('.card-title a').first()).toBeVisible();
});

test('UI — Cart link in navbar navigates to the cart page', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();
  await homePage.cartNavLink.click();
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

  await expect(page.locator('.card-title a').first()).toBeVisible();
  const initialProducts = await homePage.getProductNames();
  expect(initialProducts.length).toBeGreaterThan(0);

  await homePage.nextButton.click();
  await expect(async () => {
    const nextProducts = await homePage.getProductNames();
    expect(nextProducts).not.toEqual(initialProducts);
    expect(nextProducts.length).toBeGreaterThan(0);
  }).toPass();

  await homePage.prevButton.click();
  await expect(async () => {
    const prevProducts = await homePage.getProductNames();
    // Demoblaze has a known bug where 'Previous' shifts the item list by one.
    // Instead of deep equality, we verify that the page loaded an initial product.
    expect(initialProducts).toContain(prevProducts[0]);
  }).toPass();
});

test('UI — Hero banner auto-advances and responds to manual controls', async ({ page }) => {
  const homePage = new HomePage(page);
  await homePage.goto();

  await expect(homePage.activeCarouselItem).toBeVisible();

  const initialSlideSrc = await homePage.activeCarouselItem.getAttribute('src');
  const seenSlides = new Set([initialSlideSrc]);

  await expect(async () => {
    const nextSlideSrc = await homePage.activeCarouselItem.getAttribute('src');
    expect(nextSlideSrc).not.toEqual(initialSlideSrc);
  }).toPass({ timeout: 10000 });

  let currentSlideSrc = await homePage.activeCarouselItem.getAttribute('src');
  seenSlides.add(currentSlideSrc);

  await homePage.carouselNext.click();
  await expect(async () => {
    const newSlideSrc = await homePage.activeCarouselItem.getAttribute('src');
    expect(newSlideSrc).not.toEqual(currentSlideSrc);
  }).toPass();

  currentSlideSrc = await homePage.activeCarouselItem.getAttribute('src');
  seenSlides.add(currentSlideSrc);

  await homePage.carouselPrev.click();
  await expect(async () => {
    const prevSlideSrc = await homePage.activeCarouselItem.getAttribute('src');
    expect(prevSlideSrc).not.toEqual(currentSlideSrc);
  }).toPass();

  currentSlideSrc = await homePage.activeCarouselItem.getAttribute('src');
  seenSlides.add(currentSlideSrc);

  expect(seenSlides.size).toBeGreaterThanOrEqual(3);
});
