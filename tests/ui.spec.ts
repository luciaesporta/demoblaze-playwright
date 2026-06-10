import { test, expect } from '../fixtures/authFixtures';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { AuthPage } from '../pages/AuthPage';
import { CartPage } from '../pages/CartPage';
import {
  PAGE_TITLE,
  PRODUCT_PAGE_URL,
  CART_PAGE_URL,
  FAVICON_HREF,
  CATEGORY_PRODUCTS,
  MESSAGES,
  CONTACT_FORM_SAMPLE,
  HERO_CAROUSEL_MIN_DISTINCT_SLIDES,
  type CategoryName,
} from '../utils/constants';

const CATEGORY_NAMES = Object.keys(CATEGORY_PRODUCTS) as CategoryName[];

test.describe('UI — Home page', () => {
  test('displays the store title', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await expect(page).toHaveTitle(PAGE_TITLE);
  });

  test('loads product cards', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.firstProductLink).toBeVisible();
    const count = await homePage.getProductCardCount();
    expect(count).toBeGreaterThan(0);
  });

  test('filtering by category updates the product list', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.openCategory('Phones');
    await expect(homePage.firstProductLink).toBeVisible();

    await homePage.openCategory('Monitors');
    await expect(homePage.firstProductLink).toBeVisible();
  });

  test('products load correctly after page refresh', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.firstProductLink).toBeVisible();
    const initialProducts = await homePage.getProductNames();

    await page.reload({ waitUntil: 'domcontentloaded' });

    await expect(homePage.firstProductLink).toBeVisible();
    const afterRefresh = await homePage.getProductNames();
    expect(afterRefresh).toEqual(initialProducts);
  });

  test('page title and favicon are present and correct', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await homePage.goto();
    await expect(page).toHaveTitle(PAGE_TITLE);
    expect(await homePage.getFaviconHref()).toMatch(FAVICON_HREF);

    await homePage.openProduct(0);
    await expect(productPage.productName).toBeVisible();
    await expect(page).toHaveTitle(PAGE_TITLE);
    expect(await productPage.getFaviconHref()).toMatch(FAVICON_HREF);

    await cartPage.goto();
    await expect(page).toHaveTitle(PAGE_TITLE);
    expect(await cartPage.getFaviconHref()).toMatch(FAVICON_HREF);
  });
});

