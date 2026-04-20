class HomePage {
  constructor(page) {
    this.page = page;
    this.firstProductLink = page.locator('.card-title a').first();
    this.navbarBrand = page.locator('a.navbar-brand');
    this.cartNavLink = page.locator('#cartur');
    this.nextButton = page.locator('#next2');
    this.prevButton = page.locator('#prev2');
    this.carouselNext = page.locator('.carousel-control-next');
    this.carouselPrev = page.locator('.carousel-control-prev');
    this.activeCarouselItem = page.locator('.carousel-item.active img');
    this.hamburger = page.locator('button.navbar-toggler');
    this.navbarCollapsible = page.locator('#navbarExample');
    this.productCards = page.locator('.card-title a');
    this.videoModal = page.locator('#videoModal');
    this.videoModalTitle = page.locator('#videoModalLabel');
    this.videoElement = page.locator('#example-video');
    this._aboutUsNavLink = page.locator('a[data-target="#videoModal"]');
    this._contactNavLink = page.locator('a[data-target="#exampleModal"]');
    this._contactModal = page.locator('#exampleModal');
    this._contactEmail = page.locator('#recipient-email');
    this._contactName = page.locator('#recipient-name');
    this._contactMessage = page.locator('#message-text');
    this._contactSendButton = page.locator('#exampleModal .btn-primary');
  }

  async goto() {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  async clickNavBrand() {
    await this.navbarBrand.click();
  }

  async clickCart(options = {}) {
    await this.cartNavLink.click(options);
  }

  async clickNext() {
    await this.nextButton.click();
  }

  async clickPrev() {
    await this.prevButton.click();
  }

  async clickCarouselNext() {
    await this.carouselNext.click();
  }

  async clickCarouselPrev() {
    await this.carouselPrev.click();
  }

  async getActiveCarouselSrc() {
    return this.activeCarouselItem.getAttribute('src');
  }

  async clickHamburger(options = {}) {
    await this.hamburger.click(options);
  }

  async getFaviconHref() {
    return this.page.evaluate(() => document.querySelector('link[rel="icon"]')?.getAttribute('href') ?? '');
  }

  async openAboutUsModal() {
    await this._aboutUsNavLink.click();
    await this.videoModal.waitFor({ state: 'visible' });
  }

  async openContactModal() {
    await this._contactNavLink.click();
    await this._contactModal.waitFor({ state: 'visible' });
  }

  async fillContactForm({ email, name, message }) {
    await this._contactEmail.fill(email);
    await this._contactName.fill(name);
    await this._contactMessage.fill(message);
  }

  async submitContactForm() {
    const dialogPromise = new Promise((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });
    await this._contactSendButton.click({ force: true });
    return dialogPromise;
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

  async getProductNameAt(index) {
    const link = this.page.locator('.card-title a').nth(index);
    await link.waitFor({ state: 'visible' });
    return (await link.textContent()).trim();
  }

  async getProductNames() {
    const names = await this.page.locator('.card-title a').allTextContents();
    return names.map((name) => name.trim());
  }
}

module.exports = { HomePage };
