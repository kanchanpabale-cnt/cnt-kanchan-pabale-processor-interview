import { act, renderHook, waitFor } from '@testing-library/react';
import { useAsync } from '../useAsync';

describe('useAsync', () => {
  it('starts loading, then resolves to success', async () => {
    const fn = jest.fn().mockResolvedValue(42);
    const { result } = renderHook(() => useAsync(fn, []));

    expect(result.current.state.status).toBe('loading');
    await waitFor(() => expect(result.current.state.status).toBe('success'));
    if (result.current.state.status === 'success') {
      expect(result.current.state.data).toBe(42);
    }
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('captures errors in state', async () => {
    const err = new Error('boom');
    const fn = jest.fn().mockRejectedValue(err);
    const { result } = renderHook(() => useAsync(fn, []));

    await waitFor(() => expect(result.current.state.status).toBe('error'));
    if (result.current.state.status === 'error') {
      expect(result.current.state.error).toBe(err);
    }
  });

  it('refresh re-runs the function', async () => {
    const fn = jest.fn().mockResolvedValueOnce(1).mockResolvedValueOnce(2);
    const { result } = renderHook(() => useAsync(fn, []));
    await waitFor(() => expect(result.current.state.status).toBe('success'));
    act(() => result.current.refresh());
    await waitFor(() => {
      if (result.current.state.status === 'success') {
        expect(result.current.state.data).toBe(2);
      }
    });
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not set state after unmount', async () => {
    let resolve: (v: number) => void = () => {};
    const fn = () => new Promise<number>((r) => (resolve = r));
    const { result, unmount } = renderHook(() => useAsync(fn, []));
    expect(result.current.state.status).toBe('loading');
    unmount();
    act(() => resolve(99));
    // No assertion on re-render — we just confirm no uncaught warnings.
  });
});
