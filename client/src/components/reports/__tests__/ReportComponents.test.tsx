import { render, screen } from '@testing-library/react';
import { ByCardTable } from '../ByCardTable';
import { RejectedList } from '../RejectedList';
import { ByCardTypeChart } from '../ByCardTypeChart';
import { ByDayChart } from '../ByDayChart';
import type { ByCardRow, RejectedTransaction } from '../../../types/api';

describe('ByCardTable', () => {
  const rows: ByCardRow[] = [
    {
      cardId: 'c1',
      maskedNumber: '**** **** **** 1111',
      last4: '1111',
      cardType: 'VISA',
      holderName: 'Jane',
      count: 5,
      total: '500.00',
    },
    {
      cardId: null,
      maskedNumber: null,
      last4: null,
      cardType: null,
      holderName: null,
      count: 0,
      total: '0.00',
    },
  ];
  it('renders rows with totals', () => {
    render(<ByCardTable rows={rows} />);
    expect(screen.getByText('**** **** **** 1111')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    expect(screen.getByText('$500.00')).toBeInTheDocument();
  });
});

describe('RejectedList', () => {
  const items: RejectedTransaction[] = [
    {
      id: 'r1',
      maskedNumber: '**** **** **** 0000',
      timestamp: '2025-01-01T12:00:00Z',
      amount: '0.00',
      rejectionReason: 'INVALID_AMOUNT',
      batchId: null,
      createdAt: '2025-01-01T12:00:00Z',
    },
  ];
  it('renders the reason as a danger badge', () => {
    render(<RejectedList items={items} />);
    expect(screen.getByText('INVALID_AMOUNT')).toBeInTheDocument();
    expect(screen.getByText('**** **** **** 0000')).toBeInTheDocument();
  });

  it('falls back to UNKNOWN when reason is null', () => {
    render(
      <RejectedList
        items={[{ ...items[0], rejectionReason: null }]}
      />,
    );
    expect(screen.getByText('UNKNOWN')).toBeInTheDocument();
  });
});

describe('Recharts wrappers', () => {
  it('ByCardTypeChart renders with data', () => {
    const { container } = render(
      <ByCardTypeChart
        data={[
          { cardType: 'VISA', count: 1, total: '10' },
          { cardType: 'AMEX', count: 2, total: '20' },
        ]}
      />,
    );
    // Recharts renders a responsive container div
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy();
  });

  it('ByDayChart renders with data', () => {
    const { container } = render(
      <ByDayChart data={[{ date: '2025-01-01', count: 1, total: '10' }]} />,
    );
    expect(container.querySelector('.recharts-responsive-container')).toBeTruthy();
  });
});
