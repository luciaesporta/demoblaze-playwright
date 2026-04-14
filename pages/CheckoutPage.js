class CheckoutPage {
  constructor(page) {
    this.page = page;

    this.nameInput = page.locator('#name');
    this.countryInput = page.locator('#country');
    this.cityInput = page.locator('#city');
    this.creditCardInput = page.locator('#card');
    this.monthInput = page.locator('#month');
    this.yearInput = page.locator('#year');
    this.purchaseButton = page.locator('button[onclick="purchaseOrder()"]');
    this.modalTotal = page.locator('#totalm');

    this.confirmationModal = page.locator('.sweet-alert');
    this.confirmationTitle = page.locator('.sweet-alert h2');
    this.confirmationBody = page.locator('.sweet-alert p.lead');
    this.confirmationOkButton = page.locator('.sweet-alert .confirm');
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

  async getModalTotal() {
    const text = (await this.modalTotal.textContent()).trim();
    return text.replace(/\D/g, '');
  }

  async getConfirmationText() {
    return (await this.confirmationBody.textContent()).trim();
  }

  async dismissConfirmation() {
    await this.confirmationOkButton.click();
    await this.confirmationModal.waitFor({ state: 'hidden' });
  }
}

module.exports = { CheckoutPage };
