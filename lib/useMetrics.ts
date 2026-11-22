"use client";

import { getJson } from "@/lib/clientApi";
import type { MetricsPoint, MetricsSnapshot } from "@/lib/metricsSeries";
import { useEffect, useRef, useState } from "react";

const POLL_MS = 5_000;

export function useMetrics(enabled: boolean): { points: MetricsPoint[] | null; receivedAt: number | null } {
  const [points, setPoints] = useState<MetricsPoint[] | null>(null);
  const [receivedAt, setReceivedAt] = useState<number | null>(null);
  const newestT = useRef<number | undefined>(undefined);
  const unauthorized = useRef(false);

  useEffect(() => {
    if (!enabled || unauthorized.current) return;
    let cancelled = false;
    let inFlight = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const check = async () => {
      if (cancelled || inFlight || unauthorized.current || document.visibilityState !== "visible") return;
      inFlight = true;
      const res = await getJson<MetricsSnapshot>("/api/metrics");
      inFlight = false;
      if (cancelled) return;
      if (!res.ok && res.status === 401) {
        unauthorized.current = true;
        return;
      }
      if (res.ok) {
        const newest = res.data.points.at(-1)?.t;
        setPoints(res.data.points);
        if (newest !== undefined && newest !== newestT.current) {
          newestT.current = newest;
          setReceivedAt(Date.now());
        }
      }
      timer = setTimeout(() => void check(), POLL_MS);
    };

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      clearTimeout(timer);
      void check();
    };
    document.addEventListener("visibilitychange", onVisibility);
    void check();

    return () => {
      cancelled = true;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled]);

  return { points, receivedAt };
}
