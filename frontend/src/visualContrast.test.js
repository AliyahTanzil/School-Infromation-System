import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { describe, expect, it } from 'vitest';

const styles = readFileSync(resolve(process.cwd(), 'src/global-ui.css'), 'utf8');

function luminance(hex) {
  const channels = hex
    .replace('#', '')
    .match(/.{2}/g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4));
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function contrast(foreground, background) {
  const light = Math.max(luminance(foreground), luminance(background));
  const dark = Math.min(luminance(foreground), luminance(background));
  return (light + 0.05) / (dark + 0.05);
}

describe('shared text contrast boundaries', () => {
  it('keeps authentication headings, fields, and placeholders readable on light surfaces', () => {
    expect(styles).toMatch(/\.auth-shell__brand,[\s\S]*?color: #142033/);
    expect(styles).toMatch(
      /\.auth-shell :is\(input, select, textarea\)[\s\S]*?background: #f8fafc/
    );
    expect(styles).toMatch(/\.auth-shell :is\(input, select, textarea\)::placeholder/);
    expect(contrast('#142033', '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#64748b', '#f8fafc')).toBeGreaterThanOrEqual(4.5);
  });

  it('keeps shared operational panels readable on dark page shells', () => {
    expect(styles).toMatch(/\.page-shell \{[\s\S]*?--saas-text: #e8eef7/);
    expect(styles).toMatch(/\.page-shell :is\(\.data-panel,[\s\S]*?background: linear-gradient/);
    expect(contrast('#e8eef7', '#102036')).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#aebed0', '#102036')).toBeGreaterThanOrEqual(4.5);
  });
});
