import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { CardsTable } from '../CardsTable';
import type { Card } from '../../../types/api';

const sample: Card[] = [
  {
    id: 'c1',
    maskedNumber: '**** **** **** 1111',
    last4: '1111',
    cardType: 'VISA',
    holderName: 'Jane',
    createdAt: '2025-01-01T00:00:00Z',
    updatedAt: '2025-01-01T00:00:00Z',
    transactionCount: 3,
  },
  {
    id: 'c2',
    maskedNumber: '**** **** **** 2222',
    last4: '2222',
    cardType: 'AMEX',
    holderName: null,
    createdAt: '2025-01-02T00:00:00Z',
    updatedAt: '2025-01-02T00:00:00Z',
    transactionCount: 0,
  },
];

describe('CardsTable', () => {
  it('renders rows with masked PAN and holder', () => {
    render(
      <MemoryRouter>
        <CardsTable cards={sample} canMutate={false} onDelete={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByText('**** **** **** 1111')).toBeInTheDocument();
    expect(screen.getByText('Jane')).toBeInTheDocument();
    // Empty holder renders a dash
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('hides mutation actions when canMutate is false', () => {
    render(
      <MemoryRouter>
        <CardsTable cards={sample} canMutate={false} onDelete={() => {}} />
      </MemoryRouter>,
    );
    // No buttons in the action cell
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('shows edit + delete and triggers onDelete when canMutate', async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    render(
      <MemoryRouter>
        <CardsTable cards={sample} canMutate onDelete={onDelete} />
      </MemoryRouter>,
    );
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBe(2 * sample.length);
    // Second button in first row is delete
    await user.click(buttons[1]);
    expect(onDelete).toHaveBeenCalledWith('c1');
  });
});
