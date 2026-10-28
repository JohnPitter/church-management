// Os testes assumem o fuso de Brasília (igreja e usuários no Brasil);
// fixar aqui evita falhas em CI/máquinas configuradas em UTC.
module.exports = async () => {
  process.env.TZ = 'America/Sao_Paulo';

  // Valores fictícios só para o SDK do Firebase inicializar sem .env;
  // nunca sobrescrevem variáveis já definidas.
  const defaults = {
    REACT_APP_FIREBASE_API_KEY: 'test-api-key',
    REACT_APP_FIREBASE_AUTH_DOMAIN: 'localhost',
    REACT_APP_FIREBASE_PROJECT_ID: 'demo-test',
    REACT_APP_FIREBASE_STORAGE_BUCKET: 'demo-test.appspot.com',
    REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '1',
    REACT_APP_FIREBASE_APP_ID: '1:1:web:test'
  };
  Object.entries(defaults).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
};
