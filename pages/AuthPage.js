class AuthPage {
  constructor(page) {
    this.page = page;

    // Sign up modal
    this.signUpNavButton = page.locator('#signin2');
    this.signUpModal = page.locator('#signInModal');
    this.signUpUsername = page.locator('#sign-username');
    this.signUpPassword = page.locator('#sign-password');
    this.signUpSubmit = page.locator('#signInModal .btn-primary');

    // Log in modal
    this.logInNavButton = page.locator('#login2');
    this.logInModal = page.locator('#logInModal');
    this.logInUsername = page.locator('#loginusername');
    this.logInPassword = page.locator('#loginpassword');
    this.logInSubmit = page.locator('#logInModal .btn-primary');

    // Post-login navbar element
    this.loggedInUsername = page.locator('#nameofuser');
  }

  async register(username, password) {
    await this.signUpNavButton.click();
    await this.signUpModal.waitFor({ state: 'visible' });
    await this.signUpUsername.fill(username);
    await this.signUpPassword.fill(password);

    const dialogPromise = this.page.waitForEvent('dialog');
    await this.signUpSubmit.click();
    const dialog = await dialogPromise;
    const message = dialog.message();
    await dialog.accept();
    return message;
  }

  async login(username, password) {
    await this.logInNavButton.click();
    await this.logInModal.waitFor({ state: 'visible' });
    await this.logInUsername.fill(username);
    await this.logInPassword.fill(password);
    await this.logInSubmit.click();
  }
}

module.exports = { AuthPage };
