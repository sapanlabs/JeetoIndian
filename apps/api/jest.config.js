module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@jeeto/config$': '<rootDir>/../../packages/config/src',
    '^@jeeto/shared-types$': '<rootDir>/../../packages/shared-types/src',
    '^@jeeto/validation$': '<rootDir>/../../packages/validation/src',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: './coverage',
  testEnvironment: 'node',
};
