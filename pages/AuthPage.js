class AuthPage {
  constructor(page) {
    this.page = page;

    this.signUpNavButton = page.locator('#signin2');
    this.signUpModal = page.locator('#signInModal');
    this.signUpUsername = page.locator('#sign-username');
    this.signUpPassword = page.locator('#sign-password');
    this.signUpSubmit = page.locator('#signInModal .btn-primary');

    this.logInNavButton = page.locator('#login2');
    this.logInModal = page.locator('#logInModal');
    this.logInUsername = page.locator('#loginusername');
    this.logInPassword = page.locator('#loginpassword');
    this.logInSubmit = page.locator('#logInModal .btn-primary');
    this.loggedInUsername = page.locator('#nameofuser');
    this.logoutButton = page.locator('#logout2');
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
