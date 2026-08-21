import path from 'path';
import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';

const envMap: Record<string, string> = { ci: '.env.ci', local: '.env.local' };
const envFile = envMap[process.env.NODE_ENV ?? ''];
if (envFile) {
  dotenv.config({ path: path.resolve(process.cwd(), envFile) });
}
dotenv.config();

export default defineConfig({
  testDir: './tests',
  timeout: Number(process.env.TEST_TIMEOUT) || 60_000,
  retries: Number(process.env.RETRIES) || 2,

  // Run every test in parallel, not just one file at a time. The suite is
  // stateless per test — each one registers its own user or starts from a
  // clean page — so tests inside a file are safe to interleave.
  fullyParallel: true,

  // demoblaze is a shared public site that degrades under load, so the worker
  // count is a throughput/stability trade-off rather than a pure speed dial.
  // Two workers on CI keeps the pressure close to what the runner already
  // produced; locally, Playwright's default (half the cores) applies.
  workers: process.env.CI ? 2 : undefined,
  expect: {
    timeout: Number(process.env.EXPECT_TIMEOUT) || 15_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.05 },
  },
  snapshotPathTemplate: '{testDir}/{testFileDir}/{testFileName}-snapshots/{arg}{ext}',
  // A sharded run produces one partial report per shard, which only becomes a
  // whole report once merged. The blob reporter is the format `playwright
  // merge-reports` consumes, so the sharded CI jobs opt into it and the merge
  // job turns the pieces back into HTML. Everything else — local runs, the
  // container job — keeps writing HTML directly.
  reporter: process.env.PW_BLOB_REPORT
    ? [['blob'], ['list'], ['allure-playwright']]
    : [
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['list'],
        ['allure-playwright'],
      ],
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
