import { render, screen } from '@testing-library/react';
import { TransactionsTable } from '../TransactionsTable';
import type { Transaction } from '../../../types/api';

const items: Transaction[] = [
  {
    id: 't1',
    maskedNumber: '**** **** **** 1111',
    timestamp: '2025-01-01T12:00:00Z',
    amount: '100.00',
    status: 'ACCEPTED',
    rejectionReason: null,
    batchId: null,
    card: { id: 'c1', last4: '1111', cardType: 'VISA', holderName: null },
  },
  {
    id: 't2',
    maskedNumber: '**** **** **** 2222',
    timestamp: '2025-01-02T12:00:00Z',
    amount: '-50.00',
    status: 'REJECTED',
    rejectionReason: 'INVALID_AMOUNT',
    batchId: null,
    card: null,
  },
];

describe('TransactionsTable', () => {
  it('renders rows with amount and status', () => {
    render(<TransactionsTable items={items} />);
    expect(screen.getByText('**** **** **** 1111')).toBeInTheDocument();
    expect(screen.getByText('$100.00')).toBeInTheDocument();
    expect(screen.getByText('-$50.00')).toBeInTheDocument();
    expect(screen.getByText('ACCEPTED')).toBeInTheDocument();
    expect(screen.getByText('REJECTED')).toBeInTheDocument();
  });
});
