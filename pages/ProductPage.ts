import type { Page, Locator } from '@playwright/test';

export class ProductPage {
  readonly page: Page;

  private readonly _productName: Locator;
  private readonly _productPrice: Locator;
  private readonly _productImage: Locator;
  private readonly _productDescription: Locator;
  private readonly _addToCartButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this._productName = page.locator('h2.name');
    this._productPrice = page.locator('h3.price-container');
    this._productImage = page.locator('.item img').first();
    this._productDescription = page.locator('#more-information p').first();
    this._addToCartButton = page.getByRole('link', { name: 'Add to cart' });
  }

  get productName(): Locator {
    return this._productName;
  }

  get productPrice(): Locator {
    return this._productPrice;
  }

  get productImage(): Locator {
    return this._productImage;
  }

  get productDescription(): Locator {
    return this._productDescription;
  }

  async getProductName(): Promise<string> {
    await this._productName.waitFor({ state: 'visible' });
    return (await this._productName.textContent() ?? '').trim();
  }

  async getProductPrice(): Promise<string> {
    await this._productPrice.waitFor({ state: 'visible' });
    const text = (await this._productPrice.textContent()) ?? '';
    const match = text.match(/\d+/);
    return match ? match[0] : '';
  }

  async getProductDescription(): Promise<string> {
    return (await this._productDescription.textContent() ?? '').trim();
  }

  async getFaviconHref(): Promise<string> {
    return this.page.evaluate(
      () => document.querySelector('link[rel="icon"]')?.getAttribute('href') ?? '',
    );
  }

  async isImageLoaded(): Promise<boolean> {
    return this._productImage.evaluate((img) => (img as HTMLImageElement).naturalWidth > 0);
  }

  async addToCart(): Promise<void> {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('addtocart') && res.status() === 200,
    );
    this.page.once('dialog', (dialog) => {
      void dialog.accept();
    });
    await this._addToCartButton.click();
    await responsePromise;
  }

  async addToCartAndCapture(): Promise<{ name: string; price: string }> {
    const name = await this.getProductName();
    const price = await this.getProductPrice();
    await this.addToCart();
    return { name, price };
  }
}
