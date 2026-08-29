import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

describe('shared back navigation layout', () => {
  it('stays in document flow instead of covering page controls', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/App.jsx'), 'utf8');
    const navigation = source.match(/<nav[\s\S]*?aria-label="Page navigation"[\s\S]*?<\/nav>/)?.[0];

    expect(navigation).toBeTruthy();
    expect(navigation).toContain('relative');
    expect(navigation).not.toMatch(/\bfixed\b|\babsolute\b/);
    expect(navigation).not.toMatch(/\btop-\d|\bleft-\d/);
  });
});
