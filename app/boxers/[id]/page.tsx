import Link from "next/link";
import { notFound } from "next/navigation";
import { CandidateSaveButton } from "@/features/boxers/components/candidate-save-button";
import { loadBoxer } from "@/lib/ringops/load-boxers";

export default async function BoxerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { boxer, industryMode, databaseConnected, loadError } = await loadBoxer(id);

  if (loadError) {
    return <main className="mx-auto max-w-[900px] px-4 py-10 lg:px-7">
      <Link className="text-xs font-black text-slate-500 underline underline-offset-4" href="/">← 選手名鑑に戻る</Link>
      <section className="mt-6 border-y-2 border-slate-950 bg-white px-5 py-10 text-center">
        <h1 className="text-xl font-black">選手情報を読み込めません</h1>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">{loadError}</p>
        <Link className="mt-5 inline-flex h-10 items-center border border-slate-950 px-4 text-xs font-black" href={`/boxers/${id}`}>再読み込み</Link>
      </section>
    </main>;
  }

  if (!boxer) notFound();
  const age = boxer.birthDate ? calculateAge(boxer.birthDate) : null;

  return <main className="mx-auto max-w-[1180px] px-4 py-7 lg:px-7">
    <div className="mb-5 flex items-center justify-between gap-3"><Link className="text-xs font-black text-slate-500 underline underline-offset-4" href="/">← 選手名鑑に戻る</Link>{industryMode&&<Link className="text-xs font-black text-slate-500 underline underline-offset-4" href="/candidates">候補選手を見る →</Link>}</div>
    <section className="border-y-2 border-slate-950 bg-white">
      <div className="grid lg:grid-cols-[280px_1fr]">
        <div className="flex min-h-[320px] items-center justify-center bg-[#0b1825] text-7xl font-black text-white">{boxer.name.slice(0,1)}</div>
        <div className="p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div><p className="text-xs font-black text-slate-400">{boxer.kana}</p><h1 className="mt-1 text-3xl font-black tracking-tight">{boxer.name}</h1><p className="mt-2 text-sm font-bold text-slate-600">{boxer.division}｜{boxer.boxerClass}｜{boxer.stance}構え</p><p className="mt-1 text-sm text-slate-500">{boxer.gym} / {boxer.prefecture}</p></div>
            {industryMode && <div className="text-right"><span className={`inline-flex px-3 py-1.5 text-sm font-black ${boxer.status==="受付中"?"bg-emerald-50 text-emerald-800":boxer.status==="条件次第"?"bg-amber-50 text-amber-900":"bg-slate-100 text-slate-500"}`}>{boxer.status}</span><p className="mt-2 text-xs font-bold text-slate-500">ジム確認：{boxer.verified}</p></div>}
          </div>
          <div className="mt-7 grid gap-x-6 gap-y-4 border-t border-slate-200 pt-5 sm:grid-cols-3"><Data label="戦績" value={`${boxer.totalBouts}戦 ${boxer.wins}勝（${boxer.koWins}KO）${boxer.losses}敗${boxer.draws?` ${boxer.draws}分`:""}`} /><Data label="身長 / リーチ" value={`${boxer.heightCm||"—"}cm / ${boxer.reachCm||"—"}cm`} /><Data label="国籍 / 年齢" value={`${boxer.nationality}${age!==null?` / ${age}歳`:""}`} /></div>
        </div>
      </div>
    </section>

    <div className="mt-6 grid gap-6 lg:grid-cols-[1.25fr_.75fr]">
      <div className="space-y-6">
        <Section title="ランキング">{boxer.rankings.length?<div className="divide-y divide-slate-200">{boxer.rankings.map(r=><div className="flex items-center justify-between py-3 text-sm" key={r.body}><b>{r.body}</b><span className="font-black">{r.rank?`${r.rank}位`:r.title}</span></div>)}</div>:<p className="text-sm text-slate-500">現在表示できるランキングはありません。</p>}</Section>
        <Section title="試合情報"><div className="grid gap-4 sm:grid-cols-2"><Data label="最終試合" value={boxer.lastBout}/><Data label="次戦" value={boxer.nextBout?`${boxer.nextBout}${boxer.nextVenue?` / ${boxer.nextVenue}`:""}`:"未定"}/></div></Section>
        <Section title="基本情報"><div className="grid gap-4 sm:grid-cols-2"><Data label="生年月日" value={boxer.birthDate||"—"}/><Data label="所属ジム" value={boxer.gym}/><Data label="階級" value={boxer.division}/><Data label="構え" value={`${boxer.stance}構え`}/></div></Section>
      </div>
      <aside className="space-y-6">
        {industryMode ? <Section title="マッチメイク情報"><div className="space-y-4"><Data label="受付状況" value={boxer.status}/><Data label="試合可能時期" value={boxer.available}/><Data label="契約可能ウェイト" value={boxer.minWeight&&boxer.maxWeight?`${boxer.minWeight}〜${boxer.maxWeight}kg`:"要確認"}/><Data label="希望ラウンド" value={boxer.rounds.length?boxer.rounds.map(r=>`${r}R`).join(" / "):"要確認"}/><Data label="遠征" value={boxer.travel}/><Data label="情報確認" value={`所属ジム確認：${boxer.verified}`}/></div><div className="mt-6 space-y-2"><Link className="flex h-12 items-center justify-center bg-slate-950 px-4 text-sm font-black text-white hover:bg-slate-800" href={`/matchmaking/new?boxer=${boxer.id}`}>所属ジムに相談する</Link><CandidateSaveButton boxerId={boxer.id} databaseConnected={databaseConnected}/></div></Section>
        : <Section title="業界向け情報"><p className="text-sm leading-6 text-slate-600">MATCH STATUS、契約ウェイト、希望R、試合可能時期は業界アカウントで表示します。</p><Link className="mt-5 flex h-11 items-center justify-center border border-slate-950 text-sm font-black" href={`/login?next=${encodeURIComponent(`/boxers/${boxer.id}`)}`}>業界ログイン</Link></Section>}
        {!databaseConnected && boxer.instagram && <Section title="SNS"><a className="text-sm font-black underline underline-offset-4" href={boxer.instagram} rel="noreferrer" target="_blank">Instagramを開く</a></Section>}
      </aside>
    </div>
  </main>;
}
function Section({title,children}:{title:string;children:React.ReactNode}){return <section className="border border-slate-200 bg-white p-5"><h2 className="mb-4 border-b border-slate-900 pb-3 text-sm font-black">{title}</h2>{children}</section>}
function Data({label,value}:{label:string;value:string}){return <div><p className="text-[11px] font-black text-slate-400">{label}</p><p className="mt-1 text-sm font-black leading-6 text-slate-800">{value}</p></div>}
function calculateAge(date:string){const birth=new Date(`${date}T00:00:00`);const today=new Date();let age=today.getFullYear()-birth.getFullYear();const beforeBirthday=today.getMonth()<birth.getMonth()||(today.getMonth()===birth.getMonth()&&today.getDate()<birth.getDate());if(beforeBirthday)age-=1;return age;}
