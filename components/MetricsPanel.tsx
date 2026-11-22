"use client";

import type { MetricsPoint } from "@/lib/metricsSeries";
import { useEffect, useState } from "react";

const PULSE_MS = 1_500;

type Props = { points: MetricsPoint[] | null; receivedAt: number | null; lastSentAt: number | null; compact?: boolean };

function fmt(v: number | null): string {
  if (v === null) return "—";
  return v < 10 ? v.toFixed(1) : String(Math.round(v));
}

function Sparkline({ values, compact }: { values: (number | null)[]; compact?: boolean }) {
  const nums = values.filter((v): v is number => v !== null);
  const max = Math.max(0, ...nums);
  const n = values.length;
  const x = (i: number) => (n === 1 ? 0 : (i / (n - 1)) * 100);
  const y = (v: number) => (max === 0 ? 24 : 24 - (v / max) * 22);

  const runs: string[] = [];
  let run: string[] = [];
  const flush = () => {
    if (run.length) runs.push((run.length === 1 ? [run[0], run[0]] : run).join(" "));
    run = [];
  };
  values.forEach((v, i) => {
    if (v === null) {
      flush();
      return;
    }
    run.push(`${x(i)},${y(v)}`);
  });
  flush();

  return (
    <svg
      viewBox="0 0 100 24"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`w-full ${compact ? "h-5" : "h-8"}`}
    >
      {runs.map((points, i) => (
        <polyline
          key={i}
          points={points}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={1.5}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

function Tile({
  label,
  value,
  sub,
  series,
  compact,
  ring,
}: {
  label: string;
  value: string;
  sub?: string;
  series: (number | null)[];
  compact?: boolean;
  ring?: boolean;
}) {
  return (
    <div
      className={`tint flex min-w-0 flex-col gap-1 p-3 motion-safe:transition ${ring ? "ring-2 ring-accent" : ""}`}
    >
      <span className="text-xs text-muted">{label}</span>
      <span className="font-mono text-xl font-bold">{value}</span>
      {sub && <span className="font-mono text-xs text-muted">{sub}</span>}
      <Sparkline values={series} compact={compact} />
    </div>
  );
}

export function MetricsPanel({ points, receivedAt, lastSentAt, compact }: Props) {
  const [pulseAt, setPulseAt] = useState<number | null>(null);
  const [pulsing, setPulsing] = useState(false);

  if (lastSentAt !== null && receivedAt !== null && receivedAt > lastSentAt && lastSentAt !== pulseAt && (points?.at(-1)?.rate ?? 0) > 0) {
    setPulseAt(lastSentAt);
    setPulsing(true);
  }

  useEffect(() => {
    if (!pulsing) return;
    const timer = setTimeout(() => setPulsing(false), PULSE_MS);
    return () => clearTimeout(timer);
  }, [pulseAt, pulsing]);

  if (!points || points.length < 2) {
    return <p className="text-sm text-muted">Waiting for the first numbers…</p>;
  }

  const last = points[points.length - 1];
  const grid = compact ? "grid grid-cols-2 gap-2 sm:grid-cols-3" : "flex flex-col gap-3";

  return (
    <div className="flex flex-col gap-3">
      <div className={grid}>
        <Tile
          label="Messages/s"
          value={last.rate.toFixed(1)}
          series={points.map((p) => p.rate)}
          compact={compact}
          ring={pulsing}
        />
        <Tile
          label="Send latency"
          value={`${fmt(last.sendP99)} ms`}
          sub={`p50 ${fmt(last.sendP50)} ms`}
          series={points.map((p) => p.sendP99)}
          compact={compact}
        />
        <Tile
          label="Fanout lag p99"
          value={`${fmt(last.fanoutP99)} ms`}
          series={points.map((p) => p.fanoutP99)}
          compact={compact}
        />
        <Tile
          label="Live connections"
          value={String(Math.round(last.connections))}
          series={points.map((p) => p.connections)}
          compact={compact}
        />
        <Tile label="CPU" value={`${fmt(last.cpu)}%`} series={points.map((p) => p.cpu)} compact={compact} />
        <Tile
          label="Memory"
          value={`${Math.round(last.memoryMb)} MB`}
          series={points.map((p) => p.memoryMb)}
          compact={compact}
        />
      </div>
      <p className="text-xs text-muted">Live from dotwire&apos;s OpenTelemetry metrics · last 5 min · whole demo</p>
    </div>
  );
}
