"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getJson } from "@/lib/clientApi";
import { CreateRoomForm } from "./CreateRoomForm";
import { JoinRoomForm } from "./JoinRoomForm";

type RoomSummary = { roomId: string; name: string; code?: string };

export function Lobby({ username, ts }: { username: string; ts: string }) {
  const router = useRouter();
  const [rooms, setRooms] = useState<RoomSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  // A 401 means the cookie no longer verifies (the demo restarted): re-render the server page,
  // which falls back to the entry form.
  const onSessionLost = useCallback(() => router.refresh(), [router]);

  useEffect(() => {
    let cancelled = false;
    void getJson<{ rooms: RoomSummary[] }>("/api/rooms").then((res) => {
      if (cancelled) return;
      if (res.ok) setRooms(res.data.rooms);
      else if (res.status === 401) onSessionLost();
      else setError(res.message);
    });
    return () => {
      cancelled = true;
    };
  }, [onSessionLost]);

  return (
    <section className="flex flex-col gap-8">
      <p className="text-lg text-ink2">
        You are <strong className="chip-sm font-mono text-foreground">{username}</strong>
      </p>

      <div className="flex flex-col gap-4">
        <h2 className="title-card">Your rooms</h2>
        {error && <p className="text-danger">{error}</p>}
        {rooms === null && !error && <p className="text-muted">Loading…</p>}
        {rooms?.length === 0 && (
          <p className="text-muted">No rooms yet — create one, or join with a code someone shared.</p>
        )}
        {rooms && rooms.length > 0 && (
          <ul className="flex flex-col gap-2">
            {rooms.map((room) => (
              <li key={room.roomId}>
                <Link
                  href={`/rooms/${room.roomId}`}
                  className="tint tint-hover flex items-center justify-between px-6 py-4"
                >
                  <span className="text-xl font-bold normal-case">{room.name}</span>
                  {room.code && <span className="font-mono text-muted normal-case">{room.code}</span>}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <CreateRoomForm ts={ts} onSessionLost={onSessionLost} />
        <JoinRoomForm ts={ts} onSessionLost={onSessionLost} />
      </div>
    </section>
  );
}
