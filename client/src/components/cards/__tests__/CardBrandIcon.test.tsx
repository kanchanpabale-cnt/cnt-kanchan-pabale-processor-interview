import { render } from '@testing-library/react';
import { CardBrandIcon } from '../CardBrandIcon';

describe('CardBrandIcon', () => {
  it('renders nothing when type is null', () => {
    const { container } = render(<CardBrandIcon type={null} />);
    expect(container.firstChild).toBeNull();
  });

  it.each(['AMEX', 'VISA', 'MASTERCARD', 'DISCOVER'] as const)('renders %s brand mark', (type) => {
    const { container } = render(<CardBrandIcon type={type} />);
    expect(container.querySelector('svg')).toBeTruthy();
  });
});
