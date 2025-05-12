module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  },
  moduleNameMapper: {
    '^<rootDir>/lib/(.*)$': '<rootDir>/dist/lib/$1',
    '^<rootDir>/bin/(.*)$': '<rootDir>/dist/bin/$1'
  }
};
