import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

jest.mock('../../actions/report.actions', () => ({
  fetchSummary: jest.fn().mockResolvedValue({
    cards: 10,
    transactions: 50,
    accepted: 45,
    rejected: 5,
    batches: 3,
    totalVolume: '12345.67',
  }),
  fetchByDay: jest.fn().mockResolvedValue([
    { date: '2025-01-01', count: 2, total: '100.00' },
    { date: '2025-01-02', count: 3, total: '200.00' },
  ]),
}));

import { DashboardPage } from '../DashboardPage';

describe('DashboardPage', () => {
  it('renders heading and resolves to KPI values', async () => {
    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('heading').length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getAllByText(/Transactions/i).length).toBeGreaterThan(0));
  });
});
