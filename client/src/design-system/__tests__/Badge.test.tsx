import { render, screen } from '@testing-library/react';
import { Badge } from '../Badge';

describe('Badge', () => {
  it.each([
    'neutral',
    'brand',
    'accent',
    'success',
    'danger',
    'amex',
    'visa',
    'mastercard',
    'discover',
  ] as const)('renders %s tone', (tone) => {
    render(<Badge tone={tone}>{tone}</Badge>);
    expect(screen.getByText(tone)).toBeInTheDocument();
  });

  it('defaults to neutral', () => {
    render(<Badge>x</Badge>);
    expect(screen.getByText('x')).toBeInTheDocument();
  });
});
