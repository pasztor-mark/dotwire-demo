/**
 * Link detection for every piece of user-typed text: room names (app/api/rooms) and chat
 * messages (the dotwire presend webhook, lib/dotwire.ts).
 *
 * Policy: over-block. Anything domain-shaped is rejected, in any script, so `Node.js`,
 * `hello.world` and `привет.как` fail on purpose — for a public demo a false positive costs a
 * retype, a false negative is a spam hole.
 *
 * Normalization folds every trick that renders like a plain domain: compatibility forms
 * (full-width), invisible characters (format chars, default-ignorables such as the combining
 * grapheme joiner and variation selectors), combining marks, and dot look-alikes. Labels match
 * any letter or digit (\p{L}\p{N}), so Cyrillic homoglyphs and IDNs are caught too. Boundaries
 * are lookarounds, not \b — `_` is a word character, so `\b` let "_example.com" through.
 *
 * Spacing: whitespace is only collapsed where obfuscation puts it — on both sides of a dot or @
 * ("example . com"), before a dot ("example .com"), or inside "://". A dot followed by a space
 * alone is ordinary punctuation ("Hello. How are you") and is left alone; collapsing it would
 * turn every second sentence into a domain.
 *
 * Known limitations: "example. com" (space only after the dot) reads exactly like sentence
 * punctuation and gets through; so do spellings without any separator. " dot " between two
 * words is always treated as a dot, so "polka dot dress" is rejected. "。" is a real IDNA label
 * separator, so CJK sentences where it's followed directly by more text ("你好。今天") are
 * rejected too.
 */

const DOT_LOOKALIKES = /[。．｡․‧·∙⋅]/g;

export function normalizeForLinkCheck(text: string): string {
  return (
    text
      .normalize("NFKC")
      // Invisible characters vanish; control chars (newlines, tabs) become spaces so
      // "Thanks.\nSee you" doesn't glue into "thanks.see".
      .replace(/[\p{Cf}\p{Default_Ignorable_Code_Point}]/gu, "")
      .replace(/\p{Cc}/gu, " ")
      // Decompose and drop combining marks: "c͏om", "é" → "com", "e".
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(DOT_LOOKALIKES, ".")
      .replace(/[[({]\s*(\.|dot)\s*[\])}]/g, " . ")
      .replace(/\s+dot\s+/g, " . ")
      .replace(/\s+([.@])\s+/g, "$1")
      .replace(/\s+\.(?=[\p{L}\p{N}])/gu, ".")
      .replace(/\s*:\s*\/\s*\//g, "://")
  );
}

const PATTERNS = [
  /:\/\//,
  /(?<![\p{L}\p{N}])(mailto|javascript|data|tel|sms|file):/u,
  /(?<![\p{L}\p{N}])www\./u,
  /(?<![\p{L}\p{N}-])[\p{L}\p{N}-]+(\.[\p{L}\p{N}-]+)*\.\p{L}{2,}/u,
  /(?<!\d)\d{1,3}(\.\d{1,3}){3}(?!\d)/,
  /\S+@\S+\.\S+/,
  /(?<![\p{L}\p{N}])localhost/u,
];

export function containsLink(text: string): boolean {
  const normalized = normalizeForLinkCheck(text);
  return PATTERNS.some((pattern) => pattern.test(normalized));
}

/*
 * Hand traces (input → normalized → first matching pattern). No test suite by project decision;
 * re-trace these when editing the rules.
 *
 * Rejected:
 *   "ｗｗｗ．ｅｘａｍｐｌｅ．ｃｏｍ"  → "www.example.com"        → www.
 *   "exa​mple.com"            → "example.com"            → domain-like
 *   "example.c͏om"            → "example.com"            → domain-like (CGJ is default-ignorable)
 *   "ехаmрlе.соm" (Cyrillic е,х,а,р,о,с) → unchanged letters   → domain-like (\p{L} labels)
 *   "_example.com", "example.com_", "visit_example.com"        → domain-like (lookbehind, no \b)
 *   "example[.]com"                → "example . com"→"example.com"  → domain-like
 *   "example (dot) com"            → "example  .  com"→"example.com" → domain-like
 *   "example dot com"              → "example . com"→"example.com"   → domain-like
 *   "example . com"                → "example.com"            → domain-like
 *   "example .com"                 → "example.com"            → domain-like
 *   "HTTPS : //x.y"                → "https://x.y"            → ://
 *   "javascript:alert(1)"          → unchanged                → javascript:
 *   "192.168.0.1", "_1.2.3.4"      → unchanged                → IPv4
 *   "a @ b.co"                     → "a@b.co"                 → domain-like (b.co)
 *   "localhost:3000"               → unchanged                → localhost
 * Allowed:
 *   "Hello. How are you?"  → "hello. how are you?" — "." followed by space, not collapsed
 *   "Thanks.\nSee you"     → "thanks. see you"     — newline becomes a space, same as above
 *   "Café ok. Szia!"       → "cafe ok. szia!"      — marks dropped; "." followed by space
 *   "wait...what"          → unchanged     — no label between the dots
 *   "e.g. this"            → "e.g. this"   — "e.g" has a 1-letter TLD
 *   "i.e. no"              → "i.e. no"     — same
 *   "version 3.5"          → unchanged     — TLD needs letters; IPv4 needs 4 groups
 *   "ok."                  → unchanged     — nothing after the dot
 *   "see you at 5:30"      → unchanged     — no "://", no listed scheme word before ":"
 *   "hello there"          → unchanged
 */
