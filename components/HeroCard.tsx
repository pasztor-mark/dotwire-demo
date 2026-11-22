import type { CSSProperties, ReactNode } from "react";

function Sweep() {
  return (
    <span
      data-glim="sweep"
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        borderRadius: 32,
        background:
          "linear-gradient(105deg,rgba(255,255,255,0) 35%,rgba(255,255,255,.7) 50%,rgba(255,255,255,0) 65%)",
        transform: "translateX(-120%)",
        pointerEvents: "none",
      }}
    />
  );
}

export function HeroCard({ children }: { children: ReactNode }) {
  return (
    <section className="glass glass-hero">
      <Sweep />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: 0,
          height: "50%",
          opacity: 0.1,
          background: "linear-gradient(180deg,rgba(255,255,255,.55),rgba(255,255,255,0))",
          borderRadius: "32px 32px 50% 50% / 32px 32px 40px 40px",
          pointerEvents: "none",
        }}
      />
      <div style={{ position: "relative" }}>{children}</div>
    </section>
  );
}

export function MaskedTitle({ lines, className }: { lines: string[]; className: string }) {
  return (
    <h1 className={className} style={{ display: "flex", flexDirection: "column" }}>
      {lines.map((line, i) => (
        <span key={i} className="mask">
          <span className="m-load-line" style={{ "--d": `${120 + i * 120}ms` } as CSSProperties}>
            {line}
          </span>
        </span>
      ))}
    </h1>
  );
}
