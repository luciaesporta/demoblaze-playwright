import type { Page, Locator } from '@playwright/test';

export class AuthPage {
  readonly page: Page;

  private readonly _signUpNavButton: Locator;
  private readonly _signUpModal: Locator;
  private readonly _signUpUsername: Locator;
  private readonly _signUpPassword: Locator;
  private readonly _signUpSubmit: Locator;
  private readonly _signUpModalClose: Locator;

  private readonly _logInNavButton: Locator;
  private readonly _logInModal: Locator;
  private readonly _logInUsername: Locator;
  private readonly _logInPassword: Locator;
  private readonly _logInSubmit: Locator;

  private readonly _loggedInUsername: Locator;
  private readonly _logoutButton: Locator;

  private readonly _navbarCollapsible: Locator;
  private readonly _hamburger: Locator;

  constructor(page: Page) {
    this.page = page;

    this._signUpNavButton = page.getByRole('link', { name: 'Sign up' });
    this._signUpModal = page.locator('#signInModal');
    this._signUpUsername = this._signUpModal.getByLabel('Username:');
    this._signUpPassword = this._signUpModal.getByLabel('Password:');
    this._signUpSubmit = this._signUpModal.getByRole('button', { name: 'Sign up' });
    this._signUpModalClose = this._signUpModal.getByRole('button', { name: 'Close' });

    this._logInNavButton = page.getByRole('link', { name: 'Log in' });
    this._logInModal = page.locator('#logInModal');
    this._logInUsername = page.locator('#loginusername');
    this._logInPassword = page.locator('#loginpassword');
    this._logInSubmit = this._logInModal.getByRole('button', { name: 'Log in' });

    this._loggedInUsername = page.locator('#nameofuser');
    this._logoutButton = page.getByRole('link', { name: 'Log out' });

    this._navbarCollapsible = page.locator('#navbarExample');
    this._hamburger = page.getByRole('button', { name: 'Toggle navigation' });
  }

  get signUpModal(): Locator {
    return this._signUpModal;
  }

  get signUpUsername(): Locator {
    return this._signUpUsername;
  }

  get signUpPassword(): Locator {
    return this._signUpPassword;
  }

  get logInModal(): Locator {
    return this._logInModal;
  }

  get logInUsername(): Locator {
    return this._logInUsername;
  }

  get logInPassword(): Locator {
    return this._logInPassword;
  }

  get logInNavButton(): Locator {
    return this._logInNavButton;
  }

  get signUpNavButton(): Locator {
    return this._signUpNavButton;
  }

  get loggedInUsername(): Locator {
    return this._loggedInUsername;
  }

  get logoutButton(): Locator {
    return this._logoutButton;
  }

  private async _expandNavbarIfCollapsed(): Promise<void> {
    const isVisible = await this._navbarCollapsible.isVisible();
    if (!isVisible) {
      await this._hamburger.click();
      await this._navbarCollapsible.waitFor({ state: 'visible' });
    }
  }

  async openLoginModalMobile(): Promise<void> {
    await this._expandNavbarIfCollapsed();
    await this._logInNavButton.click();
    await this._logInModal.waitFor({ state: 'visible' });
  }

  async openSignUpModalMobile(): Promise<void> {
    await this._expandNavbarIfCollapsed();
    await this._signUpNavButton.click();
    await this._signUpModal.waitFor({ state: 'visible' });
  }

  async openLoginModal(): Promise<void> {
    await this._logInNavButton.click();
    await this._logInModal.waitFor({ state: 'visible' });
  }

  async openSignUpModal(): Promise<void> {
    await this._signUpNavButton.click();
    await this._signUpModal.waitFor({ state: 'visible' });
  }

  async submitEmptyLogin(): Promise<void> {
    const dialogPromise = new Promise<void>((resolve) => {
      this.page.once('dialog', async (dialog) => {
        await dialog.accept();
        resolve();
      });
    });
    await this._logInSubmit.click();
    await dialogPromise;
  }

  async submitEmptySignUp(): Promise<void> {
    const dialogPromise = new Promise<void>((resolve) => {
      this.page.once('dialog', async (dialog) => {
        await dialog.accept();
        resolve();
      });
    });
    await this._signUpSubmit.click();
    await dialogPromise;
  }

  async dismissSignUpModal(): Promise<void> {
    const alreadyClosed = await this._signUpModal
      .waitFor({ state: 'hidden', timeout: 3_000 })
      .then(() => true)
      .catch(() => false);
    if (!alreadyClosed) {
      await this._signUpModalClose.click();
      await this._signUpModal.waitFor({ state: 'hidden' });
    }
  }

  async register(username: string, password: string): Promise<string> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this._signUpNavButton.click();
    await this._signUpModal.waitFor({ state: 'visible' });
    await this._signUpUsername.fill(username);
    await this._signUpPassword.fill(password);

    // The register dialog fires after an async API response, so the sequential
    // waitForEvent pattern works here (unlike the synchronous contact alert).
    const dialogPromise = this.page.waitForEvent('dialog');
    await this._signUpSubmit.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    await this.dismissSignUpModal();
    return message;
  }

  async login(username: string, password: string): Promise<void> {
    await this._logInNavButton.click();
    await this._logInModal.waitFor({ state: 'visible' });
    await this._logInUsername.fill(username);
    await this._logInPassword.fill(password);
    await this._logInSubmit.click();
    await this._logInModal.waitFor({ state: 'hidden' });
    await this._loggedInUsername.waitFor({ state: 'visible' });
  }

  async loginExpectingError(username: string, password: string): Promise<string> {
    await this._logInNavButton.click();
    await this._logInModal.waitFor({ state: 'visible' });
    await this._logInUsername.fill(username);
    await this._logInPassword.fill(password);
    const dialogPromise = this.page.waitForEvent('dialog');
    await this._logInSubmit.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    return message;
  }

  async registerOnMobile(username: string, password: string): Promise<string> {
    await this.openSignUpModalMobile();
    await this._signUpUsername.fill(username);
    await this._signUpPassword.fill(password);
    const dialogPromise = this.page.waitForEvent('dialog');
    await this._signUpSubmit.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    await this.dismissSignUpModal();
    return message;
  }

  async loginOnMobile(username: string, password: string): Promise<void> {
    await this.openLoginModalMobile();
    await this._logInUsername.fill(username);
    await this._logInPassword.fill(password);
    await this._logInSubmit.click();
    await this._logInModal.waitFor({ state: 'hidden' });
    await this._loggedInUsername.waitFor({ state: 'visible' });
  }

  async logout(): Promise<void> {
    await this._logoutButton.click();
    await this._loggedInUsername.waitFor({ state: 'hidden' });
  }
}
