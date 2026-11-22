// Every numeric limit in one place (spec §7–§10). The README's "Limits" section mirrors this file.

export const CAPS = {
  MAX_USERS: 500,
  MAX_ROOMS: 200,
  MAX_ROOMS_PER_USER: 3,
  MAX_MEMBERS_PER_ROOM: 20,
  MAX_MESSAGE_LEN: 500,
  ROOM_NAME_MIN: 1,
  ROOM_NAME_MAX: 40,
  FORM_MIN_MS: 1500,
  FORM_MAX_MS: 1_800_000,
  TOKEN_TTL: "10m",
} as const;

export const LIMITS = {
  sessionPerIp: { capacity: 5, windowMs: 600_000 },
  tokenPerSession: { capacity: 30, windowMs: 60_000 },
  joinPerSession: { capacity: 10, windowMs: 60_000 },
  joinPerIp: { capacity: 20, windowMs: 600_000 },
  roomCreatePerSession: { capacity: 5, windowMs: 600_000 },
} as const;

export type LimitName = keyof typeof LIMITS;
