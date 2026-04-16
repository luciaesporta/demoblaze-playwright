class ProductPage {
  constructor(page) {
    this.page = page;
    this.productName = page.locator('h2.name');
    this.productPrice = page.locator('h3.price-container');
    this.productImage = page.locator('.item img').first();
    this.productDescription = page.locator('#more-information p').first();
    this.addToCartButton = page.getByRole('link', { name: 'Add to cart' });
  }

  async getProductName() {
    return (await this.productName.textContent()).trim();
  }

  async getProductPrice() {
    const text = await this.productPrice.textContent();
    return text.match(/\d+/)[0];
  }

  async getProductDescription() {
    return (await this.productDescription.textContent()).trim();
  }

  async isImageLoaded() {
    return this.productImage.evaluate((img) => img.naturalWidth > 0);
  }

  async addToCart() {
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('addtocart') && res.status() === 200
    );
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await this.addToCartButton.click();
    await responsePromise;
  }
}

module.exports = { ProductPage };
