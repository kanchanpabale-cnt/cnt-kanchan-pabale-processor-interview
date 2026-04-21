import type { NextFunction, Request, Response } from 'express';

/**
 * Lightweight in-memory request latency tracker.
 *
 * Records a ring buffer of recent response durations so `/api/public/showcase-stats`
 * can surface a real P95. Scope: this is a demo. In production, ship metrics to a
 * proper observability backend (Prometheus / Datadog / OpenTelemetry) instead of
 * a process-local buffer — this approach loses data on restart and can't be
 * aggregated across instances.
 */
const RING_SIZE = 500;
const MIN_SAMPLES = 10;

const ring: number[] = [];
let writeIdx = 0;

export function recordDuration(ms: number): void {
  if (ring.length < RING_SIZE) {
    ring.push(ms);
    return;
  }
  ring[writeIdx] = ms;
  writeIdx = (writeIdx + 1) % RING_SIZE;
}

export function getP95LatencyMs(): number | null {
  if (ring.length < MIN_SAMPLES) return null;
  const sorted = [...ring].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95));
  return sorted[idx];
}

export function getSampleCount(): number {
  return ring.length;
}

export function __resetTiming(): void {
  ring.length = 0;
  writeIdx = 0;
}

export function requestTiming(_req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();
  res.on('finish', () => {
    // Exclude 5xx — they represent failure modes, not normal request cost.
    if (res.statusCode < 500) recordDuration(Date.now() - start);
  });
  next();
}
