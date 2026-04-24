class CheckoutPage {
  constructor(page) {
    this.page = page;

    this.orderModal = page.locator('#orderModal');
    this.nameInput = this.orderModal.getByLabel('Name:');
    this.countryInput = this.orderModal.getByLabel('Country:');
    this.cityInput = this.orderModal.getByLabel('City:');
    this.creditCardInput = this.orderModal.getByLabel('Credit card:');
    this.monthInput = this.orderModal.getByLabel('Month:');
    this.yearInput = this.orderModal.getByLabel('Year:');
    this.purchaseButton = this.orderModal.getByRole('button', { name: 'Purchase' });
    this.modalTotal = page.locator('#totalm');

    this.confirmationModal = page.locator('.sweet-alert');
    this.confirmationTitle = page.locator('.sweet-alert h2');
    this.confirmationBody = page.locator('.sweet-alert p.lead');
    this.confirmationOkButton = this.confirmationModal.getByRole('button', { name: 'OK' });
  }

  async fillOrderForm({ name, country, city, creditCard, month, year }) {
    await this.nameInput.fill(name);
    await this.countryInput.fill(country);
    await this.cityInput.fill(city);
    await this.creditCardInput.fill(creditCard);
    await this.monthInput.fill(month);
    await this.yearInput.fill(year);
  }

  async submitPurchase() {
    await this.purchaseButton.click();
    await this.confirmationModal.waitFor({ state: 'visible' });
  }

  async clickPurchase() {
    await this.purchaseButton.click();
  }

  async fillCreditCard(value) {
    await this.creditCardInput.clear();
    await this.creditCardInput.fill(value);
  }

  async fillOrderFormWithShortCard({ name, country, city, month, year }) {
    await this.fillOrderForm({ name, country, city, creditCard: '1234', month, year });
  }

  async fillOrderFormWithLongCard(value = '12345678901234567') {
    await this.fillCreditCard(value);
  }

  async getModalTotal() {
    await this.page.waitForFunction(
      () => document.querySelector('#totalm')?.textContent.trim() !== ''
    );
    const text = (await this.modalTotal.textContent()).trim();
    return text.replace(/\D/g, '');
  }

  async getConfirmationText() {
    return (await this.confirmationBody.textContent()).trim();
  }

  async getConfirmationDetails() {
    const text = await this.getConfirmationText();
    const idMatch = text.match(/Id:\s*(\S+)/);
    const amountMatch = text.match(/Amount:\s*(\d+)/);
    return {
      id: idMatch ? idMatch[1] : null,
      amount: amountMatch ? amountMatch[1] : null,
    };
  }

  async dismissConfirmation() {
    await this.confirmationOkButton.click();
    await this.confirmationModal.waitFor({ state: 'hidden' });
  }
}

module.exports = { CheckoutPage };
