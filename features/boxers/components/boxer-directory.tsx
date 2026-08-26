"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { divisions, type BoxerPreview } from "../data/preview-boxers";

const badge: Record<BoxerPreview["status"], string> = {
  "受付中": "bg-emerald-50 text-emerald-800 ring-emerald-600/20",
  "条件次第": "bg-amber-50 text-amber-900 ring-amber-600/20",
  "受付停止": "bg-slate-100 text-slate-500 ring-slate-500/20",
};

type SearchFilters = {
  q: string;
  division: string;
  klass: string;
  stance: string;
  status: string;
  rounds: string;
  ranking: string;
  rankMax: string;
  nextBout: string;
  month: string;
  minWeight: string;
  maxWeight: string;
  minBouts: string;
  maxBouts: string;
  minWins: string;
  minKoWins: string;
  undefeated: string;
  lastBoutAge: string;
  travel: string;
};

type SavedSearch = {
  id: string;
  name: string;
  filters: SearchFilters;
};

type Props = {
  boxers: BoxerPreview[];
  databaseConnected: boolean;
  industryMode: boolean;
  initialDivision?: string;
  initialClass?: string;
  initialRounds?: string;
};

const defaultFilters: SearchFilters = {
  q: "",
  division: "すべて",
  klass: "すべて",
  stance: "すべて",
  status: "相談可",
  rounds: "すべて",
  ranking: "すべて",
  rankMax: "",
  nextBout: "すべて",
  month: "",
  minWeight: "",
  maxWeight: "",
  minBouts: "",
  maxBouts: "",
  minWins: "",
  minKoWins: "",
  undefeated: "すべて",
  lastBoutAge: "すべて",
  travel: "すべて",
};

