class ProductPage {
  constructor(page) {
    this.page = page;
    this.productName = page.locator('h2.name');
    this.addToCartButton = page.locator('.btn-success');
  }

  async addToCart() {
    this.page.once('dialog', async (dialog) => {
      await dialog.accept();
    });
    await this.addToCartButton.click();
  }
}

module.exports = { ProductPage };
