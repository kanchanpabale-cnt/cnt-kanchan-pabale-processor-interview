import '@testing-library/jest-dom';

// JSDOM doesn't implement these — lots of components (Recharts, UploadDropzone, etc.) touch them.
if (!window.matchMedia) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverMock }).ResizeObserver =
  ResizeObserverMock;

/**
 * Silence two classes of console.warn noise that are environmental, not test failures:
 *
 *   1. React Router v6's "future flag" migration warnings — our production code
 *      doesn't need v7 flags yet; in tests they just pollute every router render.
 *
 *   2. Recharts' "width(0) and height(0) of chart should be greater than 0" warning —
 *      JSDOM has no layout engine, so <ResponsiveContainer> always sees 0x0.
 *      The chart *does* render into the DOM (our tests still assert on it), Recharts
 *      just logs a warning it can't measure the parent.
 *
 * All other warnings still surface.
 */
const SUPPRESSED_PATTERNS = [
  /React Router Future Flag Warning/,
  /width\(0\) and height\(0\) of chart should be greater than 0/,
];

const originalWarn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  const first = args[0];
  const msg = typeof first === 'string' ? first : first instanceof Error ? first.message : '';
  if (SUPPRESSED_PATTERNS.some((re) => re.test(msg))) return;
  originalWarn(...args);
};
