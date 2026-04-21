import { useCallback, useEffect, useRef, useState } from 'react';

export type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [state, setState] = useState<AsyncState<T>>({ status: 'idle' });
  const alive = useRef(true);

  const run = useCallback(() => {
    setState({ status: 'loading' });
    fn()
      .then((data) => {
        if (alive.current) setState({ status: 'success', data });
      })
      .catch((error: Error) => {
        if (alive.current) setState({ status: 'error', error });
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    alive.current = true;
    run();
    return () => {
      alive.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { state, refresh: run };
}
