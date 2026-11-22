import { HONEYPOT_FIELD } from "@/lib/honeypot";

// Invisible to people and to assistive tech; naive bots fill every field they find.
export function Honeypot() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "absolute", left: "-10000px", width: 1, height: 1, overflow: "hidden" }}
    >
      <label>
        Extra details
        <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" defaultValue="" />
      </label>
    </div>
  );
}
