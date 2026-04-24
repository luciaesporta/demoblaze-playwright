import { test, expect } from '../fixtures/authFixtures';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { AuthPage } from '../pages/AuthPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import {
  MOBILE_VIEWPORT,
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
