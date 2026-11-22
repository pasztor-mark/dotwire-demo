"use client";
import React, { useEffect, useRef } from "react";

type Kind = { f: Keyframe[]; d: number; e: string; p?: number };

const K: Record<string, Kind> = {
  up: {
    f: [
      { opacity: 0, transform: "translateY(32px)" },
      { opacity: 1, transform: "none" },
    ],
    d: 800,
    e: "cubic-bezier(.16,1,.3,1)",
  },
  line: {
    f: [{ transform: "translateY(150%)" }, { transform: "none" }],
    d: 1100,
    e: "cubic-bezier(.16,1,.3,1)",
    p: 1,
  },
  stretch: {
    f: [
      { opacity: 0, transform: "translateY(32px)" },
      { opacity: 1, transform: "none" },
    ],
    d: 800,
    e: "cubic-bezier(.16,1,.3,1)",
  },
  pop: {
    f: [
      { transform: "scale(0)", offset: 0 },
      { transform: "scale(1.08)", offset: 0.6 },
      { transform: "none", offset: 1 },
    ],
    d: 700,
    e: "cubic-bezier(.16,1,.3,1)",
    p: 1,
  },
};

const glow = (extra: React.CSSProperties): React.CSSProperties => ({
  position: "absolute",
  borderRadius: "50%",
  ...extra,
});

const bigGlow = (extra: React.CSSProperties): React.CSSProperties =>
  glow({
    opacity: 0.38,
    width: "calc(70vw * 1.5)",
    height: "calc(70vw * 1.5)",
    maxWidth: "calc(1000px * 1.5)",
    maxHeight: "calc(1000px * 1.5)",
    margin: "calc((1 - 1.5) * 35vw)",
    ...extra,
  });

const white = (a: number) => `rgba(255,255,255,${a})`;
const trace = (
  len: number,
  dur: number,
  boost: number,
  cx: number,
  r: number,
  sw: number,
  dash: number,
  blur: number,
  rev?: boolean,
) => (
  <circle
    data-glim="trace"
    data-len={len}
    data-dur={dur}
    data-boost={boost}
    data-rev={rev ? 1 : undefined}
    cx={cx}
    cy={cx}
    r={r}
    fill="none"
    stroke="#fff"
    strokeWidth={sw}
    strokeLinecap="round"
    strokeDasharray={`${dash} ${len - dash}`}
    style={{ filter: `drop-shadow(0 0 ${blur}px #fff)` }}
  />
);

