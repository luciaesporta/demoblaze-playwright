import { test, expect } from '../fixtures/authFixtures';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { AuthPage } from '../pages/AuthPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import {
  MOBILE_VIEWPORT,
  MOBILE_LANDSCAPE_VIEWPORT,
  MESSAGES,
  CATEGORY_PRODUCTS,
  type CategoryName,
} from '../utils/constants';
import { generateUser, DEFAULT_ORDER } from '../utils/testData';

const CATEGORY_NAMES = Object.keys(CATEGORY_PRODUCTS) as CategoryName[];

test.describe('Mobile', () => {
  test.use({ viewport: MOBILE_VIEWPORT });

  test('application is usable on mobile viewport', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await homePage.goto();

    await expect(homePage.hamburger).toBeVisible();
    await homePage.clickHamburger();
    await expect(homePage.navbarCollapsible).toBeVisible();
    await expect(homePage.cartNavLink).toBeVisible();

    await expect(homePage.firstProductLink).toBeVisible();
    await homePage.openFirstProduct();
    await productPage.addToCart();

    await expect(homePage.hamburger).toBeVisible();
    await homePage.clickHamburger({ force: true });
    await expect(homePage.cartNavLink).toBeVisible();
    await homePage.clickCart({ force: true });

    await expect(cartPage.placeOrderButton).toBeVisible();
    await cartPage.openPlaceOrderModal();
    await expect(cartPage.orderModal).toBeVisible();
    await cartPage.closePlaceOrderModal();
  });

  test('login and sign up modals are usable', async ({ page }) => {
    const homePage = new HomePage(page);
    const authPage = new AuthPage(page);
    const { username, password } = generateUser();

    await homePage.goto();

    const signUpMessage = await authPage.registerOnMobile(username, password);
    expect(signUpMessage).toContain(MESSAGES.signUpSuccess);

    await authPage.loginOnMobile(username, password);
    await expect(authPage.loggedInUsername).toBeVisible();
    await expect(authPage.loggedInUsername).toContainText(username);
  });

  for (const category of CATEGORY_NAMES) {
    test(`"${category}" category filter works through collapsed navbar`, async ({ page }) => {
      const homePage = new HomePage(page);

      await homePage.goto();
      await expect(homePage.firstProductLink).toBeVisible();
      await homePage.openCategory(category);
      await expect(homePage.firstProductLink).toBeVisible();
    });
  }

  test('category list expands and collapses with tap on mobile', async ({ page }) => {
    const homePage = new HomePage(page);

    await homePage.goto();
    await expect(homePage.firstProductLink).toBeVisible();

    const categoriesVisible = await page.evaluate(() => {
      const catList = document.querySelector('#itemc');
      if (!catList) return false;
      const rect = catList.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    expect(categoriesVisible).toBe(true);

    for (const category of CATEGORY_NAMES) {
      const categoryLink = page.locator('#itemc').getByText(category, { exact: true });
      await expect(categoryLink).toBeVisible();
    }

    await homePage.openCategory('Phones');
    await expect(homePage.firstProductLink).toBeVisible();

    const productCount = await homePage.getProductCardCount();
    expect(productCount).toBe(CATEGORY_PRODUCTS.Phones.length);
  });

  test('carousel responds to swipe gestures', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    await homePage.goto();

    await expect(homePage.activeCarouselItem).toBeVisible();
    const initialSrc = await homePage.getActiveCarouselSrc();

    await homePage.swipeCarousel('left');
    await page.waitForFunction(
      (prevSrc) => {
        const img = document.querySelector('.carousel-item.active img');
        return img?.getAttribute('src') !== prevSrc;
      },
      initialSrc,
      { timeout: 5_000 },
    );
    const afterSwipeLeft = await homePage.getActiveCarouselSrc();
    expect(afterSwipeLeft).not.toBe(initialSrc);

    await homePage.swipeCarousel('right');
    await page.waitForFunction(
      (prevSrc) => {
        const img = document.querySelector('.carousel-item.active img');
        return img?.getAttribute('src') !== prevSrc;
      },
      afterSwipeLeft,
      { timeout: 5_000 },
    );
    const afterSwipeRight = await homePage.getActiveCarouselSrc();
    expect(afterSwipeRight).not.toBe(afterSwipeLeft);
  });

  test('cart layout does not overflow on mobile viewport', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await homePage.goto();
    await homePage.openFirstProduct();
    await productPage.addToCart();
    await homePage.goto();
    await homePage.openProduct(1);
    await productPage.addToCart();

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(2);

    const hasOverflow = await page.evaluate(() => {
      const table = document.querySelector('#tbodyid')?.closest('table');
      if (!table) return true;
      return table.scrollWidth > table.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    await expect(cartPage.cartTotal).toBeVisible();
    await expect(cartPage.placeOrderButton).toBeVisible();

    const allColumnsVisible = await page.evaluate(() => {
      const rows = document.querySelectorAll('#tbodyid tr');
      return Array.from(rows).every((row) => {
        const cells = row.querySelectorAll('td');
        return Array.from(cells).every(
          (cell) => (cell as HTMLElement).offsetWidth > 0,
        );
      });
    });
    expect(allColumnsVisible).toBe(true);
  });

  test('Place Order modal fields are visible without horizontal scroll', async ({ page }) => {
    test.fail();
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await homePage.goto();
    await homePage.openFirstProduct();
    await productPage.addToCart();

    await cartPage.goto();
    await cartPage.openPlaceOrderModal();
    await expect(cartPage.orderModal).toBeVisible();

    await expect(checkoutPage.nameInput).toBeVisible();
    await expect(checkoutPage.countryInput).toBeVisible();
    await expect(checkoutPage.cityInput).toBeVisible();
    await expect(checkoutPage.creditCardInput).toBeVisible();
    await expect(checkoutPage.monthInput).toBeVisible();
    await expect(checkoutPage.yearInput).toBeVisible();
    await expect(checkoutPage.purchaseButton).toBeVisible();

    const hasOverflow = await page.evaluate(() => {
      const modal = document.querySelector('#orderModal .modal-dialog');
      if (!modal) return true;
      return modal.scrollWidth > modal.clientWidth;
    });
    expect(hasOverflow).toBe(false);
  });

  test('orientation change from portrait to landscape does not break layout', async ({ page }) => {
    const homePage = new HomePage(page);
    const cartPage = new CartPage(page);

    await homePage.goto();
    await expect(homePage.firstProductLink).toBeVisible();

    await page.setViewportSize(MOBILE_LANDSCAPE_VIEWPORT);

    await expect(homePage.firstProductLink).toBeVisible();
    await expect(homePage.navbarBrand).toBeVisible();

    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasOverflow).toBe(false);

    await cartPage.goto();
    await expect(cartPage.placeOrderButton).toBeVisible();

    await page.setViewportSize(MOBILE_VIEWPORT);

    await homePage.goto();
    await expect(homePage.firstProductLink).toBeVisible();
    await expect(homePage.navbarBrand).toBeVisible();
  });

  test('full purchase flow completes on mobile viewport', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await homePage.goto();
    await homePage.openFirstProduct();
    await productPage.addToCart();

    await cartPage.goto();
    await cartPage.openPlaceOrderModal();
    await expect(cartPage.orderModal).toBeVisible();

    await checkoutPage.fillOrderForm(DEFAULT_ORDER);
    await checkoutPage.submitPurchase();

    await expect(checkoutPage.confirmationTitle).toHaveText(MESSAGES.purchaseConfirmation);
    await expect(checkoutPage.confirmationBody).toContainText(DEFAULT_ORDER.creditCard);

    await checkoutPage.dismissConfirmation();
  });
});
