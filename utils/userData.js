function generateUser() {
  return {
    username: `luciaesporta_${Date.now()}`,
    password: 'Test1234!',
  };
}

module.exports = { generateUser };
