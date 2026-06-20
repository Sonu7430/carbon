import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    }
  ],
  // Boots backend and frontend servers sequentially before testing
  webServer: [
    {
      command: 'npm run start --prefix backend',
      port: 5000,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe',
      env: {
        NODE_ENV: 'test',
        PORT: '5000',
        JWT_SECRET: 'eco_track_secret_key_2026_safe_and_long'
      }
    },
    {
      command: 'npx vite --prefix frontend --port 5173',
      port: 5173,
      reuseExistingServer: !process.env.CI,
      stdout: 'pipe',
      stderr: 'pipe'
    }
  ]
});
