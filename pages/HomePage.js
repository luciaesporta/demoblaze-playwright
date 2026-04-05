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
}

module.exports = { HomePage };
