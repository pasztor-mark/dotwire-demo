"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { guardFields, postJson } from "@/lib/clientApi";
import { FormError } from "./FormError";
import { Honeypot } from "./Honeypot";

export function CreateRoomForm({ ts, onSessionLost }: { ts: string; onSessionLost: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<{ message: string; expired: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = String(new FormData(e.currentTarget).get("name") ?? "");
    setBusy(true);
    setError(null);
    const res = await postJson<{ roomId?: string }>("/api/rooms", { name, ...guardFields(e.currentTarget, ts) });
    setBusy(false);
    if (res.ok) {
      if (res.data.roomId) router.push(`/rooms/${res.data.roomId}`);
      return;
    }
    if (res.status === 401) return onSessionLost();
    setError({ message: res.message, expired: res.status === 409 });
  }

  return (
    <form onSubmit={onSubmit} className="relative flex flex-col gap-2">
      <label htmlFor="room-name" className="field-label">
        Create a private room
      </label>
      <Honeypot />
      <div className="flex gap-2">
        <input
          id="room-name"
          name="name"
          required
          maxLength={40}
          placeholder="Room name"
          className="field min-w-0 flex-1 normal-case"
        />
        <button type="submit" disabled={busy} className="btn-accent">
          Create
        </button>
      </div>
      <FormError error={error} />
    </form>
  );
}
