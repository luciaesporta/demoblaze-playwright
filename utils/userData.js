function generateUser() {
  const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    username: `luciaesporta_${uid}`,
    password: 'Test1234!',
  };
}

const invalidLoginScenarios = [
  { description: 'non-existent user', username: 'ghost_user_00000', password: 'Test1234!' },
  { description: 'wrong password', username: null, password: 'WrongPass!' },
];

const DEFAULT_ORDER = {
  name: 'Lucía Esporta',
  country: 'Argentina',
  city: 'Buenos Aires',
  creditCard: '1234567890123456',
  month: 'Noviembre',
  year: '2026',
};

module.exports = { generateUser, invalidLoginScenarios, DEFAULT_ORDER };
