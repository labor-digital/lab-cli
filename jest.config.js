/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
    }],
  },
  moduleNameMapper: {
    '^chalk$': '<rootDir>/test/__mocks__/chalk.js',
    '^inquirer$': '<rootDir>/test/__mocks__/inquirer.js',
    '^radashi$': '<rootDir>/test/__mocks__/radashi.js'
  }
};
