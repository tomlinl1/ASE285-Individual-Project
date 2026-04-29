import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      name: 'frontend',
      include: [
        'tests/**/frontend/**/*.{test,spec}.tsx',
        'tests/**/frontend/**/*.{test,spec}.ts',
      ],
      environment: 'jsdom',
      setupFiles: ['tests/test-utils/setupFrontend.ts'],
      globals: true,
      restoreMocks: true,
    },
  },
  {
    test: {
      name: 'backend',
      include: ['tests/**/backend/**/*.{test,spec}.ts'],
      environment: 'node',
      globals: true,
      restoreMocks: true,
    },
  },
]);

