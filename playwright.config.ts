import { defineConfig, devices } from '@playwright/test';

// On NixOS, Playwright's downloaded Chromium is dynamically linked for generic
// Linux and cannot run. Use the system Chromium from the Nix store instead.
const SYSTEM_CHROMIUM = '/nix/store/b6vcxswr4zr4aqb6rywk4h9cxj2a7984-chromium-146.0.7680.80/bin/chromium';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:8081',
    storageState: undefined,
    trace: 'on-first-retry',
    launchOptions: {
      executablePath: SYSTEM_CHROMIUM,
      args: ['--no-sandbox'],
    },
  },
  projects: [
    {
      name: 'chromium-mobile',
      use: {
        ...devices['Pixel 5'],
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Dev server must already be running (npm run web)
  webServer: {
    command: 'npm run web',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
