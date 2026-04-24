import type { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;

  private readonly _cartRows: Locator;
  private readonly _cartTotal: Locator;
  private readonly _placeOrderButton: Locator;
  private readonly _orderModal: Locator;
  private readonly _orderModalCloseButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this._cartRows = page.locator('#tbodyid tr');
    this._cartTotal = page.locator('#totalp');
    this._placeOrderButton = page.getByRole('button', { name: 'Place Order' });
    this._orderModal = page.locator('#orderModal');
    this._orderModalCloseButton = this._orderModal
      .getByRole('button')
      .filter({ hasText: 'Close' });
  }

  get cartRows(): Locator {
    return this._cartRows;
  }

  get cartTotal(): Locator {
    return this._cartTotal;
  }

  get placeOrderButton(): Locator {
    return this._placeOrderButton;
  }

  get orderModal(): Locator {
    return this._orderModal;
  }

  async goto(): Promise<void> {
    await this.page.goto('/cart.html', { waitUntil: 'domcontentloaded' });
  }

  getRowCell(rowIndex: number, cellIndex: number): Locator {
    return this._cartRows.nth(rowIndex).locator('td').nth(cellIndex);
  }

  getRowTitleCell(rowIndex: number): Locator {
    return this.getRowCell(rowIndex, 1);
  }

  getRowPriceCell(rowIndex: number): Locator {
    return this.getRowCell(rowIndex, 2);
  }

  async getItemName(rowIndex: number): Promise<string> {
    return (await this.getRowCell(rowIndex, 1).textContent() ?? '').trim();
  }

  async getItemPrice(rowIndex: number): Promise<string> {
    return (await this.getRowCell(rowIndex, 2).textContent() ?? '').trim();
  }

  async getTotal(): Promise<string> {
    return (await this._cartTotal.textContent() ?? '').trim();
  }

  async getFaviconHref(): Promise<string> {
    return this.page.evaluate(
      () => document.querySelector('link[rel="icon"]')?.getAttribute('href') ?? '',
    );
  }

  async deleteRow(rowIndex: number): Promise<void> {
    await this._cartRows.nth(rowIndex).locator('td a').click();
  }

  async deleteRowByName(name: string): Promise<string> {
    const names = await this._cartRows.locator('td:nth-child(2)').allTextContents();
    const trimmed = names.map((n) => n.trim());
    const index = trimmed.indexOf(name);
    const targetIndex = index !== -1 ? index : 0;
    const deletedName = trimmed[targetIndex] ?? '';
    await this.deleteRow(targetIndex);
    return deletedName;
  }

  async openPlaceOrderModal(): Promise<void> {
    await this._placeOrderButton.click();
    await this._orderModal.waitFor({ state: 'visible' });
  }

  async closePlaceOrderModal(): Promise<void> {
    await this._orderModalCloseButton.click();
    await this._orderModal.waitFor({ state: 'hidden' });
  }
}
