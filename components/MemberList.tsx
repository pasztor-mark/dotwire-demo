"use client";

import { usePresence } from "@dotwire/react";
import { useEffect, useState } from "react";
import { useRoomHandle } from "@/lib/useRoomHandle";

export function MemberList({ roomId, username }: { roomId: string; username: string }) {
  const handle = useRoomHandle(roomId);
  const { present } = usePresence(roomId);
  const [members, setMembers] = useState<string[]>([]);

  // Membership changes when someone joins by code, which also shows up as a presence delta, so
  // refetching on presence changes keeps the list current without polling.
  const presentKey = present.join(",");
  useEffect(() => {
    if (!handle) return;
    let cancelled = false;
    handle
      .getParticipants()
      .then((ids) => !cancelled && setMembers(ids))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [handle, presentKey]);

  return (
    <aside className="tint hidden w-56 shrink-0 flex-col gap-3 overflow-y-auto p-5 sm:flex">
      <h2 className="text-lg font-extrabold">Members</h2>
      <ul className="flex flex-col gap-1.5 text-sm">
        {members.map((id) => (
          <li key={id} className="flex items-center gap-2 truncate font-mono">
            <span
              className={`h-2 w-2 shrink-0 rounded-full ${present.includes(id) || id === username ? "bg-online" : "bg-border"}`}
            />
            {id === username ? `${id} (you)` : id}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted">Online status fills in as people come and go.</p>
    </aside>
  );
}
