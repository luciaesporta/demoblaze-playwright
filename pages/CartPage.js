class CartPage {
  constructor(page) {
    this.page = page;
    this.cartRows = page.locator('#tbodyid tr');
    this.cartTotal = page.locator('#totalp');
  }

  async goto() {
    await this.page.goto('/cart.html');
    await this.page.waitForLoadState('networkidle');
  }

  getRowCell(rowIndex, cellIndex) {
    return this.cartRows.nth(rowIndex).locator('td').nth(cellIndex);
  }

  async getTotal() {
    return (await this.cartTotal.textContent()).trim();
  }
}

module.exports = { CartPage };
