class HomePage {
  constructor(page) {
    this.page = page;
    this.firstProductLink = page.locator('.card-title a').first();
  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  async openFirstProduct() {
    await this.firstProductLink.waitFor({ state: 'visible' });
    await this.firstProductLink.click();
  }

  async openProduct(index) {
    const link = this.page.locator('.card-title a').nth(index);
    await link.waitFor({ state: 'visible' });
    await link.click();
  }

  async openCategory(name) {
    const link = this.page.locator('#itemc').getByText(name, { exact: true });
    await link.click();
    await this.page.locator('.card-title a').first().waitFor({ state: 'visible' });
  }
}

module.exports = { HomePage };
