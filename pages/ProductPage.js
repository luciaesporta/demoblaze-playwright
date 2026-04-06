class ProductPage {
  constructor(page) {
    this.page = page;
    this.productName = page.locator('h2.name');
    this.productPrice = page.locator('h3.price-container');
    this.addToCartButton = page.locator('.btn-success');
  }

  async getProductName() {
    return (await this.productName.textContent()).trim();
  }

  async getProductPrice() {
    const text = await this.productPrice.textContent();
    return text.match(/\d+/)[0];
  }

  async addToCart() {
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await this.addToCartButton.click();
  }
}

module.exports = { ProductPage };
