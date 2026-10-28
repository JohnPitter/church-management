const CracoAlias = require('craco-alias');

module.exports = {
  plugins: [
    {
      plugin: CracoAlias,
      options: {
        source: 'tsconfig',
        baseUrl: './src',
        tsConfigPath: './tsconfig.json'
      }
    }
  ],
  jest: {
    configure: {
      globalSetup: '<rootDir>/jest.global-setup.js'
    }
  }
};
