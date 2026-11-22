"use client";

import { useRef, useState } from "react";

export function InviteCode({ code }: { code: string }) {
  const codeEl = useRef<HTMLElement>(null);
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  async function copy(what: "code" | "link") {
    try {
      await navigator.clipboard.writeText(what === "link" ? `${window.location.origin}/#join=${code}` : code);
      setCopied(what);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      // Clipboard API unavailable (permissions, insecure context): select it for a manual copy.
      const el = codeEl.current;
      if (el) window.getSelection()?.selectAllChildren(el);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-muted">Share this code — anyone with it can join:</span>
      <code ref={codeEl} className="chip-sm font-mono tracking-wider text-foreground normal-case">
        {code}
      </code>
      <button type="button" onClick={() => void copy("code")} className="chip">
        {copied === "code" ? "Copied" : "Copy"}
      </button>
      <button type="button" onClick={() => void copy("link")} className="chip">
        {copied === "link" ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
