import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MonthlyOverview } from './MonthlyOverview';

describe('MonthlyOverview', () => {
  it('renders one node per day for June 2026', () => {
    render(<MonthlyOverview year={2026} month={6} recordedDates={['2026-06-16']} />);

    expect(screen.getAllByRole('button')).toHaveLength(30);
    expect(screen.getByRole('button', { name: '2026-06-16 有记录' })).toBeTruthy();
  });
});
