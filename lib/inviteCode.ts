import "server-only";
import { randomInt } from "node:crypto";

// Crockford base32: no I, L, O, U, so codes survive being read aloud or retyped.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const LENGTH = 8; // 32^8 ≈ 2^40

export function generateCode(taken: Map<string, string>): string {
  let code: string;
  do {
    code = "";
    for (let i = 0; i < LENGTH; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  } while (taken.has(code));
  return code;
}

/** Case-insensitive; ignores hyphens and whitespace; maps look-alikes O→0 and I/L→1. */
export function normalizeCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
}

export function formatCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
