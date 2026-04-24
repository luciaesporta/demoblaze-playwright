import { test as base, type Page } from '@playwright/test';
import { AuthPage } from '../pages/AuthPage';
import { HomePage } from '../pages/HomePage';
import { ProductPage } from '../pages/ProductPage';
import { generateUser } from '../utils/testData';

export interface AuthenticatedSession {
  page: Page;
  username: string;
}

export interface CartWithOneProduct {
  page: Page;
  name: string;
  price: string;
}

export interface CartWithTwoProducts {
  page: Page;
  first: { name: string; price: string };
  second: { name: string; price: string };
}

interface Fixtures {
  authenticatedPage: AuthenticatedSession;
  cartWithOneProduct: CartWithOneProduct;
  cartWithTwoProducts: CartWithTwoProducts;
}

async function registerAndLogin(page: Page): Promise<string> {
  const authPage = new AuthPage(page);
  const { username, password } = generateUser();
  await authPage.register(username, password);
  await authPage.login(username, password);
  return username;
}

export const test = base.extend<Fixtures>({
  authenticatedPage: async ({ page }, use) => {
    const username = await registerAndLogin(page);
    await use({ page, username });
  },

  cartWithOneProduct: async ({ page }, use) => {
    await registerAndLogin(page);
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);

    await homePage.goto();
    await homePage.openFirstProduct();
    const { name, price } = await productPage.addToCartAndCapture();

    await use({ page, name, price });
  },

  cartWithTwoProducts: async ({ page }, use) => {
    await registerAndLogin(page);
    const homePage = new HomePage(page);
    const productPage = new ProductPage(page);

    await homePage.goto();
    await homePage.openProduct(0);
    const first = await productPage.addToCartAndCapture();

    await homePage.goto();
    await homePage.openProduct(1);
    const second = await productPage.addToCartAndCapture();

    await use({ page, first, second });
  },
});

export { expect } from '@playwright/test';
