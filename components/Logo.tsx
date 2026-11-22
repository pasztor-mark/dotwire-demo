const DOTS: [number, number][] = [
  [20, 20],
  [33, 20],
  [26.5, 8.74],
  [13.5, 8.74],
  [7, 20],
  [13.5, 31.26],
  [26.5, 31.26],
];

export function Logo({ size }: { size: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
      {DOTS.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={5} fill="currentColor" />
      ))}
    </svg>
  );
}
