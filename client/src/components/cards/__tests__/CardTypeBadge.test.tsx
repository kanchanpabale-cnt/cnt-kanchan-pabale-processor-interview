import { render, screen } from '@testing-library/react';
import { CardTypeBadge } from '../CardTypeBadge';

describe('CardTypeBadge', () => {
  it('shows dash when type is null', () => {
    render(<CardTypeBadge type={null} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows brand icon + label by default', () => {
    render(<CardTypeBadge type="VISA" />);
    expect(screen.getByText('Visa')).toBeInTheDocument();
  });

  it('hides label when compact', () => {
    render(<CardTypeBadge type="VISA" compact />);
    expect(screen.queryByText('Visa')).not.toBeInTheDocument();
  });
});
