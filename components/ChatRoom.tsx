"use client";

import { DotwireProvider, useConnectionState, useRoom, type ConnectionState } from "@dotwire/react";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { getJson } from "@/lib/clientApi";
import { DOTWIRE_OPTIONS } from "@/lib/dotwireClientOptions";
import { useMetrics } from "@/lib/useMetrics";
import { Composer } from "./Composer";
import { InviteCode } from "./InviteCode";
import { MemberList } from "./MemberList";
import { MessageList } from "./MessageList";
import { MetricsPanel } from "./MetricsPanel";

type Props = { roomId: string; name: string; code?: string; username: string };

export function ChatRoom(props: Props) {
  return (
    <DotwireProvider options={DOTWIRE_OPTIONS}>
      <RoomView {...props} />
    </DotwireProvider>
  );
}

const STATE_DOT: Record<ConnectionState, string> = {
  connected: "bg-online",
  connecting: "bg-yellow-500",
  reconnecting: "bg-yellow-500",
  disconnecting: "bg-muted",
  disconnected: "bg-danger",
};

function RoomView({ roomId, name, code, username }: Props) {
  const connection = useConnectionState();
  const room = useRoom(roomId, { history: 50 });
  const health = useConnectionHealth(connection, room.status);
  const metrics = useMetrics(health === "ok");
  const [lastSentAt, setLastSentAt] = useState<number | null>(null);
  const [metricsOpen, setMetricsOpen] = useState(false);

  if (health === "lost") {
    return (
      <Notice>
        Connection lost.{" "}
        <button type="button" onClick={() => location.reload()} className="chip-link">
          Reload
        </button>
      </Notice>
    );
  }
  if (health === "restarted") {
    return (
      <Notice>
        The demo restarted and its data was wiped.{" "}
        <Link href="/" className="chip-link">
          Start again
        </Link>
      </Notice>
    );
  }
  if (room.status === "revoked") {
    return (
      <Notice>
        You&apos;re no longer a member of this room.{" "}
        <Link href="/" className="chip-link">
          Back to your rooms
        </Link>
      </Notice>
    );
  }

  return (
    <main className="glass mx-auto flex h-[calc(100dvh-14rem)] min-h-[28rem] w-full max-w-7xl flex-col p-4 sm:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="chip-link">
            ← Rooms
          </Link>
          <h1 className="title-card normal-case">{name}</h1>
          <span className={`h-3 w-3 shrink-0 rounded-full ${STATE_DOT[connection]}`} title={connection} />
        </div>
        {code && <InviteCode code={code} />}
      </header>
      <div className="flex min-h-0 flex-1 gap-4 pt-4">
        <div className="flex min-w-0 flex-1 flex-col">
          <MessageList roomId={roomId} room={room} username={username} />
          <div className="lg:hidden">
            <button
              type="button"
              aria-expanded={metricsOpen}
              onClick={() => setMetricsOpen((o) => !o)}
              className="chip mb-3"
            >
              Metrics
            </button>
            {metricsOpen && (
              <div className="max-h-48 overflow-y-auto">
                <MetricsPanel
                  compact
                  points={metrics.points}
                  receivedAt={metrics.receivedAt}
                  lastSentAt={lastSentAt}
                />
              </div>
            )}
          </div>
          <Composer roomId={roomId} onSent={() => setLastSentAt(Date.now())} />
        </div>
        <MemberList roomId={roomId} username={username} />
        <aside className="tint hidden w-64 shrink-0 flex-col gap-3 overflow-y-auto p-5 lg:flex">
          <h2 className="text-lg font-extrabold">Live metrics</h2>
          <MetricsPanel points={metrics.points} receivedAt={metrics.receivedAt} lastSentAt={lastSentAt} />
        </aside>
      </div>
    </main>
  );
}

type Health = "ok" | "restarted" | "lost";

const FIRST_RETRY_MS = 5_000;
const MAX_RETRY_MS = 30_000;
const GIVE_UP_MS = 120_000;

/**
 * After a scale-to-zero cycle the cookie no longer verifies, so the token endpoint 401s and the
 * client can never reconnect. Once we've been connected, any drop (or a room error) starts a
 * session check:
 *   - 401 → "restarted" (the demo was wiped), terminal.
 *   - valid session but the room errored, or still down after GIVE_UP_MS → "lost" (offer reload).
 * Checks back off, run only while the tab is visible, and stop for good once a verdict is in, so
 * a forgotten tab can't keep the Machine awake (or wake it again).
 */
function useConnectionHealth(connection: ConnectionState, status: string): Health {
  const [health, setHealth] = useState<Health>("ok");
  const wasConnected = useRef(false);
  const terminal = useRef(false);

  useEffect(() => {
    if (connection === "connected") wasConnected.current = true;
    const dropped = wasConnected.current && (connection === "reconnecting" || connection === "disconnected");
    const errored = status === "error";
    if (terminal.current) return;
    if (!dropped && !errored) {
      setHealth("ok");
      return;
    }

    let cancelled = false;
    let inFlight = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let delay = FIRST_RETRY_MS;
    const startedAt = Date.now();

    const settle = (verdict: Exclude<Health, "ok">) => {
      if (verdict === "restarted") terminal.current = true;
      setHealth(verdict);
    };

    const check = async () => {
      if (cancelled || inFlight || document.visibilityState !== "visible") return;
      inFlight = true;
      const res = await getJson("/api/session");
      inFlight = false;
      if (cancelled) return;
      if (!res.ok && res.status === 401) return settle("restarted");
      if (res.ok && errored) return settle("lost");
      if (Date.now() - startedAt > GIVE_UP_MS) return settle("lost");
      timer = setTimeout(() => void check(), delay);
      delay = Math.min(delay * 2, MAX_RETRY_MS);
    };

    // Hidden tabs pause (check() returns without rescheduling); becoming visible resumes.
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
  }, [connection, status]);

  return health;
}

function Notice({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 items-center justify-center px-4 py-20">
      <p className="glass glass-column flex-row flex-wrap items-center justify-center gap-3 text-center text-lg">
        {children}
      </p>
    </main>
  );
}
