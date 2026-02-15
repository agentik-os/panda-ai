import { defineConfig, mergeConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import baseConfig from '../../vitest.config';

/**
 * Vitest configuration for @agentik-os/dashboard package
 * Copy this to packages/dashboard/vitest.config.ts when creating the package
 */
export default mergeConfig(
  baseConfig,
  defineConfig({
    plugins: [react()],
    test: {
      name: 'dashboard',
      environment: 'jsdom',
      setupFiles: ['./tests/setup.ts'],
      coverage: {
        include: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'lib/**/*.ts'],
        exclude: [
          '**/*.test.{ts,tsx}',
          '**/*.spec.{ts,tsx}',
          '**/__tests__/**',
          'app/layout.tsx',
          'app/**/layout.tsx',
          'app/**/loading.tsx',
          'app/**/error.tsx',
          'app/**/not-found.tsx',
        ],
      },
    },
  })
);
