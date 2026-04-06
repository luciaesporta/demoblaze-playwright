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
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.addToCartButton.click();
    const dialog = await dialogPromise;
    await dialog.accept();
  }
}

module.exports = { ProductPage };
