import Link from "next/link";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

type NotificationRow = {
  id: string;
  notification_type: string;
  title: string;
  body: string | null;
  target_url: string | null;
  read_at: string | null;
  created_at: string;
};

const previewRows: NotificationRow[] = [
  {
    id: "preview-1",
    notification_type: "open_match_match",
    title: "条件に合う対戦相手募集があります",
    body: "6R / スーパーバンタム級の募集条件に所属選手が一致しています。",
    target_url: "/open-matches",
    read_at: null,
    created_at: new Date().toISOString(),
  },
  {
    id: "preview-2",
    notification_type: "matchmaking_consultation",
    title: "マッチメイク相談が届きました",
    body: "所属選手について相談が届いています。",
    target_url: "/matchmaking",
    read_at: null,
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
];

export default async function NotificationsPage() {
  let rows = previewRows;
  let connected = false;

  if (isSupabaseConfigured) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) redirect("/login?next=/notifications");

    const { data, error } = await supabase
      .schema("ringops")
      .from("notifications")
      .select("id,notification_type,title,body,target_url,read_at,created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error) {
      rows = (data ?? []) as NotificationRow[];
      connected = true;
    }
  }

  const unread = rows.filter((item) => !item.read_at).length;

  return <main>
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-[1180px] flex-wrap items-end justify-between gap-4 px-4 py-7 lg:px-7">
        <div>
          <h1 className="text-3xl font-black">通知</h1>
          <p className="mt-2 text-sm text-slate-500">相談・募集条件一致・連絡・MATCH STATUS再確認をまとめて確認します。</p>
        </div>
        <div className="flex items-center gap-3">
          <p className="text-xs font-bold text-slate-500">未読 <span className="text-base font-black text-slate-950">{unread}</span></p>
          {connected && unread > 0 && <form action={markAllNotificationsRead}><button className="h-9 border border-slate-950 px-3 text-xs font-black">すべて既読</button></form>}
        </div>
      </div>
    </section>

    {!connected && <div className="border-b border-slate-200 bg-slate-50 px-4 py-2 text-center text-[11px] font-bold text-slate-500">現在は通知UIのプレビューです。Supabase接続後は本人宛て通知のみ表示します。</div>}

    <section className="mx-auto max-w-[1180px] px-4 py-7 lg:px-7">
      <div className="border-y-2 border-slate-950 bg-white">
        {rows.map((item) => <article className={`grid gap-4 border-b border-slate-200 px-5 py-5 last:border-0 sm:grid-cols-[1fr_auto] sm:items-center ${item.read_at ? "bg-white" : "border-l-4 border-l-slate-950 bg-slate-50"}`} key={item.id}>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black text-slate-400">{typeLabel(item.notification_type)}</span>
              {!item.read_at && <span className="bg-slate-950 px-1.5 py-0.5 text-[9px] font-black text-white">未読</span>}
            </div>
            <h2 className="mt-1 text-sm font-black">{item.title}</h2>
            {item.body && <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>}
            <p className="mt-2 text-[10px] font-bold text-slate-400">{formatDate(item.created_at)}</p>
          </div>
          <div className="flex items-center gap-2">
            {item.target_url && <Link className="flex h-9 items-center border border-slate-950 px-3 text-xs font-black hover:bg-slate-950 hover:text-white" href={item.target_url}>確認する</Link>}
            {connected && !item.read_at && <form action={markNotificationRead}><input name="id" type="hidden" value={item.id}/><button className="h-9 px-2 text-xs font-bold text-slate-500 underline underline-offset-4">既読</button></form>}
          </div>
        </article>)}
        {!rows.length && <div className="px-5 py-16 text-center text-sm font-bold text-slate-500">現在の通知はありません。</div>}
      </div>
    </section>
  </main>;
}

function typeLabel(type: string) {
  if (type === "open_match_match") return "対戦相手募集";
  if (type === "matchmaking_consultation") return "マッチメイク";
  if (type === "message") return "連絡";
  if (type === "match_status_stale") return "MATCH STATUS";
  return "お知らせ";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
