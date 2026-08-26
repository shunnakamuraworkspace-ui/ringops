"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BoxerPreview } from "@/features/boxers/data/preview-boxers";
import { createClient } from "@/lib/supabase/client";

export function ConsultationForm({ boxer, databaseConnected }: { boxer: BoxerPreview; databaseConnected: boolean }) {
  const router=useRouter(); const [sent,setSent]=useState(false); const [saving,setSaving]=useState(false); const [error,setError]=useState("");
  const [event,setEvent]=useState(""); const [date,setDate]=useState(""); const [weight,setWeight]=useState(""); const [rounds,setRounds]=useState("6"); const [message,setMessage]=useState("");

  async function submit(e:React.FormEvent){
    e.preventDefault(); setSaving(true); setError("");
    try {
      if (databaseConnected) {
        const supabase=createClient();
        const { data, error: rpcError }=await supabase.schema("ringops").rpc("start_boxer_consultation",{
          p_boxer_id:boxer.id,
          p_event_name:event,
          p_event_date:date,
          p_contract_weight_kg:Number(weight),
          p_rounds:Number(rounds),
          p_message:message,
        });
        if(rpcError) throw rpcError;
        router.push(`/matchmaking?created=${encodeURIComponent(String(data))}`); router.refresh(); return;
      }
      const existing=JSON.parse(localStorage.getItem("ringops_cases")||"[]");
      const item={id:`case-${Date.now()}`,boxer:boxer.name,gym:boxer.gym,event,date,weight:`${weight}kg`,rounds:Number(rounds),message,status:"相談中",createdAt:new Date().toISOString()};
      localStorage.setItem("ringops_cases",JSON.stringify([item,...existing])); setSent(true);
    } catch {
      setError("相談を登録できませんでした。ログイン状態と所属組織を確認してください。");
    } finally { setSaving(false); }
  }

  if(sent)return <div className="border-y-2 border-slate-950 bg-white p-7"><h2 className="text-xl font-black">相談を案件に登録しました</h2><p className="mt-2 text-sm text-slate-500">このプレビューでは端末内に保存しています。Supabase接続時は所属ジムと共有されます。</p><button className="mt-5 h-11 bg-slate-950 px-5 text-sm font-black text-white" onClick={()=>router.push("/matchmaking")}>マッチメイク案件を見る</button></div>;

  return <form className="border-y-2 border-slate-950 bg-white p-5 sm:p-7" onSubmit={submit}>
    {error&&<p className="mb-5 border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</p>}
    <div className="grid gap-5 sm:grid-cols-2"><Field label="対象選手"><input className="input bg-slate-50" disabled value={`${boxer.name} / ${boxer.gym}`}/></Field><Field label="興行名"><input className="input" required value={event} onChange={e=>setEvent(e.target.value)} placeholder="例：11月20日 後楽園興行"/></Field><Field label="希望日"><input className="input" required type="date" value={date} onChange={e=>setDate(e.target.value)}/></Field><Field label="契約ウェイト（kg）"><input className="input" inputMode="decimal" required type="number" step="0.01" min="35" max="150" value={weight} onChange={e=>setWeight(e.target.value)} placeholder="例：55.0"/></Field><Field label="希望R"><select className="input" value={rounds} onChange={e=>setRounds(e.target.value)}>{[4,6,8,10,12].map(v=><option value={v} key={v}>{v}R</option>)}</select></Field></div>
    <Field label="相談内容"><textarea className="mt-1 min-h-32 w-full border border-slate-300 p-3 text-sm outline-none focus:border-slate-950" required value={message} onChange={e=>setMessage(e.target.value)} placeholder="希望条件、対戦候補として確認したい内容を入力"/></Field>
    <div className="mt-5 flex justify-end"><button className="h-12 bg-slate-950 px-6 text-sm font-black text-white disabled:bg-slate-400" disabled={saving} type="submit">{saving?"登録中…":"所属ジムへ相談を開始"}</button></div>
  </form>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="mb-4 block"><span className="mb-1.5 block text-xs font-black text-slate-500">{label}</span>{children}</label>}
