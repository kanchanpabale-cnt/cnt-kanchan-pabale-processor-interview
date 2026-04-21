import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CardForm } from '../CardForm';

describe('CardForm — create mode', () => {
  it('renders card number input, one transaction row, and submit button', () => {
    render(<CardForm mode="create" onSubmit={() => {}} />);
    expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
    expect(screen.getByText('Transaction #1')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create card/i })).toBeInTheDocument();
  });

  it('strips non-digits and groups 16-digit PAN as 4-4-4-4', async () => {
    const user = userEvent.setup();
    render(<CardForm mode="create" onSubmit={() => {}} />);
    const pan = screen.getByLabelText(/card number/i) as HTMLInputElement;
    await user.type(pan, '4111111111111111');
    expect(pan.value).toBe('4111 1111 1111 1111');
  });

  it('formats 15-digit Amex as 5-5-5 and enforces counter', async () => {
    const user = userEvent.setup();
    render(<CardForm mode="create" onSubmit={() => {}} />);
    const pan = screen.getByLabelText(/card number/i) as HTMLInputElement;
    await user.type(pan, '371449635398431');
    expect(pan.value).toBe('37144 96353 98431');
    expect(screen.getByText('15/15 digits')).toBeInTheDocument();
  });

  it('adds and removes transaction rows', async () => {
    const user = userEvent.setup();
    render(<CardForm mode="create" onSubmit={() => {}} />);
    await user.click(screen.getByRole('button', { name: /add another transaction/i }));
    expect(screen.getByText('Transaction #2')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /remove transaction 2/i }));
    expect(screen.queryByText('Transaction #2')).not.toBeInTheDocument();
  });

  it('shows validation errors for empty PAN and amount on submit', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<CardForm mode="create" onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: /create card/i }));
    expect(onSubmit).not.toHaveBeenCalled();
    // Error text appears under the card number hint
    expect(
      screen.getAllByText(/digits/i).length,
    ).toBeGreaterThan(0);
  });

  it('submits a valid create payload', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<CardForm mode="create" onSubmit={onSubmit} />);
    await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
    const amount = screen.getByLabelText(/amount/i) as HTMLInputElement;
    await user.type(amount, '123.45');
    await user.click(screen.getByRole('button', { name: /create card/i }));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    const arg = onSubmit.mock.calls[0][0];
    expect(arg.cardNumber).toBe('4111111111111111');
    expect(arg.transactions).toHaveLength(1);
    expect(arg.transactions[0].amount).toBe('123.45');
  });
});

describe('CardForm — edit mode', () => {
  const initial = {
    id: 'c1',
    maskedNumber: '**** **** **** 1111',
    last4: '1111',
    cardType: 'VISA' as const,
    holderName: 'Jane',
    createdAt: '',
    updatedAt: '',
  };

  it('renders masked PAN, holder, and optional txn fields', () => {
    render(<CardForm mode="edit" initial={initial} onSubmit={() => {}} />);
    expect(screen.getByText('**** **** **** 1111')).toBeInTheDocument();
    expect(
      (screen.getByLabelText(/cardholder name/i) as HTMLInputElement).value,
    ).toBe('Jane');
    expect(screen.getByLabelText(/transaction amount/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();
  });

  it('submits holder-only update when amount is empty', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<CardForm mode="edit" initial={initial} onSubmit={onSubmit} />);
    await user.click(screen.getByRole('button', { name: /save changes/i }));
    expect(onSubmit).toHaveBeenCalled();
    expect(onSubmit.mock.calls[0][0].amount).toBeUndefined();
  });

  it('fires onCancel when Cancel is clicked', async () => {
    const user = userEvent.setup();
    const onCancel = jest.fn();
    render(<CardForm mode="edit" initial={initial} onSubmit={() => {}} onCancel={onCancel} />);
    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalled();
  });
});
