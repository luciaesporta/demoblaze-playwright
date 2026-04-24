import type { Page, Locator } from '@playwright/test';
import type { CategoryName } from '../utils/constants';

export class HomePage {
  readonly page: Page;

  private readonly _productCards: Locator;
  private readonly _productCardImages: Locator;
  private readonly _firstProductLink: Locator;
  private readonly _navbarBrand: Locator;
  private readonly _cartNavLink: Locator;
  private readonly _nextButton: Locator;
  private readonly _prevButton: Locator;
  private readonly _carouselNext: Locator;
  private readonly _carouselPrev: Locator;
  private readonly _activeCarouselItem: Locator;
  private readonly _hamburger: Locator;
  private readonly _navbarCollapsible: Locator;
  private readonly _videoModal: Locator;
  private readonly _videoModalTitle: Locator;
  private readonly _videoElement: Locator;
  private readonly _aboutUsNavLink: Locator;
  private readonly _contactNavLink: Locator;
  private readonly _contactModal: Locator;
  private readonly _contactEmail: Locator;
  private readonly _contactName: Locator;
  private readonly _contactMessage: Locator;
  private readonly _contactSendButton: Locator;
  private readonly _categoryList: Locator;

  constructor(page: Page) {
    this.page = page;
    this._productCards = page.locator('.card-title a');
    this._productCardImages = page.locator('.card-img-top');
    this._firstProductLink = this._productCards.first();
    this._navbarBrand = page.locator('a.navbar-brand');
    this._cartNavLink = page.locator('#cartur');
    this._nextButton = page.locator('#next2');
    this._prevButton = page.locator('#prev2');
    this._carouselNext = page.locator('.carousel-control-next');
    this._carouselPrev = page.locator('.carousel-control-prev');
    this._activeCarouselItem = page.locator('.carousel-item.active img');
    this._hamburger = page.getByRole('button', { name: 'Toggle navigation' });
    this._navbarCollapsible = page.locator('#navbarExample');
    this._videoModal = page.locator('#videoModal');
    this._videoModalTitle = page.locator('#videoModalLabel');
    this._videoElement = page.locator('#example-video');
    this._aboutUsNavLink = page.getByRole('link', { name: 'About us' });
    this._contactNavLink = page.getByRole('link', { name: 'Contact' });
    this._contactModal = page.locator('#exampleModal');
    this._contactEmail = page.locator('#recipient-email');
    this._contactName = this._contactModal.getByLabel('Contact Name:');
    this._contactMessage = this._contactModal.getByLabel('Message:');
    this._contactSendButton = this._contactModal.getByRole('button', { name: 'Send message' });
    this._categoryList = page.locator('#itemc');
  }

  get firstProductLink(): Locator {
    return this._firstProductLink;
  }

  get cartNavLink(): Locator {
    return this._cartNavLink;
  }

  get hamburger(): Locator {
    return this._hamburger;
  }

  get navbarCollapsible(): Locator {
    return this._navbarCollapsible;
  }

  get videoModal(): Locator {
    return this._videoModal;
  }

  get videoModalTitle(): Locator {
    return this._videoModalTitle;
  }

  get videoElement(): Locator {
    return this._videoElement;
  }

  get activeCarouselItem(): Locator {
    return this._activeCarouselItem;
  }

  async goto(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
  }

  async clickNavBrand(): Promise<void> {
    await this._navbarBrand.click();
  }

  async clickCart(options: Parameters<Locator['click']>[0] = {}): Promise<void> {
    await this._cartNavLink.click(options);
  }

  async clickNext(): Promise<void> {
    await this._nextButton.click();
  }

  async clickPrev(): Promise<void> {
    await this._prevButton.click();
  }

  async clickCarouselNext(): Promise<void> {
    await this._carouselNext.click();
  }

  async clickCarouselPrev(): Promise<void> {
    await this._carouselPrev.click();
  }

  async clickHamburger(options: Parameters<Locator['click']>[0] = {}): Promise<void> {
    await this._hamburger.click(options);
  }

  async getActiveCarouselSrc(): Promise<string | null> {
    return this._activeCarouselItem.getAttribute('src');
  }

  async getProductCardCount(): Promise<number> {
    await this._firstProductLink.waitFor({ state: 'visible' });
    return this._productCards.count();
  }

