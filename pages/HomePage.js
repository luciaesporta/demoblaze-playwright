class HomePage {
  constructor(page) {
    this.page = page;
    this.firstProductLink = page.locator('.card-title a').first();
  }

  async goto() {
    await this.page.goto('/');
  }

  async openFirstProduct() {
    await this.firstProductLink.click();
  }

  async openProduct(index) {
    const link = this.page.locator('.card-title a').nth(index);
    await link.waitFor({ state: 'visible' });
    await link.click();
  }
}

module.exports = { HomePage };
