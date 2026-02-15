import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.config';

/**
 * Vitest configuration for @agentik-os/cli package
 * Copy this to packages/cli/vitest.config.ts when creating the package
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'cli',
      environment: 'node',
      setupFiles: ['./tests/setup.ts'],
      coverage: {
        include: ['src/**/*.ts'],
        exclude: [
          'src/**/*.test.ts',
          'src/**/*.spec.ts',
          'src/types/**',
          'src/**/__tests__/**',
        ],
      },
    },
  })
);
