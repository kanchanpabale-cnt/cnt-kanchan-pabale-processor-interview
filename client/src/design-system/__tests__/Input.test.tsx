import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../Input';

describe('Input', () => {
  it('renders label, value, and hint', () => {
    render(<Input label="Email" value="" onChange={() => {}} hint="we never share this" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByText('we never share this')).toBeInTheDocument();
  });

  it('shows error text and sets aria-invalid', () => {
    render(<Input label="Email" value="" onChange={() => {}} error="bad" />);
    expect(screen.getByText('bad')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'true');
  });

  it('supports typing', async () => {
    const user = userEvent.setup();
    const fn = jest.fn();
    function Wrapper() {
      return <Input label="E" onChange={fn} />;
    }
    render(<Wrapper />);
    await user.type(screen.getByLabelText('E'), 'hi');
    expect(fn).toHaveBeenCalled();
  });

  it('renders without label when not provided', () => {
    render(<Input placeholder="nolabel" />);
    expect(screen.getByPlaceholderText('nolabel')).toBeInTheDocument();
  });
});
