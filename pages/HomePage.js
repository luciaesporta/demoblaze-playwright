class HomePage {
  constructor(page) {
    this.page = page;
    this.firstProductLink = page.locator('.card-title a').first();
    this.navbarBrand = page.locator('a.navbar-brand');
    this.cartNavLink = page.locator('#cartur');
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
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('bycat') && res.status() === 200
    );
    await link.click();
    await responsePromise;
    await this.page.locator('.card-title a').first().waitFor({ state: 'visible' });
  }

  async getProductNames() {
    const names = await this.page.locator('.card-title a').allTextContents();
    return names.map((name) => name.trim());
  }
}

module.exports = { HomePage };
