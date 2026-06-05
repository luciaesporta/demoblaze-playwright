export interface TestUser {
  username: string;
  password: string;
}

export interface OrderDetails {
  name: string;
  country: string;
  city: string;
  creditCard: string;
  month: string;
  year: string;
}

export interface InvalidLoginScenario {
  description: string;
  username: string | null;
  password: string;
}

export interface InvalidSignUpScenario {
  description: string;
  username: string;
  password: string;
}

export interface SpecialCharSignUpScenario {
  description: string;
  usernameChars: string;
}

export function generateUser(): TestUser {
  const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    username: `luciaesporta_${uid}`,
    password: 'Test1234!',
  };
}

export const INVALID_LOGIN_SCENARIOS: readonly InvalidLoginScenario[] = [
  { description: 'non-existent user', username: 'ghost_user_00000', password: 'Test1234!' },
  { description: 'wrong password', username: null, password: 'WrongPass!' },
];

export const INVALID_SIGNUP_SCENARIOS: readonly InvalidSignUpScenario[] = [
  { description: 'only username (missing password)', username: 'lucia_partial_signup', password: '' },
  { description: 'only password (missing username)', username: '', password: 'Test1234!' },
];

export const SPECIAL_CHAR_SIGNUP_SCENARIOS: readonly SpecialCharSignUpScenario[] = [
  { description: 'punctuation symbols (!@#$)', usernameChars: '!@#$' },
  { description: 'emoji', usernameChars: '🎉' },
  { description: 'whitespace in the middle', usernameChars: ' mid ' },
];

export const DEFAULT_ORDER: OrderDetails = {
  name: 'Lucía Esporta',
  country: 'Argentina',
  city: 'Buenos Aires',
  creditCard: '1234567890123456',
  month: 'Noviembre',
  year: '2026',
};

export const VALIDATED_EMPTY_FIELD_SCENARIOS: readonly { description: string; order: OrderDetails }[] = [
  { description: 'name empty', order: { ...DEFAULT_ORDER, name: '' } },
  { description: 'credit card empty', order: { ...DEFAULT_ORDER, creditCard: '' } },
];

export const UNVALIDATED_EMPTY_FIELD_SCENARIOS: readonly { description: string; order: OrderDetails }[] = [
  { description: 'country empty', order: { ...DEFAULT_ORDER, country: '' } },
  { description: 'city empty', order: { ...DEFAULT_ORDER, city: '' } },
  { description: 'month empty', order: { ...DEFAULT_ORDER, month: '' } },
  { description: 'year empty', order: { ...DEFAULT_ORDER, year: '' } },
  { description: 'name contains only numbers', order: { ...DEFAULT_ORDER, name: '12345' } },
  { description: 'country contains only numbers', order: { ...DEFAULT_ORDER, country: '12345' } },
];

export const SHORT_CREDIT_CARD = '1234';
export const LONG_CREDIT_CARD = '12345678901234567';
export const NON_NUMERIC_CREDIT_CARD = 'abcd';
export const SYMBOL_CREDIT_CARD = '@@##';
