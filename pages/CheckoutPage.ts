import type { Page, Locator } from '@playwright/test';
import type { OrderDetails } from '../utils/testData';
import { LONG_CREDIT_CARD, SHORT_CREDIT_CARD } from '../utils/testData';

export class CheckoutPage {
  readonly page: Page;

  private readonly _orderModal: Locator;
  private readonly _nameInput: Locator;
  private readonly _countryInput: Locator;
  private readonly _cityInput: Locator;
  private readonly _creditCardInput: Locator;
  private readonly _monthInput: Locator;
  private readonly _yearInput: Locator;
  private readonly _purchaseButton: Locator;
  private readonly _modalTotal: Locator;
  private readonly _confirmationModal: Locator;
  private readonly _confirmationTitle: Locator;
  private readonly _confirmationBody: Locator;
  private readonly _confirmationOkButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this._orderModal = page.locator('#orderModal');
    this._nameInput = this._orderModal.getByLabel('Name:');
    this._countryInput = this._orderModal.getByLabel('Country:');
    this._cityInput = this._orderModal.getByLabel('City:');
    this._creditCardInput = this._orderModal.getByLabel('Credit card:');
    this._monthInput = this._orderModal.getByLabel('Month:');
    this._yearInput = this._orderModal.getByLabel('Year:');
    this._purchaseButton = this._orderModal.getByRole('button', { name: 'Purchase' });
    this._modalTotal = page.locator('#totalm');
    this._confirmationModal = page.locator('.sweet-alert');
    this._confirmationTitle = this._confirmationModal.locator('h2');
    this._confirmationBody = this._confirmationModal.locator('p.lead');
    this._confirmationOkButton = this._confirmationModal.getByRole('button', { name: 'OK' });
  }

  get orderModal(): Locator {
    return this._orderModal;
  }

  get confirmationModal(): Locator {
    return this._confirmationModal;
  }

  get confirmationTitle(): Locator {
    return this._confirmationTitle;
  }

  get confirmationBody(): Locator {
    return this._confirmationBody;
  }

  async fillOrderForm(order: OrderDetails): Promise<void> {
    await this._nameInput.fill(order.name);
    await this._countryInput.fill(order.country);
    await this._cityInput.fill(order.city);
    await this._creditCardInput.fill(order.creditCard);
    await this._monthInput.fill(order.month);
    await this._yearInput.fill(order.year);
  }

  async submitPurchase(): Promise<void> {
    await this._purchaseButton.click();
    await this._confirmationModal.waitFor({ state: 'visible' });
  }

  async clickPurchase(): Promise<void> {
    await this._purchaseButton.click();
  }

  async fillCreditCard(value: string): Promise<void> {
    await this._creditCardInput.clear();
    await this._creditCardInput.fill(value);
  }

  async fillOrderFormWithShortCard(order: OrderDetails): Promise<void> {
    await this.fillOrderForm({ ...order, creditCard: SHORT_CREDIT_CARD });
  }

  async fillOrderFormWithLongCard(value: string = LONG_CREDIT_CARD): Promise<void> {
    await this.fillCreditCard(value);
  }

  async getModalTotal(): Promise<string> {
    await this.page.waitForFunction(
      () => (document.querySelector('#totalm')?.textContent ?? '').trim() !== '',
    );
    const text = (await this._modalTotal.textContent() ?? '').trim();
    return text.replace(/\D/g, '');
  }

  async getConfirmationText(): Promise<string> {
    return (await this._confirmationBody.textContent() ?? '').trim();
  }

  async getConfirmationDetails(): Promise<{ id: string | null; amount: string | null }> {
    const text = await this.getConfirmationText();
    const idMatch = text.match(/Id:\s*(\S+)/);
    const amountMatch = text.match(/Amount:\s*(\d+)/);
    return {
      id: idMatch?.[1] ?? null,
      amount: amountMatch?.[1] ?? null,
    };
  }

  async dismissConfirmation(): Promise<void> {
    await this._confirmationOkButton.click();
    await this._confirmationModal.waitFor({ state: 'hidden' });
  }
}
