import "server-only";
import { processSingleton } from "./globalState";
import { ingestInto, INTERVAL_MS, type MetricsSnapshot, type MetricsState } from "./metricsSeries";
import type { Metric } from "./otlp";

const state = processSingleton("metrics", () => ({ prev: null, points: [] }) as MetricsState);

export function ingest(metrics: Metric[], now: number = Date.now()): void {
  ingestInto(state, metrics, now);
}

export function snapshot(): MetricsSnapshot {
  return { intervalMs: INTERVAL_MS, points: [...state.points] };
}