  async areCardImagesLoaded(): Promise<boolean> {
    return this._productCardImages.evaluateAll(
      (imgs) => imgs.every((img) => (img as HTMLImageElement).naturalWidth > 0),
    );
  }

  async getFaviconHref(): Promise<string> {
    return this.page.evaluate(
      () => document.querySelector('link[rel="icon"]')?.getAttribute('href') ?? '',
    );
  }

  async openAboutUsModal(): Promise<void> {
    await this._aboutUsNavLink.click();
    await this._videoModal.waitFor({ state: 'visible' });
  }

  async getVideoPoster(): Promise<string | null> {
    return this._videoElement.getAttribute('poster');
  }

  async openContactModal(): Promise<void> {
    await this._contactNavLink.click();
    await this._contactModal.waitFor({ state: 'visible' });
  }

  async fillContactForm(data: { email: string; name: string; message: string }): Promise<void> {
    await this._contactEmail.fill(data.email);
    await this._contactName.fill(data.name);
    await this._contactMessage.fill(data.message);
  }

  async submitContactForm(): Promise<string> {
    // Contact "Send message" button fires a synchronous alert() that blocks
    // the CDP click — must register the dialog handler first and accept it
    // inside the handler so the click unblocks.
    const dialogPromise = new Promise<string>((resolve) => {
      this.page.once('dialog', async (dialog) => {
        const message = dialog.message();
        await dialog.accept();
        resolve(message);
      });
    });
    await this._contactSendButton.click({ force: true });
    return dialogPromise;
  }

  async openFirstProduct(): Promise<void> {
    await this._firstProductLink.waitFor({ state: 'visible' });
    await this._firstProductLink.click();
  }

  async openProduct(index: number): Promise<void> {
    const link = this._productCards.nth(index);
    await link.waitFor({ state: 'visible' });
    await link.click();
  }

  async openCategory(name: CategoryName): Promise<void> {
    const link = this._categoryList.getByText(name, { exact: true });
    const responsePromise = this.page.waitForResponse(
      (res) => res.url().includes('bycat') && res.status() === 200,
    );
    await link.click();
    await responsePromise;
    await this._firstProductLink.waitFor({ state: 'visible' });
  }

  async getProductNameAt(index: number): Promise<string> {
    const link = this._productCards.nth(index);
    await link.waitFor({ state: 'visible' });
    return (await link.textContent() ?? '').trim();
  }

  async getProductNames(): Promise<string[]> {
    const names = await this._productCards.allTextContents();
    return names.map((name) => name.trim());
  }

  async collectDistinctCarouselSlides(minDistinct: number): Promise<number> {
    const seen = new Set<string>();
    const initial = await this.getActiveCarouselSrc();
    if (initial) seen.add(initial);

    // Wait for the auto-advance to produce a different slide.
    await this.page.waitForFunction(
      (startSrc) => {
        const img = document.querySelector('.carousel-item.active img');
        const currentSrc = img?.getAttribute('src') ?? null;
        return currentSrc !== null && currentSrc !== startSrc;
      },
      initial,
      { timeout: 10_000 },
    );
    const autoAdvanced = await this.getActiveCarouselSrc();
    if (autoAdvanced) seen.add(autoAdvanced);

    await this.clickCarouselNext();
    await this.page.waitForFunction(
      (previousSrc) => {
        const img = document.querySelector('.carousel-item.active img');
        const currentSrc = img?.getAttribute('src') ?? null;
        return currentSrc !== null && currentSrc !== previousSrc;
      },
      autoAdvanced,
    );
    const afterNext = await this.getActiveCarouselSrc();
    if (afterNext) seen.add(afterNext);

    if (seen.size < minDistinct) {
      await this.clickCarouselPrev();
      await this.page.waitForFunction(
        (previousSrc) => {
          const img = document.querySelector('.carousel-item.active img');
          const currentSrc = img?.getAttribute('src') ?? null;
          return currentSrc !== null && currentSrc !== previousSrc;
        },
        afterNext,
      );
      const afterPrev = await this.getActiveCarouselSrc();
      if (afterPrev) seen.add(afterPrev);
    }

    return seen.size;
  }
}
