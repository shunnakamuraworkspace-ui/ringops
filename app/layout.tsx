import type { Metadata } from "next";
import type { ReactNode } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "RINGOPS", template: "%s｜RINGOPS" },
  description: "日本のプロボクシング業界向けマッチメイク業務プラットフォーム",
};

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

  const shellUser = user ? {
    email: user.email,
    displayName: user.user_metadata?.display_name,
  } : null;

  return <html lang="ja"><body>
    <AppShell user={shellUser} unreadCount={unreadCount} demoMode={!user}>
      {children}
    </AppShell>
  </body></html>;
}
