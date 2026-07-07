import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Pure-logic tests (reducer, streams) run in node. Component tests, when
    // added, will use a separate project with a DOM environment.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
