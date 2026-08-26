"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { divisions, type BoxerPreview } from "../data/preview-boxers";

const badge: Record<BoxerPreview["status"], string> = {
  "受付中": "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  "条件次第": "bg-amber-50 text-amber-900 ring-amber-600/20",
  "受付停止": "bg-slate-100 text-slate-500 ring-slate-500/20",
};

export function BoxerDirectory({ boxers }: { boxers: BoxerPreview[] }) {
  const [q,setQ]=useState(""); const [division,setDivision]=useState("すべて"); const [klass,setKlass]=useState("すべて");
  const [stance,setStance]=useState("すべて"); const [status,setStatus]=useState("相談可"); const [rounds,setRounds]=useState("すべて");
  const [ranking,setRanking]=useState("すべて"); const [nextBout,setNextBout]=useState("すべて"); const [month,setMonth]=useState("");
  const [minWeight,setMinWeight]=useState(""); const [maxWeight,setMaxWeight]=useState("");

  const filtered=useMemo(()=>boxers.filter(b=>{
    const text=q.trim().toLowerCase();
    const queryOk=!text||[b.name,b.kana,b.gym,b.prefecture,b.nationality].some(v=>v.toLowerCase().includes(text));
    const statusOk=status==="すべて"||(status==="相談可"?b.status!=="受付停止":b.status===status);
    const rankingOk=ranking==="すべて"||(ranking==="ランカー"?b.rankings.length>0:b.rankings.some(r=>r.body===ranking));
    const nextOk=nextBout==="すべて"||(nextBout==="次戦あり"?Boolean(b.nextBout):!b.nextBout);
    const monthOk=!month||(!b.availableMonth?false:b.availableMonth<=month);
    const minW=minWeight?Number(minWeight):null; const maxW=maxWeight?Number(maxWeight):null;
    const weightOk=(minW===null||b.maxWeight>=minW)&&(maxW===null||b.minWeight<=maxW);
    return queryOk && (division==="すべて"||b.division===division) && (klass==="すべて"||b.boxerClass===klass) && (stance==="すべて"||b.stance===stance) && (rounds==="すべて"||b.rounds.includes(Number(rounds))) && statusOk && rankingOk && nextOk && monthOk && weightOk;
  }),[boxers,q,division,klass,stance,status,rounds,ranking,nextBout,month,minWeight,maxWeight]);

  const reset=()=>{setQ("");setDivision("すべて");setKlass("すべて");setStance("すべて");setStatus("相談可");setRounds("すべて");setRanking("すべて");setNextBout("すべて");setMonth("");setMinWeight("");setMaxWeight("");};
  return <>
    <section className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-[1480px] px-4 py-5 lg:px-7">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Field label="選手名・ジム・地域"><input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="選手名、所属ジム、都道府県" /></Field>
          <Select label="階級" value={division} onChange={setDivision} values={["すべて",...divisions]} />
          <Select label="クラス" value={klass} onChange={setKlass} values={["すべて","A級","B級","C級"]} />
          <Select label="構え" value={stance} onChange={setStance} values={["すべて","右","左"]} />
          <Select label="マッチメイク受付" value={status} onChange={setStatus} values={["相談可","受付中","条件次第","受付停止","すべて"]} />
        </div>
        <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-2 xl:grid-cols-6">
          <Select label="希望R" value={rounds} onChange={setRounds} values={["すべて","4","6","8","10","12"]} />
          <Select label="ランキング" value={ranking} onChange={setRanking} values={["すべて","ランカー","日本","OPBF","WBO Asia Pacific","WBA","WBC","IBF","WBO"]} />
          <Select label="次戦" value={nextBout} onChange={setNextBout} values={["すべて","次戦あり","次戦未定"]} />
          <Field label="試合可能月"><input className="input" type="month" value={month} onChange={e=>setMonth(e.target.value)} /></Field>
          <Field label="契約ウェイト下限"><input className="input" inputMode="decimal" value={minWeight} onChange={e=>setMinWeight(e.target.value)} placeholder="例 53" /></Field>
          <Field label="契約ウェイト上限"><input className="input" inputMode="decimal" value={maxWeight} onChange={e=>setMaxWeight(e.target.value)} placeholder="例 55" /></Field>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3"><p className="text-xs font-bold text-slate-500">条件を変えると結果へ即反映</p><button className="text-xs font-black text-slate-700 underline underline-offset-4" onClick={reset}>条件をリセット</button></div>
      </div>
    </section>
    <main className="mx-auto max-w-[1480px] px-4 py-6 lg:px-7">
      <div className="mb-3 flex items-end justify-between"><div><p className="text-[11px] font-black tracking-[.14em] text-slate-400">選手名鑑</p><h2 className="mt-1 text-2xl font-black">候補 {filtered.length}名</h2></div><p className="hidden text-xs font-bold text-slate-500 sm:block">公式情報 + ジム確認情報</p></div>
      <div className="overflow-hidden border-y-2 border-slate-900 bg-white">
        <div className="hidden grid-cols-[2.1fr_1.3fr_.55fr_1.1fr_1.05fr_1.55fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-black text-slate-500 lg:grid"><span>選手</span><span>戦績・ランキング</span><span>構え</span><span>最終 / 次戦</span><span>受付 / 更新</span><span>試合条件</span></div>
        {filtered.map(b=><article className="grid gap-4 border-b border-slate-200 px-4 py-5 last:border-0 hover:bg-slate-50/80 lg:grid-cols-[2.1fr_1.3fr_.55fr_1.1fr_1.05fr_1.55fr] lg:items-center lg:px-5" key={b.id}>
          <Link href={`/boxers/${b.id}`} className="flex items-center gap-4"><div className="flex size-14 shrink-0 items-center justify-center bg-slate-900 text-lg font-black text-white">{b.name.slice(0,1)}</div><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="font-black hover:underline">{b.name}</h3><span className="border border-slate-300 px-1.5 py-0.5 text-[10px] font-black">{b.boxerClass}</span></div><p className="mt-1 truncate text-xs font-bold text-slate-600">{b.division}｜{b.gym}</p><p className="mt-1 text-[11px] text-slate-400">{b.prefecture}｜プロフィール →</p></div></Link>
          <div><p className="text-sm font-black">{b.totalBouts}戦 {b.wins}勝（{b.koWins}KO）{b.losses}敗{b.draws?` ${b.draws}分`:""}</p><p className="mt-1 text-xs font-black text-blue-800">{b.rankings.length?b.rankings.map(r=>`${r.body} ${r.rank??r.title}`).join(" / "):"ランキングなし"}</p></div>
          <div className="text-sm font-black"><span className="mr-2 text-[10px] text-slate-400 lg:hidden">構え</span>{b.stance}</div>
          <div className="grid grid-cols-2 gap-2 text-xs lg:block"><p><span className="text-slate-400">最終 </span><b>{b.lastBout}</b></p><p className="lg:mt-1"><span className="text-slate-400">次戦 </span><b>{b.nextBout??"未定"}</b></p></div>
          <div><span className={`inline-flex px-2.5 py-1 text-xs font-black ring-1 ring-inset ${badge[b.status]}`}>{b.status}</span><p className="mt-2 text-[11px] font-bold text-slate-500">ジム確認：{b.verified}</p></div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 border-l-2 border-slate-900 pl-3 text-xs"><p><span className="text-slate-400">時期 </span><b>{b.available}</b></p><p><span className="text-slate-400">希望 </span><b>{b.rounds.map(v=>`${v}R`).join(" / ")}</b></p><p><span className="text-slate-400">契約 </span><b>{b.minWeight}〜{b.maxWeight}kg</b></p><p><span className="text-slate-400">遠征 </span><b>{b.travel}</b></p></div>
        </article>)}
        {!filtered.length&&<div className="py-16 text-center"><p className="font-black">条件に一致する選手はいません</p><button className="mt-4 text-sm font-black underline" onClick={reset}>条件をすべて解除</button></div>}
      </div>
    </main>
  </>;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-1.5 block text-[11px] font-black text-slate-500">{label}</span>{children}</label>}
function Select({label,value,onChange,values}:{label:string;value:string;onChange:(v:string)=>void;values:string[]}){return <Field label={label}><select className="input" value={value} onChange={e=>onChange(e.target.value)}>{values.map(v=><option key={v} value={v}>{/^\d+$/.test(v)?`${v}R`:v}</option>)}</select></Field>}
