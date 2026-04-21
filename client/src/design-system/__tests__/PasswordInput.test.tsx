import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordInput } from '../PasswordInput';

describe('PasswordInput', () => {
  it('starts masked and toggles on Show click', async () => {
    const user = userEvent.setup();
    render(<PasswordInput label="Password" value="secret" onChange={() => {}} />);
    const input = screen.getByLabelText('Password') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: /show password/i }));
    expect(input).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: /hide password/i }));
    expect(input).toHaveAttribute('type', 'password');
  });

  it('shows error in place of hint', () => {
    render(<PasswordInput label="P" value="" onChange={() => {}} error="too short" hint="ignored" />);
    expect(screen.getByText(/too short/)).toBeInTheDocument();
    expect(screen.queryByText('ignored')).not.toBeInTheDocument();
  });

  it('shows hint when no error', () => {
    render(<PasswordInput label="P" value="" onChange={() => {}} hint="hint text" />);
    expect(screen.getByText('hint text')).toBeInTheDocument();
  });

  it('renders rightLabel slot', () => {
    render(<PasswordInput label="P" value="" onChange={() => {}} rightLabel={<a>forgot</a>} />);
    expect(screen.getByText('forgot')).toBeInTheDocument();
  });
});
