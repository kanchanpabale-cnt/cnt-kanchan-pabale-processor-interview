import { render, screen, waitFor } from '@testing-library/react';

jest.mock('../../../actions/public.actions', () => ({
  fetchShowcaseStats: jest.fn(),
}));
import { fetchShowcaseStats } from '../../../actions/public.actions';
import { LoginShowcase } from '../LoginShowcase';

const mock = fetchShowcaseStats as jest.Mock;

beforeEach(() => {
  mock.mockReset();
});

describe('LoginShowcase', () => {
  it('renders KPI labels + placeholders while stats are loading', () => {
    mock.mockReturnValue(new Promise(() => {})); // never resolves
    render(<LoginShowcase />);
    expect(screen.getByText(/today across the network/i)).toBeInTheDocument();
    expect(screen.getByText(/authorized volume/i)).toBeInTheDocument();
    expect(screen.getByText(/approval rate/i)).toBeInTheDocument();
    expect(screen.getByText(/p95 auth latency/i)).toBeInTheDocument();
    // All three value slots should be em-dashes until the fetch resolves.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('renders dynamic numbers once stats resolve', async () => {
    mock.mockResolvedValue({
      authorizedVolume: '4820000.00',
      approvalRate: 98.3,
      p95LatencyMs: 120,
      transactionCount: 200,
    });
    render(<LoginShowcase />);
    await waitFor(() => expect(screen.getByText('$4.82M')).toBeInTheDocument());
    expect(screen.getByText('98.3%')).toBeInTheDocument();
    expect(screen.getByText('120ms')).toBeInTheDocument();
  });

  it('falls back to dashes when the fetch rejects', async () => {
    mock.mockRejectedValue(new Error('network'));
    render(<LoginShowcase />);
    // Wait a tick for the promise rejection to settle.
    await waitFor(() => expect(mock).toHaveBeenCalled());
    // All KPI values remain placeholder dashes.
    expect(screen.getAllByText('—').length).toBeGreaterThanOrEqual(3);
  });

  it('renders Approved + Declined callouts', () => {
    mock.mockReturnValue(new Promise(() => {}));
    render(<LoginShowcase />);
    expect(screen.getByText(/approved · 00:02s/i)).toBeInTheDocument();
    expect(screen.getByText(/declined · avs/i)).toBeInTheDocument();
  });
});