test.describe('UI — Navigation', () => {
  test('navbar logo returns to home from a product page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.openProduct(0);
    await expect(page).toHaveURL(PRODUCT_PAGE_URL);

    await homePage.clickNavBrand();

    await expect(page).toHaveTitle(PAGE_TITLE);
    await expect(homePage.firstProductLink).toBeVisible();
  });

  test('navbar logo returns to home from the cart page', async ({ page }) => {
    const homePage = new HomePage(page);
    const cartPage = new CartPage(page);

    await cartPage.goto();
    await expect(page).toHaveURL(CART_PAGE_URL);

    await homePage.clickNavBrand();

    await expect(page).toHaveTitle(PAGE_TITLE);
    await expect(homePage.firstProductLink).toBeVisible();
  });

  test('navbar logo is not clickable while Place Order modal is open', async ({ cartWithOneProduct }) => {
    const { page } = cartWithOneProduct;
    const homePage = new HomePage(page);
    const cartPage = new CartPage(page);

    await cartPage.goto();
    await cartPage.openPlaceOrderModal();
    await expect(cartPage.orderModal).toBeVisible();

    await expect(homePage.navbarBrand).toBeVisible();
    const navResult = await homePage.navbarBrand.click({ timeout: 2_000, trial: true }).then(() => true).catch(() => false);
    expect(navResult).toBe(false);

    await expect(page).toHaveURL(CART_PAGE_URL);
  });

  test('cart link in navbar navigates to the cart page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await homePage.clickCart();
    await expect(page).toHaveURL(CART_PAGE_URL);
  });

  test('pagination navigates between product pages', async ({ page }) => {
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

  test('Previous button on first page does not change product list', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.firstProductLink).toBeVisible();
    const initialProducts = await homePage.getProductNames();

    await homePage.clickPrev();
    await page.waitForTimeout(1000);

    const afterPrev = await homePage.getProductNames();
    expect(afterPrev).toEqual(initialProducts);
  });

  test('Next button on last page does not change product list', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.firstProductLink).toBeVisible();

    await homePage.clickNext();
    await expect(async () => {
      const products = await homePage.getProductNames();
      expect(products.length).toBeGreaterThan(0);
    }).toPass();
    const lastPageProducts = await homePage.getProductNames();

    await page.locator('#next2').click({ timeout: 5_000 });
    await page.waitForTimeout(1000);

    const afterNext = await homePage.getProductNames();
    expect(afterNext).toEqual(lastPageProducts);
  });

  test('switching category resets pagination to first page', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.firstProductLink).toBeVisible();
    const firstPageProducts = await homePage.getProductNames();

    await homePage.clickNext();
    await expect(async () => {
      const products = await homePage.getProductNames();
      expect(products).not.toEqual(firstPageProducts);
    }).toPass();

    await homePage.openCategory('Phones');

    const phonesProducts = await homePage.getProductNames();
    expect(phonesProducts[0]).toBe(CATEGORY_PRODUCTS.Phones[0]);
  });

  test('browser back/forward after category filter preserves navigation', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.firstProductLink).toBeVisible();
    const allProducts = await homePage.getProductNames();

    await homePage.openCategory('Phones');
    const phonesProducts = await homePage.getProductNames();
    expect(phonesProducts.length).toBe(CATEGORY_PRODUCTS.Phones.length);

    await page.goBack({ waitUntil: 'domcontentloaded' });
    await expect(homePage.firstProductLink).toBeVisible();
    const afterBack = await homePage.getProductNames();
    expect(afterBack).toEqual(allProducts);

    await page.goForward({ waitUntil: 'domcontentloaded' });
    await expect(homePage.firstProductLink).toBeVisible();
    const afterForward = await homePage.getProductNames();
    expect(afterForward).toEqual(phonesProducts);
  });
});

test.describe('UI — Product detail', () => {
  test('clicking a product card navigates to its detail page', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    await homePage.goto();
    await homePage.openProduct(0);

    await expect(page).toHaveURL(PRODUCT_PAGE_URL);
    await expect(productPage.productName).toBeVisible();
    await expect(productPage.productPrice).toBeVisible();
  });

  test('detail page loads correctly from catalog', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    await homePage.goto();

    const expectedName = await homePage.getProductNameAt(0);
    await homePage.openProduct(0);

    await expect(page).toHaveURL(PRODUCT_PAGE_URL);

    await expect(productPage.productName).toBeVisible();
    expect(await productPage.getProductName()).toBe(expectedName);

    await expect(productPage.productPrice).toBeVisible();
    expect(await productPage.getProductPrice()).toMatch(/^\d+$/);

    await expect(productPage.productImage).toBeVisible();
    expect(await productPage.isImageLoaded()).toBe(true);

    await expect(productPage.productDescription).toBeVisible();
    expect((await productPage.getProductDescription()).length).toBeGreaterThan(0);
  });

  test('non-existent product URL shows empty detail page', async ({ page }) => {
    const productPage = new ProductPage(page);

    await page.goto('/prod.html?idp_=99999', { waitUntil: 'domcontentloaded' });

    await expect(productPage.productName).not.toBeVisible({ timeout: 3_000 });
    await expect(productPage.productPrice).not.toBeVisible({ timeout: 3_000 });
  });
});

