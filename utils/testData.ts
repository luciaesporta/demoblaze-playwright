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

export const DEFAULT_ORDER: OrderDetails = {
  name: 'Lucía Esporta',
  country: 'Argentina',
  city: 'Buenos Aires',
  creditCard: '1234567890123456',
  month: 'Noviembre',
  year: '2026',
};

export const SHORT_CREDIT_CARD = '1234';
export const LONG_CREDIT_CARD = '12345678901234567';
export const NON_NUMERIC_CREDIT_CARD = 'abcd';
export const SYMBOL_CREDIT_CARD = '@@##';
