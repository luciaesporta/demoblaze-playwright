function generateUser() {
  return {
    username: `luciaesporta_${Date.now()}`,
    password: 'Test1234!',
  };
}

const invalidLoginScenarios = [
  { description: 'non-existent user', username: 'ghost_user_00000', password: 'Test1234!' },
  { description: 'wrong password',    username: null,               password: 'WrongPass!' },
];

module.exports = { generateUser, invalidLoginScenarios };
