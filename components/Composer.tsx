"use client";

import { DotwireClientError } from "@dotwire/client";
import { useTyping } from "@dotwire/react";
import { useState, type FormEvent, type KeyboardEvent } from "react";
import { useRoomHandle } from "@/lib/useRoomHandle";

const MAX_LEN = 500; // mirrors CAPS.MAX_MESSAGE_LEN; presend enforces it server-side

const PRESEND_MESSAGES: Record<string, string> = {
  links_not_allowed: "Links aren't allowed in this demo.",
  too_long: `Messages are limited to ${MAX_LEN} characters.`,
};

function sendErrorMessage(err: unknown): string | null {
  if (err instanceof DotwireClientError) {
    if (err.kind === "PresendRejected") {
      if (err.reason === "empty") return null;
      return (err.reason && PRESEND_MESSAGES[err.reason]) || "Message rejected.";
    }
    if (err.status === 429) return "Slow down a little.";
  }
  return "Couldn't send, try again.";
}

export function Composer({ roomId, onSent }: { roomId: string; onSent?: () => void }) {
  const handle = useRoomHandle(roomId);
  const { notifyTyping, stopTyping } = useTyping(roomId);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  async function send() {
    const content = text.trim();
    if (!content || !handle || sending) return;
    setSending(true);
    setError(null);
    void stopTyping();
    try {
      // Straight through the client, not useRoom().send: a rejected send must not flip the whole
      // room into its error state.
      await handle.sendMessage(content);
      onSent?.();
      setText("");
    } catch (err) {
      setError(sendErrorMessage(err));
    } finally {
      setSending(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send();
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-1 border-t border-border pt-4">
      <div className="flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            void notifyTyping();
          }}
          onKeyDown={onKeyDown}
          onBlur={() => void stopTyping()}
          maxLength={MAX_LEN}
          rows={2}
          placeholder="Write a message — Enter to send, Shift+Enter for a new line"
          aria-label="Message"
          className="field field-area min-w-0 flex-1 resize-none text-lg normal-case"
        />
        <button type="submit" disabled={!handle || sending || text.trim() === ""} className="btn-accent">
          Send
        </button>
      </div>
      <div className="flex justify-between px-[22px] text-sm">
        <span role="alert" className="text-danger">
          {error}
        </span>
        <span className="text-muted">
          {text.length}/{MAX_LEN}
        </span>
      </div>
    </form>
  );
}
