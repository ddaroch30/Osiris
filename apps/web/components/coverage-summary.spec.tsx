import { describe, expect, it } from 'vitest';
import { CoverageSummary } from './coverage-summary';

describe('CoverageSummary', () => {
  it('renders approval percentage', () => {
    const el = CoverageSummary({ total: 4, approved: 3 });
    expect((el.props.children as string[]).join('')).toContain('75%');
  });
});