export function BoxerDirectory({
  boxers,
  databaseConnected,
  industryMode,
  initialDivision,
  initialClass,
  initialRounds,
}: Props) {
  const [q,setQ]=useState("");
  const [division,setDivision]=useState(initialDivision && divisions.includes(initialDivision) ? initialDivision : "すべて");
  const [klass,setKlass]=useState(initialClass && ["A級","B級","C級"].includes(initialClass) ? initialClass : "すべて");
  const [stance,setStance]=useState("すべて");
  const [status,setStatus]=useState("相談可");
  const [rounds,setRounds]=useState(initialRounds && ["4","6","8","10","12","4R","6R","8R","10R","12R"].includes(initialRounds) ? initialRounds.replace("R","") : "すべて");
  const [ranking,setRanking]=useState("すべて");
  const [rankMax,setRankMax]=useState("");
  const [nextBout,setNextBout]=useState("すべて");
  const [month,setMonth]=useState("");
  const [minWeight,setMinWeight]=useState("");
  const [maxWeight,setMaxWeight]=useState("");
  const [minBouts,setMinBouts]=useState("");
  const [maxBouts,setMaxBouts]=useState("");
  const [minWins,setMinWins]=useState("");
  const [minKoWins,setMinKoWins]=useState("");
  const [undefeated,setUndefeated]=useState("すべて");
  const [lastBoutAge,setLastBoutAge]=useState("すべて");
  const [travel,setTravel]=useState("すべて");

  const currentFilters: SearchFilters = {
    q, division, klass, stance, status, rounds, ranking, rankMax, nextBout, month,
    minWeight, maxWeight, minBouts, maxBouts, minWins, minKoWins, undefeated,
    lastBoutAge, travel,
  };

  const filtered=useMemo(()=>boxers.filter(b=>{
    const text=q.trim().toLowerCase();
    const queryOk=!text||[b.name,b.kana,b.gym,b.prefecture,b.nationality].some(v=>v.toLowerCase().includes(text));
    const rankLimit=rankMax?Number(rankMax):null;
    const rankingOk=ranking==="すべて"
      || (ranking==="ランカー"?b.rankings.length>0:b.rankings.some(r=>r.body===ranking&&(rankLimit===null||(r.rank!==null&&r.rank<=rankLimit))));
    const nextOk=nextBout==="すべて"||(nextBout==="次戦あり"?Boolean(b.nextBout):!b.nextBout);
    const minB=minBouts?Number(minBouts):null;
    const maxB=maxBouts?Number(maxBouts):null;
    const minWn=minWins?Number(minWins):null;
    const minKo=minKoWins?Number(minKoWins):null;
    const recordOk=(minB===null||b.totalBouts>=minB)&&(maxB===null||b.totalBouts<=maxB)&&(minWn===null||b.wins>=minWn)&&(minKo===null||b.koWins>=minKo)&&(undefeated==="すべて"||b.losses===0);
    const lastBoutOk=matchesLastBoutAge(b.lastBout,lastBoutAge);
    if (!industryMode) return queryOk && (division==="すべて"||b.division===division) && (klass==="すべて"||b.boxerClass===klass) && (stance==="すべて"||b.stance===stance) && rankingOk && nextOk && recordOk && lastBoutOk;
    const statusOk=status==="すべて"||(status==="相談可"?b.status!=="受付停止":b.status===status);
    const monthOk=!month||(!b.availableMonth?false:b.availableMonth<=month);
    const minW=minWeight?Number(minWeight):null;
    const maxW=maxWeight?Number(maxWeight):null;
    const weightOk=(minW===null||b.maxWeight>=minW)&&(maxW===null||b.minWeight<=maxW);
    const travelOk=travel==="すべて"||matchesTravel(b.travel,travel);
    return queryOk && (division==="すべて"||b.division===division) && (klass==="すべて"||b.boxerClass===klass) && (stance==="すべて"||b.stance===stance) && (rounds==="すべて"||b.rounds.includes(Number(rounds))) && statusOk && rankingOk && nextOk && monthOk && weightOk && recordOk && lastBoutOk && travelOk;
  }),[boxers,q,division,klass,stance,status,rounds,ranking,rankMax,nextBout,month,minWeight,maxWeight,minBouts,maxBouts,minWins,minKoWins,undefeated,lastBoutAge,travel,industryMode]);

  function applyFilters(filters: SearchFilters) {
    const value={...defaultFilters,...filters};
    setQ(value.q); setDivision(value.division); setKlass(value.klass); setStance(value.stance);
    setStatus(value.status); setRounds(value.rounds); setRanking(value.ranking); setRankMax(value.rankMax);
    setNextBout(value.nextBout); setMonth(value.month); setMinWeight(value.minWeight); setMaxWeight(value.maxWeight);
    setMinBouts(value.minBouts); setMaxBouts(value.maxBouts); setMinWins(value.minWins); setMinKoWins(value.minKoWins);
    setUndefeated(value.undefeated); setLastBoutAge(value.lastBoutAge); setTravel(value.travel);
  }

  const reset=()=>applyFilters(defaultFilters);

  return <>
    <section className="border-b border-slate-200 bg-white"><div className="mx-auto max-w-[1480px] px-4 py-5 lg:px-7">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <Field label="選手名・ジム・地域"><input className="input" value={q} onChange={e=>setQ(e.target.value)} placeholder="選手名、所属ジム、都道府県" /></Field>
        <Select label="階級" value={division} onChange={setDivision} values={["すべて",...divisions]} />
        <Select label="クラス" value={klass} onChange={setKlass} values={["すべて","A級","B級","C級"]} />
        <Select label="構え" value={stance} onChange={setStance} values={["すべて","右","左"]} />
        <Select label="ランキング" value={ranking} onChange={setRanking} values={["すべて","ランカー","日本","OPBF","WBO Asia Pacific","WBA","WBC","IBF","WBO"]} />
        <Field label="ランキング上限"><input className="input" inputMode="numeric" min="1" type="number" value={rankMax} onChange={e=>setRankMax(e.target.value)} placeholder="例 15" disabled={ranking==="すべて"||ranking==="ランカー"}/></Field>
      </div>

      <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-2 xl:grid-cols-7">
        <Select label="次戦" value={nextBout} onChange={setNextBout} values={["すべて","次戦あり","次戦未定"]} />
        <Field label="戦数 下限"><input className="input" inputMode="numeric" min="0" type="number" value={minBouts} onChange={e=>setMinBouts(e.target.value)} placeholder="例 5"/></Field>
        <Field label="戦数 上限"><input className="input" inputMode="numeric" min="0" type="number" value={maxBouts} onChange={e=>setMaxBouts(e.target.value)} placeholder="例 12"/></Field>
        <Field label="勝数 下限"><input className="input" inputMode="numeric" min="0" type="number" value={minWins} onChange={e=>setMinWins(e.target.value)} placeholder="例 4"/></Field>
        <Field label="KO勝 下限"><input className="input" inputMode="numeric" min="0" type="number" value={minKoWins} onChange={e=>setMinKoWins(e.target.value)} placeholder="例 2"/></Field>
        <Select label="無敗" value={undefeated} onChange={setUndefeated} values={["すべて","無敗のみ"]} />
        <Select label="最終試合" value={lastBoutAge} onChange={setLastBoutAge} values={["すべて","90日以内","180日以内","365日以内","365日以上"]} />
      </div>

      {industryMode && <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 md:grid-cols-2 xl:grid-cols-7">
        <Select label="受付状況" value={status} onChange={setStatus} values={["相談可","受付中","条件次第","受付停止","すべて"]} />
        <Select label="希望R" value={rounds} onChange={setRounds} values={["すべて","4","6","8","10","12"]} />
        <Field label="試合可能月"><input className="input" type="month" value={month} onChange={e=>setMonth(e.target.value)} /></Field>
        <Field label="契約ウェイト下限"><input className="input" inputMode="decimal" value={minWeight} onChange={e=>setMinWeight(e.target.value)} placeholder="例 53" /></Field>
        <Field label="契約ウェイト上限"><input className="input" inputMode="decimal" value={maxWeight} onChange={e=>setMaxWeight(e.target.value)} placeholder="例 55" /></Field>
        <Select label="遠征" value={travel} onChange={setTravel} values={["すべて","遠征可","要相談","地域限定"]} />
      </div>}

      {(initialDivision||initialClass||initialRounds)&&<div className="mt-3 border-l-2 border-slate-900 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600">対戦相手募集の条件を引き継いでいます。</div>}
      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-3">
        <p className="text-xs font-bold text-slate-500">条件変更は結果へ即反映</p>
        <div className="flex flex-wrap items-end gap-3">
          {industryMode && <SavedSearchControls databaseConnected={databaseConnected} filters={currentFilters} onApply={applyFilters} />}
          <button className="h-9 text-xs font-black text-slate-700 underline underline-offset-4" onClick={reset}>条件をリセット</button>
        </div>
      </div>
    </div></section>

    <main className="mx-auto max-w-[1480px] px-4 py-6 lg:px-7"><div className="mb-3 flex items-end justify-between"><div><p className="text-[11px] font-black tracking-[.14em] text-slate-400">選手名鑑</p><h2 className="mt-1 text-2xl font-black">候補 {filtered.length}名</h2></div><p className="hidden text-xs font-bold text-slate-500 sm:block">{industryMode?"公式情報 + ジム確認情報":"一般公開情報"}</p></div>
      <div className="overflow-hidden border-y-2 border-slate-900 bg-white">
        <div className={`hidden gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-black text-slate-500 lg:grid ${industryMode?"grid-cols-[2.1fr_1.3fr_.55fr_1.1fr_1.05fr_1.55fr]":"grid-cols-[2.2fr_1.4fr_.6fr_1.2fr]"}`}><span>選手</span><span>戦績・ランキング</span><span>構え</span><span>最終 / 次戦</span>{industryMode&&<><span>受付 / 更新</span><span>試合条件</span></>}</div>
        {filtered.map(b=><article className={`grid gap-4 border-b border-slate-200 px-4 py-5 last:border-0 hover:bg-slate-50/80 lg:items-center lg:px-5 ${industryMode?"lg:grid-cols-[2.1fr_1.3fr_.55fr_1.1fr_1.05fr_1.55fr]":"lg:grid-cols-[2.2fr_1.4fr_.6fr_1.2fr]"}`} key={b.id}>
          <Link href={`/boxers/${b.id}`} className="flex items-center gap-4"><div className="flex size-14 shrink-0 items-center justify-center bg-slate-900 text-lg font-black text-white">{b.name.slice(0,1)}</div><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="font-black hover:underline">{b.name}</h3><span className="border border-slate-300 px-1.5 py-0.5 text-[10px] font-black">{b.boxerClass}</span></div><p className="mt-1 truncate text-xs font-bold text-slate-600">{b.division}｜{b.gym}</p><p className="mt-1 text-[11px] text-slate-400">{b.prefecture}｜プロフィール →</p></div></Link>
          <div><p className="text-sm font-black">{b.totalBouts}戦 {b.wins}勝（{b.koWins}KO）{b.losses}敗{b.draws?` ${b.draws}分`:""}</p><p className="mt-1 text-xs font-black text-blue-800">{b.rankings.length?b.rankings.map(r=>`${r.body} ${r.rank??r.title}`).join(" / "):"ランキングなし"}</p></div>
          <div className="text-sm font-black">{b.stance}</div><div className="grid grid-cols-2 gap-2 text-xs lg:block"><p><span className="text-slate-400">最終 </span><b>{b.lastBout}</b></p><p className="lg:mt-1"><span className="text-slate-400">次戦 </span><b>{b.nextBout??"未定"}</b></p></div>
          {industryMode&&<><div><span className={`inline-flex px-2.5 py-1 text-xs font-black ring-1 ring-inset ${badge[b.status]}`}>{b.status}</span><p className="mt-2 text-[11px] font-bold text-slate-500">ジム確認：{b.verified}</p></div><div className="grid grid-cols-2 gap-x-3 gap-y-1 border-l-2 border-slate-900 pl-3 text-xs"><p><span className="text-slate-400">時期 </span><b>{b.available}</b></p><p><span className="text-slate-400">希望 </span><b>{b.rounds.map(v=>`${v}R`).join(" / ")||"—"}</b></p><p><span className="text-slate-400">契約 </span><b>{b.minWeight&&b.maxWeight?`${b.minWeight}〜${b.maxWeight}kg`:"—"}</b></p><p><span className="text-slate-400">遠征 </span><b>{b.travel}</b></p></div></>}
        </article>)}
        {!filtered.length&&<div className="py-16 text-center"><p className="font-black">条件に一致する選手はいません</p><button className="mt-4 text-sm font-black underline" onClick={reset}>条件をすべて解除</button></div>}
      </div>
    </main>
  </>;
}

