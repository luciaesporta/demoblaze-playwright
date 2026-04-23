class AuthPage {
  constructor(page) {
    this.page = page;

    this.signUpNavButton = page.getByRole('link', { name: 'Sign up' });
    this.signUpModal = page.locator('#signInModal');
    this.signUpUsername = this.signUpModal.getByLabel('Username:');
    this.signUpPassword = this.signUpModal.getByLabel('Password:');
    this.signUpSubmit = this.signUpModal.getByRole('button', { name: 'Sign up' });

    this.logInNavButton = page.getByRole('link', { name: 'Log in' });
    this.logInModal = page.locator('#logInModal');
    this.logInUsername = page.locator('#loginusername');
    this.logInPassword = page.locator('#loginpassword');
    this.logInSubmit = this.logInModal.getByRole('button', { name: 'Log in' });
    this.loggedInUsername = page.locator('#nameofuser');
    this.logoutButton = page.getByRole('link', { name: 'Log out' });
    this.signUpModalClose = this.signUpModal.getByRole('button', { name: 'Close' });
    this.navbarCollapsible = page.locator('#navbarExample');
    this.hamburger = page.getByRole('button', { name: 'Toggle navigation' });
  }

  async _expandNavbarIfCollapsed() {
    const isVisible = await this.navbarCollapsible.isVisible();
    if (!isVisible) {
      await this.hamburger.click();
      await this.navbarCollapsible.waitFor({ state: 'visible' });
    }
  }

  async openLoginModalMobile() {
    await this._expandNavbarIfCollapsed();
    await this.logInNavButton.click();
    await this.logInModal.waitFor({ state: 'visible' });
  }

  async openSignUpModalMobile() {
    await this._expandNavbarIfCollapsed();
    await this.signUpNavButton.click();
    await this.signUpModal.waitFor({ state: 'visible' });
  }

  async dismissSignUpModal() {
    const alreadyClosed = await this.signUpModal
      .waitFor({ state: 'hidden', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (!alreadyClosed) {
      await this.signUpModalClose.click();
      await this.signUpModal.waitFor({ state: 'hidden' });
    }
  }

  async openLoginModal() {
    await this.logInNavButton.click();
    await this.logInModal.waitFor({ state: 'visible' });
  }

  async submitEmptyLogin() {
    await this.logInSubmit.click();
  }

  async openSignUpModal() {
    await this.signUpNavButton.click();
    await this.signUpModal.waitFor({ state: 'visible' });
  }

  async submitEmptySignUp() {
    await this.signUpSubmit.click();
  }

  async register(username, password) {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await this.signUpNavButton.click();
    await this.signUpModal.waitFor({ state: 'visible' });
    await this.signUpUsername.fill(username);
    await this.signUpPassword.fill(password);

    const dialogPromise = this.page.waitForEvent('dialog');
    await this.signUpSubmit.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    const alreadyClosed = await this.signUpModal
      .waitFor({ state: 'hidden', timeout: 3000 })
      .then(() => true)
      .catch(() => false);
    if (!alreadyClosed) {
      await this.page.locator('#signInModal .close').click();
      await this.signUpModal.waitFor({ state: 'hidden' });
    }
    return message;
  }

  async login(username, password) {
    await this.logInNavButton.click();
    await this.logInModal.waitFor({ state: 'visible' });
    await this.logInUsername.fill(username);
    await this.logInPassword.fill(password);
    await this.logInSubmit.click();
    await this.logInModal.waitFor({ state: 'hidden' });
    await this.loggedInUsername.waitFor({ state: 'visible' });
  }

  async loginExpectingError(username, password) {
    await this.logInNavButton.click();
    await this.logInModal.waitFor({ state: 'visible' });
    await this.logInUsername.fill(username);
    await this.logInPassword.fill(password);
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.logInSubmit.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    return message;
  }
}

module.exports = { AuthPage };
