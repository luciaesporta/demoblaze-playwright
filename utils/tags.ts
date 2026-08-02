/**
 * Test tags for filtering and organizing test suites.
 *
 * Usage with test.describe:
 *   test.describe('Feature', { tag: [SMOKE, CRITICAL] }, () => { ... });
 *
 * Usage with individual tests:
 *   test('should work', { tag: SMOKE }, async ({ page }) => { ... });
 *
 * Run by tag:
 *   npx playwright test --grep @smoke
 *   npx playwright test --grep @critical
 *   npx playwright test --grep "@smoke|@critical"
 */

export const SMOKE = '@smoke';
export const REGRESSION = '@regression';
export const CRITICAL = '@critical';
