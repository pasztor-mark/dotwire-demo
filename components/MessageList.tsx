"use client";

import { useTyping, type UseRoomResult } from "@dotwire/react";
import { useEffect, useLayoutEffect, useRef } from "react";

const timeFormat = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit" });

type Props = { roomId: string; room: UseRoomResult; username: string };

export function MessageList({ roomId, room, username }: Props) {
  const { messages, hasMore, loadOlder, status } = room;
  const { typingUsers } = useTyping(roomId);
  const scroller = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const lastSeq = messages.at(-1)?.seq;

  // Follow new messages only if the reader is already at the bottom; loading older pages or
  // scrolling back through history must not yank the view.
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el && nearBottom.current) el.scrollTop = el.scrollHeight;
  }, [lastSeq]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const onScroll = () => {
      nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const others = typingUsers.filter((u) => u !== username);

  return (
    <>
      <div ref={scroller} className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-1">
        {hasMore && (
          <button type="button" onClick={() => void loadOlder()} className="chip-sm self-center">
            Load older
          </button>
        )}
        {status === "connecting" && <p className="text-muted">Connecting…</p>}
        {status === "ready" && messages.length === 0 && <p className="text-muted">No messages yet. Say hi!</p>}
        {messages.map((m) => {
          const mine = m.senderId === username;
          return (
            <div key={m.seq} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <span className="px-3 text-sm text-muted">
                {mine ? "you" : m.senderId} · {timeFormat.format(new Date(m.time))}
              </span>
              {/* Plain text only: React escapes it, nothing is linkified or rendered as HTML. */}
              <p
                className={`max-w-[80%] whitespace-pre-wrap break-words rounded-3xl px-4 py-2.5 text-lg normal-case shadow-[inset_0_1px_0_var(--hl)] ${
                  mine ? "bg-accent font-semibold text-accent-foreground" : "bg-surface"
                }`}
              >
                {m.content}
              </p>
            </div>
          );
        })}
      </div>
      <p className="h-6 px-3 text-sm text-muted" aria-live="polite">
        {others.length === 1 && `${others[0]} is typing…`}
        {others.length > 1 && `${others.length} people are typing…`}
      </p>
    </>
  );
}
