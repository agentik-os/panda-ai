import { defineConfig, mergeConfig } from 'vitest/config';
import baseConfig from '../../vitest.config';

/**
 * Vitest configuration for @agentik-os/runtime package
 * Copy this to packages/runtime/vitest.config.ts when creating the package
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      name: 'runtime',
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
