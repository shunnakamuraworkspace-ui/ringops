import Link from "next/link";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { signIn, signUp } from "./actions";

type SearchParams = {
  error?: string;
  message?: string;
  next?: string;
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { error, message, next } = await searchParams;

  return <main className="mx-auto max-w-5xl px-4 py-10 lg:px-7">
    <Link className="text-xs font-black text-slate-500 underline underline-offset-4" href="/">← 選手名鑑へ戻る</Link>
    <div className="mt-6 grid overflow-hidden border-y-2 border-slate-950 bg-white lg:grid-cols-2">
      <section className="border-b border-slate-200 p-6 lg:border-b-0 lg:border-r lg:p-8">
        <p className="text-[11px] font-black tracking-[.15em] text-slate-400">業界アカウント</p>
        <h1 className="mt-2 text-2xl font-black">ログイン</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">ジム・興行主・マッチメーカー向けの業務情報へアクセスします。</p>
        {!isSupabaseConfigured && <p className="mt-5 border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">現在の公開環境はSupabase未接続のため、ログインはまだ有効化されていません。</p>}
        {error && <p className="mt-5 border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</p>}
        {message && <p className="mt-5 border border-emerald-200 bg-emerald-50 p-3 text-xs font-bold text-emerald-800">{message}</p>}
        <form action={signIn} className="mt-6 space-y-4">
          <input name="next" type="hidden" value={next ?? ""} />
          <Field label="メールアドレス"><input className="input" name="email" type="email" autoComplete="email" required /></Field>
          <Field label="パスワード"><input className="input" name="password" type="password" autoComplete="current-password" minLength={8} required /></Field>
          <button className="h-12 w-full bg-slate-950 px-5 text-sm font-black text-white disabled:bg-slate-400" disabled={!isSupabaseConfigured}>ログイン</button>
        </form>
      </section>
      <section className="p-6 lg:p-8">
        <p className="text-[11px] font-black tracking-[.15em] text-slate-400">初回登録</p>
        <h2 className="mt-2 text-2xl font-black">アカウントを作成</h2>
        <p className="mt-2 text-sm leading-6 text-slate-500">最初の管理者アカウントを作成後、所属組織を登録します。スタッフ追加は組織管理から行います。</p>
        <form action={signUp} className="mt-6 space-y-4">
          <Field label="表示名"><input className="input" name="displayName" autoComplete="name" required /></Field>
          <Field label="メールアドレス"><input className="input" name="email" type="email" autoComplete="email" required /></Field>
          <Field label="パスワード（8文字以上）"><input className="input" name="password" type="password" autoComplete="new-password" minLength={8} required /></Field>
          <button className="h-12 w-full border border-slate-950 px-5 text-sm font-black disabled:border-slate-300 disabled:text-slate-400" disabled={!isSupabaseConfigured}>新規登録</button>
        </form>
      </section>
    </div>
  </main>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-black text-slate-500">{label}</span>{children}</label>;
}
