import { test, expect } from '../fixtures/authFixtures';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { DEFAULT_ORDER } from '../utils/testData';
import { MESSAGES } from '../utils/constants';

test.describe('Checkout', () => {
  test('successful purchase with all fields completed', async ({ cartWithOneProduct }) => {
    const { page } = cartWithOneProduct;
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(1);

    await cartPage.openPlaceOrderModal();
    await expect(cartPage.orderModal).toBeVisible();

    await checkoutPage.fillOrderForm(DEFAULT_ORDER);
    await checkoutPage.submitPurchase();

    await expect(checkoutPage.confirmationTitle).toHaveText(MESSAGES.purchaseConfirmation);
    await expect(checkoutPage.confirmationBody).toContainText(DEFAULT_ORDER.creditCard);

    await checkoutPage.dismissConfirmation();

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(0);
  });

  test('purchase cannot be submitted with mandatory fields empty', async ({ cartWithOneProduct }) => {
    const { page } = cartWithOneProduct;
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.goto();
    await cartPage.openPlaceOrderModal();
    await expect(cartPage.orderModal).toBeVisible();

    await checkoutPage.clickPurchase();

    await expect(checkoutPage.confirmationModal).not.toBeVisible();
    await expect(cartPage.orderModal).toBeVisible();
  });

  test('credit card field rejects non-numeric characters', async ({ cartWithOneProduct }) => {
    // BUG: demoblaze accepts any value in the credit card field and processes
    // the purchase without validation. Marked as expected to fail; remove once
    // numeric validation is implemented.
    test.fail();
    const { page } = cartWithOneProduct;
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.goto();
    await cartPage.openPlaceOrderModal();
    await expect(cartPage.orderModal).toBeVisible();

    await checkoutPage.fillOrderForm({ ...DEFAULT_ORDER, creditCard: 'abcd' });
    await checkoutPage.clickPurchase();

    await expect(checkoutPage.confirmationModal).not.toBeVisible();
    await expect(cartPage.orderModal).toBeVisible();

    await checkoutPage.fillCreditCard('@@##');
    await checkoutPage.clickPurchase();

    await expect(checkoutPage.confirmationModal).not.toBeVisible();
    await expect(cartPage.orderModal).toBeVisible();
  });

  test('total in modal matches cart total', async ({ cartWithTwoProducts }) => {
    const { page } = cartWithTwoProducts;
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(2);
    const cartTotal = await cartPage.getTotal();

    await cartPage.openPlaceOrderModal();
    await expect(cartPage.orderModal).toBeVisible();

    const modalTotal = await checkoutPage.getModalTotal();
    expect(modalTotal).toBe(cartTotal);
  });

  test('order confirmation message contains purchase details', async ({ cartWithOneProduct }) => {
    const { page } = cartWithOneProduct;
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(1);
    await cartPage.openPlaceOrderModal();
    await expect(cartPage.orderModal).toBeVisible();

    const modalTotal = await checkoutPage.getModalTotal();

    await checkoutPage.fillOrderForm(DEFAULT_ORDER);
    await checkoutPage.submitPurchase();

    const { id, amount } = await checkoutPage.getConfirmationDetails();
    expect(id).toBeTruthy();
    expect(amount).toBe(modalTotal);
  });

  test('credit card field validates length', async ({ cartWithOneProduct }) => {
    // BUG: demoblaze accepts any credit card value regardless of digit count and
    // processes the purchase without length validation. Marked as expected to
    // fail; remove once 16-digit validation is implemented.
    test.fail();
    const { page } = cartWithOneProduct;
    const cartPage = new CartPage(page);
    const checkoutPage = new CheckoutPage(page);

    await cartPage.goto();
    await cartPage.openPlaceOrderModal();
    await expect(cartPage.orderModal).toBeVisible();

    await checkoutPage.fillOrderFormWithShortCard(DEFAULT_ORDER);
    await checkoutPage.clickPurchase();

    await expect(checkoutPage.confirmationModal).not.toBeVisible();
    await expect(cartPage.orderModal).toBeVisible();

    await checkoutPage.fillOrderFormWithLongCard();
    await checkoutPage.clickPurchase();

    await expect(checkoutPage.confirmationModal).not.toBeVisible();
    await expect(cartPage.orderModal).toBeVisible();
  });

  test('modal can be dismissed without placing an order', async ({ cartWithOneProduct }) => {
    const { page, name: expectedName, price: expectedPrice } = cartWithOneProduct;
    const cartPage = new CartPage(page);

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(1);
    const totalBefore = await cartPage.getTotal();

    await cartPage.openPlaceOrderModal();
    await expect(cartPage.orderModal).toBeVisible();
    await cartPage.closePlaceOrderModal();

    await expect(cartPage.orderModal).not.toBeVisible();
    await expect(cartPage.cartRows).toHaveCount(1);
    await expect(cartPage.getRowTitleCell(0)).toContainText(expectedName);
    await expect(cartPage.getRowPriceCell(0)).toContainText(expectedPrice);
    await expect(cartPage.cartTotal).toHaveText(totalBefore);
  });
});
