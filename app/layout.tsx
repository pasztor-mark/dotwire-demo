import type { Metadata } from "next";
import { Archivo, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { type CSSProperties, Suspense } from "react";
import { Logo } from "@/components/Logo";
import PageEffects from "@/components/PageEffects";
import { SITE } from "@/lib/site";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin", "latin-ext"],
  weight: "variable",
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: SITE.title,
  description: SITE.description,
  openGraph: {
    title: SITE.title,
    description: SITE.description,
    type: "website",
  },
};

const PORTFOLIO_URL = "https://www.pasztormark.dev";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${archivo.variable} ${geistMono.variable}`}>
      <body>
        <div className="shell">
          <Suspense fallback={null}>
            <PageEffects />
          </Suspense>
          <header>
            <nav
              className="m-load-up flex flex-wrap items-center justify-between gap-4 py-2 pr-2 pl-6"
              style={{ "--d": "60ms" } as CSSProperties}
            >
              <a href={PORTFOLIO_URL} aria-label="márk pásztor, portfolio" className="flex text-foreground">
                <Logo size={34} />
              </a>
              <div className="glass glass-pill flex flex-wrap gap-1 p-[5px]">
                <Link href="/" className="nav-link">
                  rooms
                </Link>
                <a href={PORTFOLIO_URL} className="nav-link text-muted">
                  portfolio ↗
                </a>
              </div>
            </nav>
          </header>
          <div className="flex flex-1 flex-col">{children}</div>
          <footer className="mt-auto flex flex-col items-center gap-4 px-3 pt-5 pb-7">
            <div className="glass glass-pill flex flex-wrap items-center justify-center gap-1.5 p-1.5 text-base font-semibold">
              <span className="px-[18px] py-[9px]">dotwire · early development</span>
              <a href={PORTFOLIO_URL} className="chip-link px-[18px] py-[9px] text-base font-semibold">
                by márk pásztor
              </a>
            </div>
            <small className="italic">ps: wanna hire me? send me a message through the contact form on my <a target="_blank" className="underline text-accent" href="https://pasztormark.dev">portfolio</a></small>
          </footer>
        </div>
      </body>
    </html>
  );
}
