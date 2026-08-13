import type { Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Result } from 'axe-core';

/**
 * Accessibility scanning helpers built on top of @axe-core/playwright.
 *
 * Usage:
 *   const violations = await checkA11y(page);
 *   expect(violations, formatViolations(violations)).toEqual([]);
 *
 *   // Scope the scan to a single region and ignore known issues:
 *   const violations = await checkA11y(page, {
 *     include: '#logInModal',
 *     disableRules: ['color-contrast'],
 *   });
 */

/** WCAG 2.1 Level A + AA — the default ruleset for this suite. */
export const WCAG_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] as const;

export interface CheckA11yOptions {
  /** Axe rule tags to run. Defaults to WCAG 2.1 A + AA. */
  tags?: readonly string[];
  /** CSS selector(s) to limit the scan to. Defaults to the whole page. */
  include?: string | string[];
  /** CSS selector(s) to exclude from the scan. */
  exclude?: string | string[];
  /** Axe rule ids to skip (e.g. known third-party issues). */
  disableRules?: string[];
}

/**
 * Runs an axe-core scan against the page and returns the violations found.
 *
 * Returns the raw violation list rather than asserting, so callers decide how
 * to fail (POM/helper layers stay assertion-free).
 */
export async function checkA11y(page: Page, options: CheckA11yOptions = {}): Promise<Result[]> {
  const { tags = WCAG_AA_TAGS, include, exclude, disableRules } = options;

  let builder = new AxeBuilder({ page }).withTags([...tags]);

  if (include) {
    builder = builder.include(include);
  }
  if (exclude) {
    builder = builder.exclude(exclude);
  }
  if (disableRules?.length) {
    builder = builder.disableRules(disableRules);
  }

  const results = await builder.analyze();
  return results.violations;
}

/** Builds a readable summary of violations for assertion messages and reports. */
export function formatViolations(violations: Result[]): string {
  if (violations.length === 0) {
    return 'No accessibility violations found.';
  }

  const details = violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => `      - ${node.target.join(', ')}`).join('\n');
      return [
        `  [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help}`,
        `    ${violation.helpUrl}`,
        `    affected nodes (${violation.nodes.length}):`,
        targets,
      ].join('\n');
    })
    .join('\n\n');

  return `${violations.length} accessibility violation(s) found:\n\n${details}`;
}
