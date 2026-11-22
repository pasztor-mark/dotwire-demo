import type { HistogramPoint, Metric } from "./otlp";

export type Hist = { count: number; bounds: number[]; buckets: number[] };
export type Totals = { send: Hist | null; fanout: Hist | null; cpuSeconds: number; connections: number; workingSetBytes: number };
export type MetricsPoint = {
  t: number; rate: number; sendP50: number | null; sendP99: number | null; fanoutP99: number | null;
  connections: number; cpu: number; memoryMb: number;
};
export type MetricsSnapshot = { intervalMs: number; points: MetricsPoint[] };
export type MetricsState = { prev: { totals: Totals; at: number } | null; points: MetricsPoint[] };

export const INTERVAL_MS = 5000;
export const MAX_POINTS = 60;

function histPoints(metrics: Metric[], name: string): HistogramPoint[] {
  const out: HistogramPoint[] = [];
  for (const m of metrics) if (m.name === name && m.kind === "histogram") out.push(...m.points);
  return out;
}

function numSum(metrics: Metric[], name: string): number {
  let sum = 0;
  for (const m of metrics) if (m.name === name && m.kind !== "histogram") for (const p of m.points) sum += p.value;
  return sum;
}

function sumHist(points: HistogramPoint[]): Hist | null {
  if (points.length === 0) return null;
  const buckets: number[] = [];
  let count = 0;
  for (const p of points) {
    count += p.count;
    p.buckets.forEach((b, i) => {
      buckets[i] = (buckets[i] ?? 0) + b;
    });
  }
  return { count, bounds: points[0].bounds, buckets };
}

export function readTotals(metrics: Metric[]): Totals {
  return {
    send: sumHist(histPoints(metrics, "dotwire.message.send.duration").filter((p) => p.attrs.outcome === "accepted")),
    fanout: sumHist(histPoints(metrics, "dotwire.fanout.lag")),
    cpuSeconds: numSum(metrics, "dotnet.process.cpu.time"),
    connections: numSum(metrics, "signalr.server.active_connections"),
    workingSetBytes: numSum(metrics, "dotnet.process.memory.working_set"),
  };
}

export function percentile(bounds: number[], buckets: number[], q: number): number | null {
  const total = buckets.reduce((a, b) => a + b, 0);
  if (total === 0 || bounds.length === 0) return null;
  const rank = Math.ceil(q * total);
  let before = 0;
  for (let i = 0; i < buckets.length; i++) {
    if (buckets[i] > 0 && before + buckets[i] >= rank) {
      if (i === bounds.length) return bounds[bounds.length - 1];
      const lower = i === 0 ? 0 : bounds[i - 1];
      const upper = bounds[i];
      return lower + ((upper - lower) * (rank - before)) / buckets[i];
    }
    before += buckets[i];
  }
  return null;
}

function deltaHist(prev: Hist | null, curr: Hist | null): Hist | null {
  if (!curr) return null;
  if (!prev || curr.count < prev.count) return curr;
  return {
    count: curr.count - prev.count,
    bounds: curr.bounds,
    buckets: curr.buckets.map((b, i) => b - (prev.buckets[i] ?? 0)),
  };
}

function percentileMs(h: Hist | null, q: number): number | null {
  if (!h) return null;
  const v = percentile(h.bounds, h.buckets, q);
  return v === null ? null : v * 1000;
}

export function toPoint(prev: Totals, curr: Totals, dtMs: number, t: number): MetricsPoint {
  const secs = dtMs / 1000;
  const dSend = deltaHist(prev.send, curr.send);
  const dFanout = deltaHist(prev.fanout, curr.fanout);
  const dCpu = curr.cpuSeconds - prev.cpuSeconds;
  const cpuDelta = dCpu < 0 ? curr.cpuSeconds : dCpu;
  return {
    t,
    rate: secs > 0 && dSend ? dSend.count / secs : 0,
    sendP50: percentileMs(dSend, 0.5),
    sendP99: percentileMs(dSend, 0.99),
    fanoutP99: percentileMs(dFanout, 0.99),
    connections: curr.connections,
    cpu: secs > 0 ? (Math.max(0, cpuDelta) / secs) * 100 : 0,
    memoryMb: curr.workingSetBytes / 2 ** 20,
  };
}

export function ingestInto(state: MetricsState, metrics: Metric[], now: number): void {
  if (!metrics.some((m) => m.name === "dotnet.process.memory.working_set")) return;
  const totals = readTotals(metrics);
  if (state.prev) {
    state.points.push(toPoint(state.prev.totals, totals, now - state.prev.at, now));
    if (state.points.length > MAX_POINTS) state.points.splice(0, state.points.length - MAX_POINTS);
  }
  state.prev = { totals, at: now };
}
