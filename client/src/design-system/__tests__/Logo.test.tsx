import { render, screen } from '@testing-library/react';
import { Logo } from '../Logo';
import { SignaPayLogo } from '../SignaPayLogo';

describe('Logo', () => {
  it('renders SIGNA and PAY', () => {
    render(<Logo />);
    expect(screen.getByLabelText('SignaPay')).toBeInTheDocument();
    expect(screen.getByText('SIGNA')).toBeInTheDocument();
    expect(screen.getByText('PAY')).toBeInTheDocument();
    expect(screen.getByText('Card Processor')).toBeInTheDocument();
  });

  it('hides subtitle when showSubtitle is false', () => {
    render(<Logo showSubtitle={false} />);
    expect(screen.queryByText('Card Processor')).not.toBeInTheDocument();
  });

  it.each(['sm', 'md', 'lg'] as const)('renders %s size', (size) => {
    render(<Logo size={size} />);
    expect(screen.getByLabelText('SignaPay')).toBeInTheDocument();
  });

  it('renders dark variant', () => {
    render(<Logo dark />);
    expect(screen.getByText('SIGNA')).toBeInTheDocument();
  });
});

describe('SignaPayLogo', () => {
  it('renders inline svg wordmark and subtitle by default', () => {
    render(<SignaPayLogo />);
    expect(screen.getByRole('img', { name: 'SignaPay' })).toBeInTheDocument();
    expect(screen.getByText('Card Processor')).toBeInTheDocument();
  });

  it('hides subtitle when showSubtitle=false', () => {
    render(<SignaPayLogo showSubtitle={false} />);
    expect(screen.queryByText('Card Processor')).not.toBeInTheDocument();
  });

  it.each(['sm', 'md', 'lg'] as const)('renders %s size', (size) => {
    render(<SignaPayLogo size={size} />);
    expect(screen.getByRole('img', { name: 'SignaPay' })).toBeInTheDocument();
  });

  it('supports dark variant', () => {
    render(<SignaPayLogo dark />);
    expect(screen.getByRole('img', { name: 'SignaPay' })).toBeInTheDocument();
  });
});
