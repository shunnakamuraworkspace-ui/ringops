import Link from "next/link";
import { acceptInvitation } from "./actions";

export default async function InvitePage({searchParams}:{searchParams:Promise<{token?:string;error?:string}>}){
  const {token,error}=await searchParams;
  return <main className="mx-auto max-w-xl px-4 py-10"><Link className="text-xs font-black text-slate-500 underline underline-offset-4" href="/">← RINGOPS</Link><section className="mt-6 border-y-2 border-slate-950 bg-white p-6 sm:p-8"><p className="text-[11px] font-black tracking-[.15em] text-slate-400">組織招待</p><h1 className="mt-2 text-2xl font-black">RINGOPSスタッフとして参加</h1><p className="mt-2 text-sm leading-6 text-slate-500">招待されたメールアドレスでログインした状態で参加してください。</p>{error&&<p className="mt-5 border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</p>}{token?<form action={acceptInvitation} className="mt-6"><input type="hidden" name="token" value={token}/><button className="h-12 w-full bg-slate-950 px-5 text-sm font-black text-white">この組織に参加する</button></form>:<p className="mt-6 border border-slate-200 bg-slate-50 p-4 text-sm font-bold text-slate-600">招待トークンがありません。招待リンクをもう一度開いてください。</p>}</section></main>
}
