import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'Desktop Chrome',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 }
      }
    },
    {
      name: 'Mobile Viewport',
      use: {
        viewport: { width: 375, height: 667 },
        isMobile: true
      }
    },
    {
      name: 'Reduced Motion',
      use: {
        ...devices['Desktop Chrome'],
        contextOptions: {
          reducedMotion: 'reduce'
        }
      }
    }
  ],
  webServer: {
    command: 'npm run start -w apps/web',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 30000
  }
});
