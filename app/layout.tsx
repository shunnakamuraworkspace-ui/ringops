import type { Metadata } from "next";
import type { ReactNode } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { shouldUseReviewMode } from "@/lib/ringops/review-mode";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RINGOPS", template: "%s｜RINGOPS" },
  description: "日本のプロボクシング業界向けマッチメイク業務プラットフォーム",
};

const demoSeedScript = `try{if(!localStorage.getItem('ringops_demo_seeded_v4')){localStorage.setItem('ringops_candidate_boxers',JSON.stringify(['20000000-0000-0000-0000-000000000001','20000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000007']));localStorage.setItem('ringops_demo_seeded_v4','1')}}catch(e){}`;

export default async function RootLayout({ children }: { children: ReactNode }) {
  let user: { id?: string; email?: string; user_metadata?: { display_name?: string } } | null = null;
  let unreadCount = 0;
  const reviewMode = !isSupabaseConfigured || await shouldUseReviewMode();

  if (isSupabaseConfigured && !reviewMode) {
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

  const shellUser = user ? { email: user.email, displayName: user.user_metadata?.display_name } : null;

  return <html lang="ja"><body>
    {reviewMode && <script dangerouslySetInnerHTML={{__html:demoSeedScript}}/>}
    <AppShell user={shellUser} unreadCount={unreadCount} demoMode={reviewMode}>{children}</AppShell>
  </body></html>;
}
