export type Attrs = Record<string, string | number | boolean>;
export type NumberPoint = { attrs: Attrs; value: number };
export type HistogramPoint = { attrs: Attrs; count: number; bounds: number[]; buckets: number[] };
export type Metric =
  | { name: string; kind: "gauge" | "sum"; points: NumberPoint[] }
  | { name: string; kind: "histogram"; points: HistogramPoint[] };

type Field = { num: number; wire: number; v: bigint; data: Uint8Array };
type Reader = (dv: DataView, at: number) => number;

const EMPTY = new Uint8Array(0);
const ZERO = BigInt(0);
const KINDS: Record<number, "gauge" | "sum" | "histogram"> = { 5: "gauge", 7: "sum", 9: "histogram" };

function* fields(buf: Uint8Array): Generator<Field> {
  let p = 0;
  const varint = (): bigint => {
    let r = ZERO;
    for (let s = BigInt(0); ; s += BigInt(7)) {
      if (p >= buf.length || s > BigInt(63)) throw new Error("malformed varint");
      const b = buf[p++];
      r |= BigInt(b & 0x7f) << s;
      if (!(b & 0x80)) return r;
    }
  };
  const take = (n: number): Uint8Array => {
    if (p + n > buf.length) throw new Error("field runs past end of buffer");
    const data = buf.subarray(p, p + n);
    p += n;
    return data;
  };
  while (p < buf.length) {
    const tag = varint();
    const num = Number(tag >> BigInt(3));
    const wire = Number(tag & BigInt(7));
    if (wire === 0) yield { num, wire, v: varint(), data: EMPTY };
    else if (wire === 1) yield { num, wire, v: ZERO, data: take(8) };
    else if (wire === 2) {
      const n = Number(varint());
      yield { num, wire, v: ZERO, data: take(n) };
    } else if (wire === 5) take(4);
    else throw new Error(`unsupported wire type ${wire}`);
  }
}

const view = (d: Uint8Array) => new DataView(d.buffer, d.byteOffset, d.byteLength);
const str = (d: Uint8Array) => new TextDecoder().decode(d);
const F64: Reader = (dv, at) => dv.getFloat64(at, true);
const I64: Reader = (dv, at) => Number(dv.getBigInt64(at, true));
const U64: Reader = (dv, at) => Number(dv.getBigUint64(at, true));
const scalar = (d: Uint8Array, read: Reader) => read(view(d), 0);

function collect(f: Field, read: Reader, out: number[]) {
  if (f.data.length % 8 !== 0) throw new Error("fixed-width field length is not a multiple of 8");
  const dv = view(f.data);
  for (let i = 0; i < f.data.length; i += 8) out.push(read(dv, i));
}

function children(d: Uint8Array, num: number): Uint8Array[] {
  const out: Uint8Array[] = [];
  for (const f of fields(d)) if (f.num === num && f.wire === 2) out.push(f.data);
  return out;
}

function anyValue(d: Uint8Array): string | number | boolean | undefined {
  let value: string | number | boolean | undefined;
  for (const f of fields(d)) {
    if (f.num === 1 && f.wire === 2) value = str(f.data);
    else if (f.num === 2 && f.wire === 0) value = f.v !== ZERO;
    else if (f.num === 3 && f.wire === 0) value = Number(BigInt.asIntN(64, f.v));
    else if (f.num === 4 && f.wire === 1) value = scalar(f.data, F64);
  }
  return value;
}

function attrsOf(list: Uint8Array[]): Attrs {
  const out: Attrs = {};
  for (const kv of list) {
    let key = "";
    let value: string | number | boolean | undefined;
    for (const f of fields(kv)) {
      if (f.num === 1 && f.wire === 2) key = str(f.data);
      else if (f.num === 2 && f.wire === 2) value = anyValue(f.data);
    }
    if (value !== undefined) out[key] = value;
  }
  return out;
}

function numberPoint(d: Uint8Array): NumberPoint {
  let value = 0;
  for (const f of fields(d)) {
    if (f.num === 4 && f.wire === 1) value = scalar(f.data, F64);
    else if (f.num === 6 && f.wire === 1) value = scalar(f.data, I64);
  }
  return { attrs: attrsOf(children(d, 7)), value };
}

function histogramPoint(d: Uint8Array): HistogramPoint {
  let count = 0;
  const bounds: number[] = [];
  const buckets: number[] = [];
  for (const f of fields(d)) {
    if (f.num === 4 && f.wire === 1) count = scalar(f.data, U64);
    else if (f.num === 6 && (f.wire === 1 || f.wire === 2)) collect(f, U64, buckets);
    else if (f.num === 7 && (f.wire === 1 || f.wire === 2)) collect(f, F64, bounds);
  }
  return { attrs: attrsOf(children(d, 9)), count, bounds, buckets };
}

function metric(d: Uint8Array): Metric | undefined {
  let name = "";
  let data: { kind: "gauge" | "sum" | "histogram"; body: Uint8Array } | undefined;
  for (const f of fields(d)) {
    if (f.num === 1 && f.wire === 2) name = str(f.data);
    else if (f.wire === 2 && (f.num === 5 || f.num === 7 || f.num === 9)) {
      data = { kind: KINDS[f.num], body: f.data };
    }
  }
  if (!data) return undefined;
  const points = children(data.body, 1);
  if (data.kind === "histogram") return { name, kind: "histogram", points: points.map(histogramPoint) };
  return { name, kind: data.kind, points: points.map(numberPoint) };
}

export function decodeMetrics(body: Uint8Array): Metric[] {
  const out: Metric[] = [];
  for (const rm of children(body, 1))
    for (const sm of children(rm, 2))
      for (const m of children(sm, 2)) {
        const decoded = metric(m);
        if (decoded) out.push(decoded);
      }
  return out;
}