function SavedSearchControls({
  databaseConnected,
  filters,
  onApply,
}: {
  databaseConnected: boolean;
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
}) {
  const [items,setItems]=useState<SavedSearch[]>([]);
  const [selected,setSelected]=useState("");
  const [name,setName]=useState("");
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState("");

  useEffect(()=>{
    let active=true;
    async function load(){
      if(!databaseConnected){
        try{
          const raw=localStorage.getItem("ringops_saved_searches");
          if(active&&raw)setItems(JSON.parse(raw));
        }catch{/* ignore malformed preview storage */}
        return;
      }
      try{
        const supabase=createClient();
        const {data:userData}=await supabase.auth.getUser();
        if(!userData.user)return;
        const {data,error}=await supabase.schema("ringops").from("saved_searches").select("id,name,filters").eq("user_id",userData.user.id).order("updated_at",{ascending:false});
        if(error)throw error;
        if(active)setItems((data??[]) as SavedSearch[]);
      }catch{if(active)setNotice("保存条件を読み込めませんでした");}
    }
    void load();
    return()=>{active=false};
  },[databaseConnected]);

  async function save(){
    const trimmed=name.trim();
    if(!trimmed){setNotice("保存名を入力してください");return;}
    setBusy(true);setNotice("");
    try{
      if(!databaseConnected){
        const existing=items.find(item=>item.name===trimmed);
        const nextItem:SavedSearch={id:existing?.id??`local-${Date.now()}`,name:trimmed,filters};
        const next=[nextItem,...items.filter(item=>item.name!==trimmed)];
        localStorage.setItem("ringops_saved_searches",JSON.stringify(next));
        setItems(next);setSelected(nextItem.id);setName("");setNotice("検索条件を保存しました");return;
      }
      const supabase=createClient();
      const {data:userData}=await supabase.auth.getUser();
      if(!userData.user)throw new Error("not authenticated");
      const {data,error}=await supabase.schema("ringops").from("saved_searches").upsert({user_id:userData.user.id,name:trimmed,filters},{onConflict:"user_id,name"}).select("id,name,filters").single();
      if(error)throw error;
      const saved=data as SavedSearch;
      setItems([saved,...items.filter(item=>item.id!==saved.id&&item.name!==saved.name)]);
      setSelected(saved.id);setName("");setNotice("検索条件を保存しました");
    }catch{setNotice("検索条件を保存できませんでした");}
    finally{setBusy(false);}
  }

  function apply(id:string){
    setSelected(id);
    const item=items.find(entry=>entry.id===id);
    if(item){onApply({...defaultFilters,...item.filters});setNotice(`${item.name}を反映しました`);}
  }

  async function remove(){
    if(!selected)return;
    const current=items.find(item=>item.id===selected);
    if(!current)return;
    setBusy(true);setNotice("");
    try{
      if(databaseConnected){
        const supabase=createClient();
        const {error}=await supabase.schema("ringops").from("saved_searches").delete().eq("id",selected);
        if(error)throw error;
      }
      const next=items.filter(item=>item.id!==selected);
      if(!databaseConnected)localStorage.setItem("ringops_saved_searches",JSON.stringify(next));
      setItems(next);setSelected("");setNotice("保存条件を削除しました");
    }catch{setNotice("保存条件を削除できませんでした");}
    finally{setBusy(false);}
  }

  return <div className="flex flex-wrap items-end gap-2">
    <label className="block">
      <span className="mb-1 block text-[10px] font-black text-slate-400">保存した条件</span>
      <select className="h-9 min-w-40 border border-slate-300 bg-white px-2 text-xs font-bold" value={selected} onChange={e=>apply(e.target.value)}>
        <option value="">選択</option>
        {items.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}
      </select>
    </label>
    <label className="block">
      <span className="mb-1 block text-[10px] font-black text-slate-400">現在条件を保存</span>
      <input className="h-9 w-40 border border-slate-300 px-2 text-xs outline-none focus:border-slate-950" value={name} onChange={e=>setName(e.target.value)} placeholder="例：11月Sバンタム" maxLength={80}/>
    </label>
    <button className="h-9 border border-slate-950 px-3 text-xs font-black disabled:opacity-40" type="button" disabled={busy} onClick={save}>保存</button>
    <button className="h-9 px-2 text-xs font-bold text-slate-500 underline disabled:opacity-30" type="button" disabled={!selected||busy} onClick={remove}>削除</button>
    {notice&&<span className="pb-2 text-[10px] font-bold text-slate-500">{notice}</span>}
  </div>;
}

function matchesLastBoutAge(value:string,condition:string){
  if(condition==="すべて")return true;
  const timestamp=new Date(`${value.replaceAll(".","-")}T00:00:00`).getTime();
  if(Number.isNaN(timestamp))return false;
  const days=Math.max(0,Math.floor((Date.now()-timestamp)/86400000));
  if(condition==="90日以内")return days<=90;
  if(condition==="180日以内")return days<=180;
  if(condition==="365日以内")return days<=365;
  if(condition==="365日以上")return days>=365;
  return true;
}

function matchesTravel(value:string,condition:string){
  if(condition==="遠征可")return value.includes("可")&&!value.includes("不可");
  if(condition==="要相談")return value.includes("相談");
  if(condition==="地域限定")return !value.includes("可")&&!value.includes("相談")&&value!=="—";
  return true;
}

function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-1.5 block text-[11px] font-black text-slate-500">{label}</span>{children}</label>}
function Select({label,value,onChange,values}:{label:string;value:string;onChange:(v:string)=>void;values:string[]}){return <Field label={label}><select className="input" value={value} onChange={e=>onChange(e.target.value)}>{values.map(v=><option key={v} value={v}>{/^\d+$/.test(v)?`${v}R`:v}</option>)}</select></Field>}
