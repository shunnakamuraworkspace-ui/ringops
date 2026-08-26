import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RINGOPS", template: "%s｜RINGOPS" },
  description: "日本のプロボクシング業界向けマッチメイク業務プラットフォーム",
};

const nav = [
  ["選手名鑑", "/"], ["候補", "/candidates"], ["対戦相手募集", "/open-matches"],
  ["マッチメイク", "/matchmaking"], ["興行", "/events"], ["連絡", "/messages"], ["ジム管理", "/gym"],
] as const;

export default async function RootLayout({ children }: { children: ReactNode }) {
  let user: { id?: string; email?: string; user_metadata?: { display_name?: string } } | null = null;
  let unreadCount = 0;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    user = data.user;

    if (user?.id) {
      const { count } = await supabase
        .schema("ringops")
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .is("read_at", null);
      unreadCount = count ?? 0;
    }
  }

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "運";

  return <html lang="ja"><body>
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-[#081522] text-white">
      <div className="mx-auto flex min-h-14 max-w-[1480px] items-center justify-between gap-4 px-4 lg:px-7">
        <div className="flex min-w-0 items-center gap-7"><Link className="shrink-0 text-lg font-black tracking-[.12em]" href="/">RINGOPS</Link><nav className="hidden items-center gap-1 md:flex">{nav.map(([label,href])=><Link className="px-3 py-4 text-sm font-bold text-slate-300 hover:bg-white/5 hover:text-white" href={href} key={href}>{label}</Link>)}</nav></div>
        <div className="flex items-center gap-3 text-xs">
          {!isSupabaseConfigured && <span className="hidden font-bold text-slate-400 sm:inline">独立開発プレビュー</span>}
          {isSupabaseConfigured && !user && <Link className="border border-white/30 px-3 py-2 font-black text-white" href="/login">ログイン</Link>}
          {user && <>
            <Link className="flex h-8 items-center gap-1.5 border border-white/15 px-2.5 font-black text-slate-200 hover:border-white/30 hover:text-white" href="/notifications">通知{unreadCount>0&&<span className="flex min-w-5 items-center justify-center bg-white px-1 text-[10px] font-black text-slate-950">{unreadCount>99?"99+":unreadCount}</span>}</Link>
            <span className="hidden max-w-40 truncate font-bold text-slate-300 sm:inline">{displayName}</span>
            <span className="flex size-8 items-center justify-center border border-white/15 font-black text-white">{displayName.slice(0,1)}</span>
            <form action={signOut}><button className="text-[11px] font-bold text-slate-400 hover:text-white">ログアウト</button></form>
          </>}
        </div>
      </div>
      <nav className="flex overflow-x-auto border-t border-white/5 px-2 md:hidden">{nav.map(([label,href])=><Link className="shrink-0 px-3 py-2.5 text-xs font-bold text-slate-300" href={href} key={href}>{label}</Link>)}</nav>
    </header>
    {children}
  </body></html>;
}