export default function PageEffects() {
  const layerRef = useRef<HTMLDivElement>(null);
  const dotsRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const layer = layerRef.current;
    const root = layer?.parentElement;
    const canvas = dotsRef.current;
    if (!layer || !root || !canvas) return;

    const mq = matchMedia("(prefers-reduced-motion: reduce)");
    const motionOn = () => !mq.matches;
    const dotA = 0.45;

    let t = 0;
    let pt: PointerEvent | null = null;
    let lastTop: number | undefined;
    let vel = 0;
    let zoomEls: HTMLElement[] = [];
    let dloop = 0;
    let draf = 0;
    let zraf = 0;
    let graf = 0;
    let mraf = 0;
    let first = true;

    const glims: { a: Animation; k: number }[] = [];
    const anims: Animation[] = [];
    const sweepAnims: { el: Element; a: Animation }[] = [];
    const pending = new Map<Element, Animation>();
    const seen = new WeakSet<Element>();
    const sweepSeen = new WeakSet<Element>();
    const targets = new Map<Element, HTMLElement[]>();

    const drawDots = () => {
      const W = root.clientWidth;
      const RH = root.offsetHeight;
      const VH = Math.min(innerHeight, RH);
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(W * dpr) || canvas.height !== Math.round(VH * dpr)) {
        canvas.width = Math.round(W * dpr);
        canvas.height = Math.round(VH * dpr);
        canvas.style.height = VH + "px";
      }
      const sc = Math.max(0, -root.getBoundingClientRect().top);
      const y0 = Math.min(sc, Math.max(0, RH - VH));
      canvas.style.transform = "translateY(" + y0 + "px)";
      const m = motionOn() ? 1 : 0;
      const tm = (m * t) / 1000;
      const x = canvas.getContext("2d");
      if (!x) return;
      x.setTransform(dpr, 0, 0, dpr, 0, 0);
      x.clearRect(0, 0, W, VH);
      x.fillStyle = "#fff";
      const fields = [
        {
          cx: W * (0.78 - 0.14 * m * Math.sin(sc / 900) + 0.05 * Math.sin(tm * 0.31)),
          cy: 260 + sc * 0.45 * m + 50 * Math.sin(tm * 0.23 + 1),
          r0: 60,
          r1: Math.max(W * 0.55, 520),
        },
        {
          cx: W * (0.05 + 0.12 * m * Math.sin(sc / 1100) + 0.05 * Math.sin(tm * 0.27 + 2)),
          cy: RH * 0.42 + sc * 0.2 * m + 60 * Math.sin(tm * 0.19 + 3),
          r0: 80,
          r1: Math.max(W * 0.5, 480),
        },
        {
          cx: W * (0.92 - 0.1 * m * Math.sin(sc / 800) + 0.04 * Math.sin(tm * 0.35 + 4)),
          cy: RH * 0.8 - sc * 0.15 * m + 50 * Math.sin(tm * 0.21 + 5),
          r0: 60,
          r1: Math.max(W * 0.5, 480),
        },
      ];
      const g = 22;
      const max = g * 0.46;
      const rh = g * 0.866;
      for (let row = Math.floor(y0 / rh), py = row * rh; py < y0 + VH + g; row++, py += rh) {
        for (let px = ((row % 2) * g) / 2; px < W + g; px += g) {
          let v = 0;
          for (const F of fields) {
            const u = (Math.hypot(px - F.cx, py - F.cy) - F.r0) / (F.r1 - F.r0);
            if (u > 0 && u < 1.25) v = Math.max(v, u < 1 ? u * u : 1 - (u - 1) * 4);
          }
          if (m)
            v *=
              0.8 +
              0.2 *
                Math.sin((px * 0.4 + py - sc * 1.6) / 110 - tm * 1.4) *
                (0.7 + 0.3 * Math.sin((px - py * 0.5) / 160 + tm * 0.9));
          if (v > 0.04) {
            x.globalAlpha = (0.35 + v * 0.5) * dotA;
            x.beginPath();
            x.arc(px, py - y0, max * v, 0, 6.2832);
            x.fill();
          }
        }
      }
    };

    const boost = () => {
      if (!glims.length) return;
      const top = root.getBoundingClientRect().top;
      const d = Math.abs(top - (lastTop ?? top));
      lastTop = top;
      vel = Math.max(d, vel * 0.93);
      const e = Math.min(vel / 10, 5);
      for (const g of glims) {
        const pr = 1 + g.k * e;
        if (Math.abs(g.a.playbackRate - pr) > 0.01) g.a.playbackRate = pr;
      }
    };

    const setupLayer = () => {
      if (!motionOn()) return;
      let s = 0;
      layer.querySelectorAll<HTMLElement>("[data-glim]").forEach((el) => {
        const type = el.dataset.glim;
        const dur = +(el.dataset.dur || 0) || 6000;
        const k = +(el.dataset.boost || 0) || 1;
        if (type === "trace") {
          const a = el.animate(
            [
              { strokeDashoffset: 0 },
              { strokeDashoffset: (el.dataset.rev ? 1 : -1) * +(el.dataset.len || 0) },
            ],
            { duration: dur, iterations: Infinity },
          );
          anims.push(a);
          glims.push({ a, k });
        }
        if (type === "drift") {
          const i = s++;
          anims.push(
            el.animate(
              [
                { transform: "translate(0,0) scale(1)" },
                { transform: "translate(" + (i % 2 ? 9 : -9) + "vw,7vh) scale(1.15)" },
                { transform: "translate(" + (i % 2 ? -5 : 6) + "vw,-6vh) scale(.92)" },
                { transform: "translate(0,0) scale(1)" },
              ],
              { duration: 22000 + i * 5000, iterations: Infinity, easing: "ease-in-out" },
            ),
          );
        }
        if (type === "spin") {
          const a = el.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], {
            duration: dur,
            iterations: Infinity,
          });
          anims.push(a);
          glims.push({ a, k });
        }
      });
    };

    const sweeps = () => {
      if (!motionOn()) return;
      let s = 3;
      root.querySelectorAll<HTMLElement>('[data-glim="sweep"]').forEach((el) => {
        if (sweepSeen.has(el)) return;
        sweepSeen.add(el);
        sweepAnims.push({
          el,
          a: el.animate(
            [
              { transform: "translateX(-120%)" },
              { transform: "translateX(120%)", offset: 0.3 },
              { transform: "translateX(120%)" },
            ],
            {
              duration: 6500,
              delay: 1200 + s++ * 900,
              iterations: Infinity,
              easing: "cubic-bezier(.45,0,.2,1)",
            },
          ),
        });
      });
    };

    const glare = () => {
      const ev = pt;
      if (!ev || !motionOn()) return;
      root.querySelectorAll<HTMLElement>(".glass").forEach((el) => {
        const b = el.getBoundingClientRect();
        if (b.bottom < -200 || b.top > innerHeight + 200) return;
        const x = ev.clientX - b.left;
        const y = ev.clientY - b.top;
        const rad = Math.max(220, Math.min(520, b.width * 0.45)) * 2.2;
        const dist = Math.hypot(
          Math.max(0, Math.max(-x, x - b.width)),
          Math.max(0, Math.max(-y, y - b.height)),
        );
        el.style.backgroundImage =
          "radial-gradient(" +
          rad +
          "px circle at " +
          x +
          "px " +
          y +
          "px,rgba(255,255,255,.04),rgba(255,255,255,.012) 50%,rgba(255,255,255,0) 75%)";
        el.style.borderColor =
          "rgba(255,255,255," + (0.1 + 0.12 * Math.max(0, 1 - dist / 300)).toFixed(2) + ")";
      });
    };

    const zoom = () => {
      const on = motionOn();
      const vh = innerHeight;
      const vw = root.clientWidth;
      const rt = root.getBoundingClientRect().top;
      zoomEls.forEach((el) => {
        if (!on) {
          el.style.transform = "";
          el.style.borderRadius = "";
          el.style.zIndex = "";
          return;
        }
        const top = rt + el.offsetTop;
        const h = el.offsetHeight;
        const w = el.offsetWidth;
        const ov = Math.max(0, Math.min(top + h, vh) - Math.max(top, 0));
        const tt = Math.min(1, Math.max(0, (ov / Math.min(vh, h) - 0.35) / 0.6));
        const e = tt * tt * (3 - 2 * tt);
        const s = 0.93 + (vw / w - 0.93) * e;
        el.style.position = "relative";
        el.style.transformOrigin = "50% " + Math.round(vh / 2 - top) + "px";
        el.style.transform = "scale(" + s.toFixed(4) + ")";
        el.style.borderRadius = ((32 * (1 - e)) / s).toFixed(2) + "px";
        el.style.zIndex = e > 0.5 ? "2" : "1";
      });
    };

    const onIO = (es: IntersectionObserverEntry[]) => {
      const els: HTMLElement[] = [];
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        io.unobserve(e.target);
        els.push(...(targets.get(e.target) || []));
        targets.delete(e.target);
      });
      els.sort((a, b) => (a.compareDocumentPosition(b) & 2 ? 1 : -1));
      const dl = new Map<Element, number>();
      let n = 0;
      els.forEach((el) => {
        const a = pending.get(el);
        if (!a) return;
        pending.delete(el);
        const k = K[el.dataset.m || ""];
        const anc = el.parentElement?.closest("[data-m]") || null;
        const delay =
          el.dataset.mDelay != null
            ? +el.dataset.mDelay
            : k.p
              ? (anc && dl.get(anc)) || 0
              : Math.min(n++, 6) * 80;
        dl.set(el, delay);
        a.effect?.updateTiming({ delay });
        a.onfinish = () => a.cancel();
        a.play();
      });
    };

    const io = new IntersectionObserver(onIO, { rootMargin: "0px 0px -8% 0px" });

    const scan = () => {
      if (!motionOn()) return;
      root.querySelectorAll<HTMLElement>("[data-m]").forEach((el) => {
        if (seen.has(el)) return;
        seen.add(el);
        if (first && el.getBoundingClientRect().top < innerHeight) return;
        const k = K[el.dataset.m || ""];
        if (!k) return;
        const target = k.p ? el.parentElement : el;
        if (!target) return;
        const a = el.animate(k.f, { duration: k.d, easing: k.e, fill: "both" });
        a.pause();
        pending.set(el, a);
        if (!targets.has(target)) {
          targets.set(target, []);
          io.observe(target);
        }
        targets.get(target)!.push(el);
      });
    };

    const prune = () => {
      pending.forEach((a, el) => {
        if (el.isConnected) return;
        a.cancel();
        pending.delete(el);
      });
      targets.forEach((_, tg) => {
        if (tg.isConnected) return;
        io.unobserve(tg);
        targets.delete(tg);
      });
      for (let i = sweepAnims.length - 1; i >= 0; i--) {
        if (sweepAnims[i].el.isConnected) continue;
        sweepAnims[i].a.cancel();
        sweepAnims.splice(i, 1);
      }
    };

    const refresh = () => {
      prune();
      zoomEls = [...root.querySelectorAll<HTMLElement>("[data-zoom]")];
      zoom();
      scan();
      sweeps();
      drawDots();
    };

    const dotLoop = (ts: number) => {
      t = ts;
      if (motionOn()) {
        drawDots();
        boost();
      }
      dloop = requestAnimationFrame(dotLoop);
    };

    const onScroll = () => {
      if (!zraf)
        zraf = requestAnimationFrame(() => {
          zraf = 0;
          zoom();
          drawDots();
        });
    };
    const onMove = (ev: PointerEvent) => {
      pt = ev;
      if (!graf)
        graf = requestAnimationFrame(() => {
          graf = 0;
          glare();
        });
    };

    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(draf);
      draf = requestAnimationFrame(drawDots);
    });
    ro.observe(root);

    const mo = new MutationObserver(() => {
      if (mraf) return;
      mraf = requestAnimationFrame(() => {
        mraf = 0;
        refresh();
      });
    });
    mo.observe(root, { childList: true, subtree: true });

    addEventListener("scroll", onScroll, { passive: true, capture: true });
    addEventListener("resize", onScroll);
    addEventListener("pointermove", onMove, { passive: true });

    setupLayer();
    refresh();
    first = false;
    dloop = requestAnimationFrame(dotLoop);

    return () => {
      cancelAnimationFrame(dloop);
      cancelAnimationFrame(draf);
      cancelAnimationFrame(zraf);
      cancelAnimationFrame(graf);
      cancelAnimationFrame(mraf);
      ro.disconnect();
      mo.disconnect();
      io.disconnect();
      removeEventListener("scroll", onScroll, { capture: true });
      removeEventListener("resize", onScroll);
      removeEventListener("pointermove", onMove);
      anims.forEach((a) => a.cancel());
      sweepAnims.forEach(({ a }) => a.cancel());
      pending.forEach((a) => a.cancel());
      pending.clear();
      targets.clear();
    };
  }, []);

  return (
    <div
      ref={layerRef}
      aria-hidden="true"
      style={{
        position: "absolute",
        inset: 0,
        zIndex: -1,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    >
      <canvas
        ref={dotsRef}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100vh",
          willChange: "transform",
        }}
      />
      <div
        data-glim="drift"
        style={bigGlow({
          right: "-10%",
          top: "-6%",
          background: "radial-gradient(circle,oklch(0.75 0.19 40 / .9),oklch(0.75 0.19 40 / 0) 65%)",
        })}
      />
      <div
        data-glim="drift"
        style={glow({
          opacity: 0.08,
          left: "-20%",
          top: "30%",
          width: "80vw",
          height: "80vw",
          maxWidth: 1100,
          maxHeight: 1100,
          background: "radial-gradient(circle,oklch(0.97 0.03 70 / .9),oklch(0.97 0.03 70 / 0) 60%)",
        })}
      />
      <div
        data-glim="drift"
        style={bigGlow({
          right: "-15%",
          top: "58%",
          background: "radial-gradient(circle,oklch(0.72 0.19 35 / .8),oklch(0.72 0.19 35 / 0) 65%)",
        })}
      />
      <svg
        viewBox="0 0 800 800"
        style={{ position: "absolute", right: -220, top: -160, width: 800, height: 800, overflow: "visible" }}
      >
        <circle cx="400" cy="400" r="390" fill="none" stroke={white(0.6)} strokeWidth="1.5" />
        <circle
          cx="400"
          cy="400"
          r="320"
          fill="none"
          stroke={white(0.5)}
          strokeWidth="1.5"
          strokeDasharray="2 9"
        />
        <circle cx="400" cy="400" r="250" fill="none" stroke={white(0.45)} strokeWidth="1" />
        <circle cx="400" cy="400" r="170" fill="none" stroke={white(0.35)} strokeWidth="18" />
        {trace(2450, 9000, 1.2, 400, 390, 3, 70, 6)}
        {trace(1571, 7000, 3, 400, 250, 2, 70, 6)}
        {trace(2011, 14000, 2.2, 400, 320, 2.5, 40, 5, true)}
        {trace(1068, 5000, 4.5, 400, 170, 5, 90, 8)}
        {trace(2450, 23000, 0.6, 400, 390, 2, 30, 4, true)}
      </svg>
      <svg
        data-glim="spin"
        data-dur="38000"
        data-boost="4"
        viewBox="0 0 800 800"
        style={{ position: "absolute", right: -220, top: -160, width: 800, height: 800, overflow: "visible" }}
      >
        <circle cx="400" cy="80" r="9" fill="#fff" style={{ filter: "drop-shadow(0 0 10px #fff)" }} />
        <circle cx="400" cy="720" r="5" fill={white(0.8)} />
      </svg>
      <svg
        viewBox="0 0 700 700"
        style={{ position: "absolute", left: -300, top: "30%", width: 700, height: 700, overflow: "visible" }}
      >
        <circle cx="350" cy="350" r="340" fill="none" stroke={white(0.55)} strokeWidth="1.5" />
        <circle cx="350" cy="350" r="270" fill="none" stroke={white(0.4)} strokeWidth="40" />
        <circle
          cx="350"
          cy="350"
          r="200"
          fill="none"
          stroke={white(0.5)}
          strokeWidth="1"
          strokeDasharray="3 12"
        />
        {trace(2136, 11000, 2, 350, 340, 3, 70, 6)}
        {trace(1696, 16000, 1.5, 350, 270, 6, 120, 10, true)}
        {trace(1257, 6000, 5, 350, 200, 2.5, 40, 5)}
      </svg>
      <svg
        data-glim="spin"
        data-dur="52000"
        data-boost="6"
        viewBox="0 0 700 700"
        style={{ position: "absolute", left: -300, top: "30%", width: 700, height: 700, overflow: "visible" }}
      >
        <circle cx="350" cy="10" r="7" fill="#fff" style={{ filter: "drop-shadow(0 0 8px #fff)" }} />
      </svg>
      <svg
        viewBox="0 0 760 760"
        style={{
          position: "absolute",
          right: -260,
          top: "64%",
          width: 760,
          height: 760,
          overflow: "visible",
        }}
      >
        <circle cx="380" cy="380" r="370" fill="none" stroke={white(0.55)} strokeWidth="1.5" />
        <circle
          cx="380"
          cy="380"
          r="300"
          fill="none"
          stroke={white(0.45)}
          strokeWidth="1.5"
          strokeDasharray="2 9"
        />
        <circle cx="380" cy="380" r="220" fill="none" stroke={white(0.3)} strokeWidth="24" />
        {trace(1885, 8000, 0.8, 380, 300, 3, 70, 6)}
        {trace(2325, 19000, 1, 380, 370, 2.5, 50, 5, true)}
        {trace(1382, 10000, 3.5, 380, 220, 5, 100, 8)}
        {trace(2325, 7500, 2.5, 380, 370, 2, 25, 4)}
      </svg>
    </div>
  );
}
