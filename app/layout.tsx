import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RINGOPS", template: "%s｜RINGOPS" },
  description: "日本のプロボクシング業界向けマッチメイク業務プラットフォーム",
};

const nav = [
  ["選手名鑑", "/"],
  ["対戦相手募集", "/open-matches"],
  ["マッチメイク", "/matchmaking"],
  ["興行", "/events"],
  ["連絡", "/messages"],
  ["ジム管理", "/gym"],
] as const;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#081522] text-white">
          <div className="mx-auto flex min-h-14 max-w-[1480px] items-center justify-between gap-4 px-4 lg:px-7">
            <div className="flex min-w-0 items-center gap-7">
              <Link className="shrink-0 text-lg font-black tracking-[.12em]" href="/">RINGOPS</Link>
              <nav className="hidden items-center gap-1 md:flex">
                {nav.map(([label, href]) => <Link className="px-3 py-4 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white" href={href} key={href}>{label}</Link>)}
              </nav>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-400"><span className="hidden sm:inline">業界向けプレビュー</span><span className="flex size-8 items-center justify-center border border-white/15 text-xs font-black text-white">運</span></div>
          </div>
          <nav className="flex overflow-x-auto border-t border-white/5 px-2 md:hidden">
            {nav.map(([label, href]) => <Link className="shrink-0 px-3 py-2.5 text-xs font-bold text-slate-300" href={href} key={href}>{label}</Link>)}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
