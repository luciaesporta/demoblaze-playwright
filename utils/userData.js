function generateUser() {
  const uid = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  return {
    username: `luciaesporta_${uid}`,
    password: 'Test1234!',
  };
}

const invalidLoginScenarios = [
  { description: 'non-existent user', username: 'ghost_user_00000', password: 'Test1234!' },
  { description: 'wrong password',    username: null,               password: 'WrongPass!' },
];

module.exports = { generateUser, invalidLoginScenarios };
