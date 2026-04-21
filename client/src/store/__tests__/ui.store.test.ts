import { act } from '@testing-library/react';
import { useUiStore } from '../ui.store';

describe('useUiStore', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    useUiStore.setState({ toasts: [] });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('starts with no toasts', () => {
    expect(useUiStore.getState().toasts).toEqual([]);
  });

  it('pushToast adds a toast with a unique id', () => {
    act(() => {
      useUiStore.getState().pushToast('success', 'A');
      useUiStore.getState().pushToast('error', 'B');
    });
    const t = useUiStore.getState().toasts;
    expect(t).toHaveLength(2);
    expect(t[0]).toMatchObject({ kind: 'success', message: 'A' });
    expect(t[1]).toMatchObject({ kind: 'error', message: 'B' });
    expect(t[0].id).not.toBe(t[1].id);
  });

  it('auto-dismisses a toast after 4s', () => {
    act(() => {
      useUiStore.getState().pushToast('info', 'bye');
    });
    expect(useUiStore.getState().toasts).toHaveLength(1);
    act(() => {
      jest.advanceTimersByTime(4000);
    });
    expect(useUiStore.getState().toasts).toEqual([]);
  });

  it('dismissToast removes the targeted toast only', () => {
    act(() => {
      useUiStore.getState().pushToast('success', 'A');
      useUiStore.getState().pushToast('success', 'B');
    });
    const [first, second] = useUiStore.getState().toasts;
    act(() => {
      useUiStore.getState().dismissToast(first.id);
    });
    expect(useUiStore.getState().toasts).toEqual([second]);
  });
});
