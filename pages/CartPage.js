class CartPage {
  constructor(page) {
    this.page = page;
    this.cartRows = page.locator('#tbodyid tr');
    this.cartTotal = page.locator('#totalp');
    this.placeOrderButton = page.locator('button.btn-success');
    this.orderModal = page.locator('#orderModal');
    this.orderModalCloseButton = page.locator('#orderModal .btn-secondary[data-dismiss="modal"]');
  }

  async getFaviconHref() {
    return this.page.evaluate(() => document.querySelector('link[rel="icon"]')?.getAttribute('href') ?? '');
  }

  async goto() {
    await this.page.goto('/cart.html', { waitUntil: 'domcontentloaded' });
  }

  getRowCell(rowIndex, cellIndex) {
    return this.cartRows.nth(rowIndex).locator('td').nth(cellIndex);
  }

  async getItemName(rowIndex) {
    return (await this.getRowCell(rowIndex, 1).textContent()).trim();
  }

  async getItemPrice(rowIndex) {
    return (await this.getRowCell(rowIndex, 2).textContent()).trim();
  }

  async getTotal() {
    return (await this.cartTotal.textContent()).trim();
  }

  async deleteRow(rowIndex) {
    await this.cartRows.nth(rowIndex).locator('td a').click();
  }

  async openPlaceOrderModal() {
    await this.placeOrderButton.click();
    await this.orderModal.waitFor({ state: 'visible' });
  }

  async closePlaceOrderModal() {
    await this.orderModalCloseButton.click();
    await this.orderModal.waitFor({ state: 'hidden' });
  }
}

module.exports = { CartPage };
