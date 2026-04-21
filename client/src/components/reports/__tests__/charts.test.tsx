import { render } from '@testing-library/react';
import { ByCardChart } from '../ByCardChart';
import { RejectedByReasonChart } from '../RejectedByReasonChart';

describe('ByCardChart', () => {
  it('renders with data', () => {
    const { container } = render(
      <ByCardChart
        rows={[
          {
            cardId: 'c1',
            maskedNumber: '**** **** **** 1111',
            last4: '1111',
            cardType: 'VISA',
            holderName: null,
            count: 3,
            total: '300.00',
          },
        ]}
      />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with empty data', () => {
    const { container } = render(<ByCardChart rows={[]} />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe('RejectedByReasonChart', () => {
  it('renders with data', () => {
    const { container } = render(
      <RejectedByReasonChart
        rows={[
          { reason: 'INVALID_AMOUNT', count: 5 },
          { reason: 'UNRECOGNIZED_TYPE', count: 3 },
        ]}
      />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('renders with empty data', () => {
    const { container } = render(<RejectedByReasonChart rows={[]} />);
    expect(container.firstChild).toBeTruthy();
  });
});