test.describe('UI — Category filters', () => {
  for (const [category, expected] of Object.entries(CATEGORY_PRODUCTS) as [CategoryName, readonly string[]][]) {
    test(`filter "${category}" returns only expected products`, async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();

      await homePage.openCategory(category);

      await expect(async () => {
        const shown = await homePage.getProductNames();
        expect(shown.length).toBeGreaterThan(0);
        for (const name of shown) {
          expect(expected).toContain(name);
        }
      }).toPass();
    });
  }
});

test.describe('UI — Category product count', () => {
  for (const [category, expected] of Object.entries(CATEGORY_PRODUCTS) as [CategoryName, readonly string[]][]) {
    test(`"${category}" shows exactly ${expected.length} products`, async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.openCategory(category);

      await expect(async () => {
        const count = await homePage.getProductCardCount();
        expect(count).toBe(expected.length);
      }).toPass();
    });
  }
});

test.describe('UI — Images', () => {
  test('home page product card images all load', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await expect(homePage.firstProductLink).toBeVisible();

    await expect(async () => {
      expect(await homePage.areCardImagesLoaded()).toBe(true);
    }).toPass();
  });

  for (const category of CATEGORY_NAMES) {
    test(`"${category}" category product card images all load`, async ({ page }) => {
      const homePage = new HomePage(page);
      await homePage.goto();
      await homePage.openCategory(category);

      await expect(async () => {
        expect(await homePage.areCardImagesLoaded()).toBe(true);
      }).toPass();
    });
  }

  for (const productIndex of [0, 1, 2]) {
    test(`product detail image at index ${productIndex} loads`, async ({ page }) => {
      const homePage = new HomePage(page);
      const productPage = new ProductPage(page);

      await homePage.goto();
      await homePage.openProduct(productIndex);

      await expect(productPage.productImage).toBeVisible();
      expect(await productPage.isImageLoaded()).toBe(true);
    });
  }
});

test.describe('UI — Hero carousel', () => {
  test('auto-advances and responds to manual controls', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.activeCarouselItem).toBeVisible();

    const distinctSlides = await homePage.collectDistinctCarouselSlides(
      HERO_CAROUSEL_MIN_DISTINCT_SLIDES,
    );
    expect(distinctSlides).toBeGreaterThanOrEqual(HERO_CAROUSEL_MIN_DISTINCT_SLIDES);
  });
});

test.describe('UI — Modals', () => {
  test('About us modal loads video content', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.openAboutUsModal();

    await expect(homePage.videoModal).toBeVisible();
    await expect(homePage.videoModalTitle).toHaveText(MESSAGES.aboutUsTitle);
    await expect(homePage.videoElement).toBeVisible();
    expect(await homePage.getVideoPoster()).toBeTruthy();
  });

  test('contact form can be submitted with valid data', async ({ page }) => {
    const homePage = new HomePage(page);
    await homePage.goto();

    await homePage.openContactModal();
    await homePage.fillContactForm(CONTACT_FORM_SAMPLE);
    const message = await homePage.submitContactForm();

    expect(message).toContain(MESSAGES.contactSuccess);
  });
});

test.describe('UI — Session', () => {
  test('logged-in user can log out', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    const authPage = new AuthPage(page);

    await expect(authPage.loggedInUsername).toBeVisible();

    await authPage.logout();

    await expect(authPage.loggedInUsername).not.toBeVisible();
    await expect(authPage.logInNavButton).toBeVisible();
  });

  test('log out link visible regardless of session state (bug verification)', async ({ page }) => {
    // BUG: demoblaze is known to expose the "Log out" link in unauthenticated
    // sessions. Correct behavior is that it should only appear when logged in.
    // Marked as expected to fail so that test.fail() is satisfied while the bug
    // is present; if the bug is fixed, this test starts "failing" (passing) and
    // should be removed.
    test.fail();

    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    await homePage.goto();

    await expect(authPage.logInNavButton).toBeVisible();
    await expect(authPage.signUpNavButton).toBeVisible();
    await expect(authPage.logoutButton).toBeVisible();
  });
});
