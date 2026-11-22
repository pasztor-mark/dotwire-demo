import "server-only";
import { processSingleton } from "./globalState";

export type RoomRecord = { name: string; code: string; createdBy: string };

// In-memory on purpose: it dies with the Machine, together with the database (spec §9). Any
// longrun crash halts the container, so this state can never outlive or predate dotwire's.
export const store = processSingleton("store", () => ({
  users: new Set<string>(),
  rooms: new Map<string, RoomRecord>(),
  codes: new Map<string, string>(),
}));

export function roomsCreatedBy(username: string): number {
  let count = 0;
  for (const room of store.rooms.values()) if (room.createdBy === username) count++;
  return count;
}
