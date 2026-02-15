import { beforeAll, afterAll, afterEach } from 'vitest';

/**
 * Global test setup file
 * Copy this to packages/{package}/tests/setup.ts when creating a package
 */

beforeAll(() => {
  // Global setup before all tests
  // Example: Mock environment variables, setup test database, etc.
});

afterEach(() => {
  // Clean up after each test
  // Example: Clear mocks, reset state, etc.
});

afterAll(() => {
  // Global teardown after all tests
  // Example: Close database connections, cleanup temp files, etc.
});
