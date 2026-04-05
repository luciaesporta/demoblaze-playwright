class CartPage {
  constructor(page) {
    this.page = page;
    this.cartRows = page.locator('#tbodyid tr');
  }

  async goto() {
    await this.page.goto('/cart.html');
  }

  getRowCell(rowIndex, cellIndex) {
    return this.cartRows.nth(rowIndex).locator('td').nth(cellIndex);
  }
}

module.exports = { CartPage };
