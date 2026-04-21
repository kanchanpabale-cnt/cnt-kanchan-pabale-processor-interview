/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)', '**/*.test.(ts|tsx)'],
  setupFiles: ['<rootDir>/jest.polyfills.cjs'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(svg|png|jpg|jpeg|gif|woff2?)$': '<rootDir>/__mocks__/fileMock.cjs',
    '^@fontsource/(.*)$': '<rootDir>/__mocks__/fileMock.cjs',
  },
  transform: {
    '^.+\\.(t|j)sx?$': [
      '@swc/jest',
      {
        jsc: {
          parser: { syntax: 'typescript', tsx: true, decorators: true },
          target: 'es2022',
          transform: { react: { runtime: 'automatic' } },
        },
        module: { type: 'commonjs' },
      },
    ],
  },
  transformIgnorePatterns: ['/node_modules/(?!(lucide-react|recharts|d3-.*|internmap)/)'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/main.tsx',
    '!src/vite-env.d.ts',
    '!src/**/*.d.ts',
    '!src/styles/**',
  ],
  coverageReporters: ['text', 'text-summary', 'html', 'lcov'],
  coverageDirectory: 'coverage',
};
