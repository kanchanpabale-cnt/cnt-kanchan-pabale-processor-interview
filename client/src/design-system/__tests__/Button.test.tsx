import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Go</Button>);
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument();
  });

  it('disables itself while loading and renders a spinner', () => {
    render(<Button loading>Go</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(btn.querySelector('.animate-spin')).toBeTruthy();
  });

  it('honors disabled prop', () => {
    render(<Button disabled>Go</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('fires onClick', async () => {
    const user = userEvent.setup();
    const fn = jest.fn();
    render(<Button onClick={fn}>Go</Button>);
    await user.click(screen.getByRole('button'));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it.each(['primary', 'secondary', 'ghost', 'danger'] as const)('renders %s variant', (variant) => {
    render(<Button variant={variant}>{variant}</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it.each(['sm', 'md', 'lg'] as const)('renders %s size', (size) => {
    render(<Button size={size}>x</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
