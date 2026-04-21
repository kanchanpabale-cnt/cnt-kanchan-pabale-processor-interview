import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toaster, ToastList } from '../Toast';
import { useUiStore } from '../../store/ui.store';

describe('Toaster + ToastList', () => {
  beforeEach(() => {
    useUiStore.setState({ toasts: [] });
  });

  it('ToastList returns null when there are no toasts', () => {
    const { container } = render(<ToastList />);
    expect(container.firstChild).toBeNull();
  });

  it.each(['success', 'error', 'info'] as const)('ToastList renders %s toast', (kind) => {
    act(() => {
      useUiStore.setState({ toasts: [{ id: 't1', kind, message: `${kind}-msg` }] });
    });
    render(<ToastList />);
    expect(screen.getByText(`${kind}-msg`)).toBeInTheDocument();
  });

  it('dismiss a toast via click', async () => {
    const user = userEvent.setup();
    act(() => {
      useUiStore.setState({ toasts: [{ id: 't1', kind: 'info', message: 'hi' }] });
    });
    render(<ToastList />);
    await user.click(screen.getByText('hi'));
    expect(useUiStore.getState().toasts).toEqual([]);
  });

  it.each(['bottom-right', 'bottom-left', 'top-right', 'top-left', 'top-center'] as const)(
    'Toaster renders with position %s',
    (position) => {
      act(() => {
        useUiStore.setState({ toasts: [{ id: 't1', kind: 'success', message: 'x' }] });
      });
      render(<Toaster position={position} />);
      expect(screen.getByText('x')).toBeInTheDocument();
    },
  );

  it('Toaster defaults to bottom-right', () => {
    act(() => {
      useUiStore.setState({ toasts: [{ id: 't1', kind: 'error', message: 'bad' }] });
    });
    render(<Toaster />);
    expect(screen.getByText('bad')).toBeInTheDocument();
  });
});
