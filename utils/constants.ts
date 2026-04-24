export const PAGE_TITLE = /STORE/;
export const PRODUCT_PAGE_URL = /prod\.html/;
export const CART_PAGE_URL = /cart\.html/;
export const FAVICON_HREF = /blazemeter-favicon/;
export const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;

export const CATEGORY_PRODUCTS = {
  Phones: [
    'Samsung galaxy s6',
    'Nokia lumia 1520',
    'Nexus 6',
    'Samsung galaxy s7',
    'Iphone 6 32gb',
    'Sony xperia z5',
    'HTC One M9',
  ],
  Laptops: [
    'Sony vaio i5',
    'Sony vaio i7',
    'MacBook air',
    'Dell i7 8gb',
    '2017 Dell 15.6 Inch',
    'MacBook Pro',
  ],
  Monitors: [
    'Apple monitor 24',
    'ASUS Full HD',
  ],
} as const;

export type CategoryName = keyof typeof CATEGORY_PRODUCTS;

export const MESSAGES = {
  signUpSuccess: 'Sign up successful',
  contactSuccess: 'Thanks',
  purchaseConfirmation: 'Thank you for your purchase!',
  aboutUsTitle: 'About us',
} as const;

export const CONTACT_FORM_SAMPLE = {
  email: 'test@example.com',
  name: 'Test User',
  message: 'This is a test message.',
} as const;

export const HERO_CAROUSEL_MIN_DISTINCT_SLIDES = 3;
