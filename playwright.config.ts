import path from 'path';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

const envFile = process.env.NODE_ENV === 'ci' ? '.env.ci' : '.env.local';
dotenv.config({ path: path.resolve(process.cwd(), envFile) });
dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: Number(process.env.TEST_TIMEOUT) || 60_000,
  retries: Number(process.env.RETRIES) || 2,
  expect: {
    timeout: Number(process.env.EXPECT_TIMEOUT) || 15_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.05 },
  },
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}',
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }], ['list']],
  use: {
    baseURL: process.env.BASE_URL || 'https://www.demoblaze.com',
    headless: process.env.HEADLESS !== 'false',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
    navigationTimeout: 60_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      grepInvert: [/@chromium-only/],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      grepInvert: [/@chromium-only/],
    },
  ],
});
