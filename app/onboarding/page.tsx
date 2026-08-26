import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createOrganization } from "./actions";

export default async function OnboardingPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <main className="mx-auto max-w-2xl px-4 py-10 lg:px-7">
    <Link className="text-xs font-black text-slate-500 underline underline-offset-4" href="/">← 選手名鑑へ戻る</Link>
    <section className="mt-6 border-y-2 border-slate-950 bg-white p-6 sm:p-8">
      <p className="text-[11px] font-black tracking-[.15em] text-slate-400">初期設定</p>
      <h1 className="mt-2 text-2xl font-black">所属組織を登録</h1>
      <p className="mt-2 text-sm leading-6 text-slate-500">ジムまたは興行主の組織を作成します。作成したユーザーは最初の管理者になります。</p>
      {error && <p className="mt-5 border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</p>}
      {!isSupabaseConfigured && <p className="mt-5 border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">Supabase接続後に利用できます。</p>}
      <form action={createOrganization} className="mt-6 space-y-4">
        <Field label="組織種別"><select className="input" name="type" defaultValue="gym"><option value="gym">ボクシングジム</option><option value="promoter">興行主・プロモーター</option><option value="other">その他業界組織</option></select></Field>
        <Field label="組織名"><input className="input" name="displayName" placeholder="例：青空ボクシングジム" required /></Field>
        <Field label="識別名"><input className="input" name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="例：aozora-boxing" required /><span className="mt-1 block text-[11px] text-slate-400">半角英数字とハイフン。URLやシステム内部の識別に使用します。</span></Field>
        <button className="h-12 w-full bg-slate-950 px-5 text-sm font-black text-white disabled:bg-slate-400" disabled={!isSupabaseConfigured}>組織を作成</button>
      </form>
    </section>
  </main>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-1.5 block text-xs font-black text-slate-500">{label}</span>{children}</label>; }
