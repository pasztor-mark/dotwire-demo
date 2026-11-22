import { ingest } from "@/lib/metrics";
import { decodeMetrics } from "@/lib/otlp";

export async function POST(req: Request) {
  let metrics;
  try {
    metrics = decodeMetrics(new Uint8Array(await req.arrayBuffer()));
  } catch {
    return new Response(null, { status: 400 });
  }
  ingest(metrics);
  return new Response(null, { status: 200, headers: { "Content-Type": "application/x-protobuf" } });
}
