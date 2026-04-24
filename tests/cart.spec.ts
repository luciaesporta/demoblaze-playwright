import { test, expect } from '../fixtures/authFixtures';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { CartPage } from '../pages/CartPage';
import { PAGE_TITLE, PRODUCT_PAGE_URL } from '../utils/constants';

test.describe('Cart', () => {
  test('cart persists across page navigation', async ({ cartWithOneProduct }) => {
    const { page, name: expectedName, price: expectedPrice } = cartWithOneProduct;
    const homePage = new HomePage(page);
    const cartPage = new CartPage(page);

    await homePage.goto();
    await homePage.openCategory('Laptops');
    await cartPage.goto();

    await expect(cartPage.cartRows).toHaveCount(1);
    await expect(cartPage.getRowTitleCell(0)).toContainText(expectedName);
    await expect(cartPage.cartTotal).toHaveText(expectedPrice);
  });

  test('empty cart shows no items and blank total', async ({ authenticatedPage }) => {
    const { page } = authenticatedPage;
    const cartPage = new CartPage(page);

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(0);
    const total = await cartPage.getTotal();
    expect(total === '' || total === '0').toBeTruthy();
  });

  test('guest user can add a product to cart', async ({ page }) => {
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await homePage.goto();
    await expect(page).toHaveTitle(PAGE_TITLE);

    await homePage.openFirstProduct();
    await expect(page).toHaveURL(PRODUCT_PAGE_URL);
    const { name: expectedName } = await productPage.addToCartAndCapture();

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(1);
    await expect(cartPage.getRowTitleCell(0)).toContainText(expectedName);
  });

  test('cart displays full list when multiple products are added', async ({ cartWithTwoProducts }) => {
    const {
      page,
      first: { name: firstName, price: firstPrice },
      second: { name: secondName, price: secondPrice },
    } = cartWithTwoProducts;
    const cartPage = new CartPage(page);

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(2);

    const firstRowName = await cartPage.getItemName(0);
    const secondRowName = await cartPage.getItemName(1);
    const firstRowPrice = await cartPage.getItemPrice(0);
    const secondRowPrice = await cartPage.getItemPrice(1);

    expect([firstRowName, secondRowName]).toContain(firstName);
    expect([firstRowName, secondRowName]).toContain(secondName);
    expect([firstRowPrice, secondRowPrice]).toContain(firstPrice);
    expect([firstRowPrice, secondRowPrice]).toContain(secondPrice);
  });

  test('total reflects all added items', async ({ cartWithTwoProducts }) => {
    const { page, first: { price: firstPrice }, second: { price: secondPrice } } = cartWithTwoProducts;
    const cartPage = new CartPage(page);

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(2);

    const expectedTotal = String(Number(firstPrice) + Number(secondPrice));
    await expect(cartPage.cartTotal).toHaveText(expectedTotal);
  });

  test('deleting an item updates the cart correctly', async ({ cartWithTwoProducts }) => {
    const { page, first: { name: firstName }, second: { name: secondName, price: secondPrice } } = cartWithTwoProducts;
    const cartPage = new CartPage(page);

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(2);

    await cartPage.deleteRowByName(firstName);
    await expect(cartPage.cartRows).toHaveCount(1);

    const remainingName = await cartPage.getItemName(0);
    expect(remainingName).toBe(secondName);

    await expect(cartPage.cartTotal).toHaveText(secondPrice);
  });

  test('cart state is preserved after interrupting the purchase flow', async ({ cartWithOneProduct }) => {
    const { page, name: expectedName, price: expectedPrice } = cartWithOneProduct;
    const cartPage = new CartPage(page);

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(1);
    const totalBefore = await cartPage.getTotal();

    await cartPage.openPlaceOrderModal();
    await expect(cartPage.orderModal).toBeVisible();
    await cartPage.closePlaceOrderModal();

    await expect(cartPage.cartRows).toHaveCount(1);
    await expect(cartPage.getRowTitleCell(0)).toContainText(expectedName);
    await expect(cartPage.getRowPriceCell(0)).toContainText(expectedPrice);
    await expect(cartPage.cartTotal).toHaveText(totalBefore);
  });

  test('adding the same product twice results in two rows', async ({ cartWithOneProduct }) => {
    const { page, name: productName, price: productPrice } = cartWithOneProduct;
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);
    const cartPage = new CartPage(page);

    await homePage.goto();
    await homePage.openFirstProduct();
    await productPage.addToCartAndCapture();

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(2);

    const row0Name = await cartPage.getItemName(0);
    const row1Name = await cartPage.getItemName(1);
    expect(row0Name).toBe(productName);
    expect(row1Name).toBe(productName);

    const expectedTotal = String(Number(productPrice) * 2);
    await expect(cartPage.cartTotal).toHaveText(expectedTotal);
  });

  test('authenticated user can add a product to cart', async ({ cartWithOneProduct }) => {
    const { page, name: expectedName, price: expectedPrice } = cartWithOneProduct;
    const cartPage = new CartPage(page);

    await cartPage.goto();
    await expect(cartPage.cartRows).toHaveCount(1);
    await expect(cartPage.getRowTitleCell(0)).toContainText(expectedName);
    await expect(cartPage.getRowPriceCell(0)).toContainText(expectedPrice);
    await expect(cartPage.cartTotal).toHaveText(expectedPrice);
  });
});
