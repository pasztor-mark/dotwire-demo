"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { guardFields, postJson } from "@/lib/clientApi";
import { FormError } from "./FormError";
import { Honeypot } from "./Honeypot";

export function JoinRoomForm({ ts, onSessionLost }: { ts: string; onSessionLost: () => void }) {
  const router = useRouter();
  const [error, setError] = useState<{ message: string; expired: boolean } | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    setBusy(true);
    setError(null);
    const res = await postJson<{ roomId?: string }>("/api/rooms/join", { code, ...guardFields(e.currentTarget, ts) });
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
      <label htmlFor="invite-code" className="field-label">
        Join with an invite code
      </label>
      <Honeypot />
      <div className="flex gap-2">
        <input
          id="invite-code"
          name="code"
          required
          maxLength={11}
          placeholder="XXXX-XXXX"
          autoComplete="off"
          spellCheck={false}
          className="field min-w-0 flex-1 font-mono uppercase"
        />
        <button type="submit" disabled={busy} className="btn-light">
          Join
        </button>
      </div>
      <FormError error={error} />
    </form>
  );
}
