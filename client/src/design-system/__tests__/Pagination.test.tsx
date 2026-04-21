import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Pagination } from '../Pagination';

describe('Pagination', () => {
  it('renders nothing when totalPages < 2', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={() => {}} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all pages for small totals', () => {
    render(<Pagination page={2} totalPages={5} onPageChange={() => {}} />);
    // Page buttons expose their number as the accessible name.
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
  });

  it('collapses middle pages with ellipses for large totals', () => {
    render(<Pagination page={10} totalPages={50} onPageChange={() => {}} />);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '50' })).toBeInTheDocument();
    // Middle pages around the current page are rendered...
    expect(screen.getByRole('button', { name: '10', current: 'page' })).toBeInTheDocument();
    // ...and distant pages are elided.
    expect(screen.queryByRole('button', { name: '25' })).not.toBeInTheDocument();
  });

  it('fires onPageChange when a page is clicked', async () => {
    const user = userEvent.setup();
    const fn = jest.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={fn} />);
    await user.click(screen.getByRole('button', { name: '3' }));
    expect(fn).toHaveBeenCalledWith(3);
  });

  it('first/last/prev/next buttons work at boundaries', async () => {
    const user = userEvent.setup();
    const fn = jest.fn();
    render(<Pagination page={3} totalPages={10} onPageChange={fn} />);
    await user.click(screen.getByRole('button', { name: /previous page/i }));
    expect(fn).toHaveBeenCalledWith(2);
    await user.click(screen.getByRole('button', { name: /next page/i }));
    expect(fn).toHaveBeenCalledWith(4);
    await user.click(screen.getByRole('button', { name: /first page/i }));
    expect(fn).toHaveBeenCalledWith(1);
    await user.click(screen.getByRole('button', { name: /last page/i }));
    expect(fn).toHaveBeenCalledWith(10);
  });
});
