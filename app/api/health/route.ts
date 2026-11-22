// Static on purpose: if the server answers at all, Next is up (the boot script's readiness probe).
export function GET() {
  return Response.json({ ok: true });
}
