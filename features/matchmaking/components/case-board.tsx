"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CaseItem={id:string;boxer:string;gym:string;event:string;date:string;weight:string;rounds:number;message:string;status:string;createdAt:string};
const defaults:CaseItem[]=[{id:"demo-1",boxer:"佐藤 海斗",gym:"東都ファイトジム",event:"9月18日 後楽園",date:"2026-09-18",weight:"55.0kg",rounds:6,message:"条件確認中",status:"交渉中",createdAt:new Date().toISOString()}];
const dbToJa:Record<string,string>={recruiting:"募集中",consulting:"相談中",negotiating:"交渉中",gym_confirmation_pending:"ジム確認待ち",provisional:"内定",confirmed:"決定",cancelled:"中止"};
const jaToDb:Record<string,string>=Object.fromEntries(Object.entries(dbToJa).map(([key,value])=>[value,key]));
const editableOptions=["募集中","相談中","交渉中","ジム確認待ち","内定","中止"];

export function CaseBoard({ databaseConnected, industryMode }: { databaseConnected:boolean; industryMode:boolean }) {
  const [items,setItems]=useState<CaseItem[]>(databaseConnected?[]:defaults); const [loading,setLoading]=useState(databaseConnected&&industryMode); const [error,setError]=useState("");

  useEffect(()=>{
    if(!databaseConnected){const saved=localStorage.getItem("ringops_cases");if(saved)setItems([...JSON.parse(saved),...defaults]);return;}
    if(!industryMode)return;
    let active=true;
    (async()=>{
      try{
        const supabase=createClient();
        const {data:cases,error:caseError}=await supabase.schema("ringops").from("matchmaking_cases").select("id,proposed_event_name,event_date,contract_weight_kg,rounds,status,boxer_b_id,created_at").order("updated_at",{ascending:false});
        if(caseError)throw caseError;
        const boxerIds=[...new Set((cases??[]).map((item:any)=>item.boxer_b_id).filter(Boolean))];
        const {data:boxers}=boxerIds.length?await supabase.schema("ringops").from("boxers").select("id,name").in("id",boxerIds):{data:[]};
        const boxerMap=new Map((boxers??[]).map((b:any)=>[b.id,b.name]));
        const mapped:CaseItem[]=(cases??[]).map((item:any)=>({id:item.id,boxer:boxerMap.get(item.boxer_b_id)??"対戦候補",gym:"関係ジム",event:item.proposed_event_name??"興行未設定",date:item.event_date??"",weight:item.contract_weight_kg!=null?`${item.contract_weight_kg}kg`:"—",rounds:item.rounds??0,message:"",status:dbToJa[item.status]??item.status,createdAt:item.created_at}));
        if(active)setItems(mapped);
      }catch{if(active)setError("案件を読み込めませんでした。RLSとSupabase設定を確認してください。")}
      finally{if(active)setLoading(false)}
    })();
    return()=>{active=false};
  },[databaseConnected,industryMode]);

  async function update(id:string,status:string){
    const previous=items; setItems(items.map(i=>i.id===id?{...i,status}:i)); setError("");
    if(!databaseConnected){const next=items.map(i=>i.id===id?{...i,status}:i);localStorage.setItem("ringops_cases",JSON.stringify(next.filter(i=>!i.id.startsWith("demo-"))));return;}
    try{const supabase=createClient();const {error:updateError}=await supabase.schema("ringops").from("matchmaking_cases").update({status:jaToDb[status]}).eq("id",id);if(updateError)throw updateError;}
    catch{setItems(previous);setError("進捗を更新できませんでした。権限を確認してください。");}
  }

  async function approve(id:string){
    setError("");
    if(!databaseConnected){setItems(current=>current.map(i=>i.id===id?{...i,status:"決定"}:i));return;}
    try{const supabase=createClient();const {error:approveError}=await supabase.schema("ringops").rpc("set_case_approval",{p_case_id:id,p_approved:true});if(approveError)throw approveError;const {data}=await supabase.schema("ringops").from("matchmaking_cases").select("status").eq("id",id).single();setItems(current=>current.map(i=>i.id===id?{...i,status:dbToJa[data?.status??""]??i.status}:i));}
    catch{setError("承認できませんでした。対象ジムの権限を確認してください。");}
  }

  if(loading)return <div className="border-y-2 border-slate-950 bg-white px-5 py-12 text-center text-sm font-bold text-slate-500">案件を読み込んでいます…</div>;
  if(databaseConnected&&!industryMode)return <div className="border-y-2 border-slate-950 bg-white px-5 py-12 text-center text-sm font-bold text-slate-500">業界アカウントでログインすると案件を表示します。</div>;

  return <div className="border-y-2 border-slate-950 bg-white">{error&&<div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-xs font-bold text-rose-800">{error}</div>}<div className="hidden grid-cols-[1.35fr_1.35fr_1fr_.7fr_1.35fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-black text-slate-500 md:grid"><span>選手 / ジム</span><span>興行 / 日程</span><span>条件</span><span>R</span><span>進捗 / 承認</span></div>{items.map(i=><article className="grid gap-3 border-b border-slate-200 px-5 py-5 last:border-0 md:grid-cols-[1.35fr_1.35fr_1fr_.7fr_1.35fr] md:items-center" key={i.id}><div><b>{i.boxer}</b><p className="mt-1 text-xs text-slate-500">{i.gym}</p></div><div><b className="text-sm">{i.event||"興行未設定"}</b><p className="mt-1 text-xs text-slate-500">{i.date||"日程未設定"}</p></div><b className="text-sm">{i.weight||"—"}</b><b>{i.rounds?`${i.rounds}R`:"—"}</b><div className="flex gap-2">{i.status==="決定"?<span className="flex h-10 flex-1 items-center justify-center bg-emerald-50 px-3 text-xs font-black text-emerald-800">試合決定</span>:<><select className="h-10 min-w-0 flex-1 border border-slate-300 px-2 text-xs font-bold" value={i.status} onChange={e=>update(i.id,e.target.value)}>{editableOptions.map(v=><option key={v}>{v}</option>)}</select>{["ジム確認待ち","内定"].includes(i.status)&&<button className="h-10 shrink-0 border border-slate-950 px-3 text-xs font-black" onClick={()=>approve(i.id)}>自組織で承認</button>}</>}</div></article>)}{!items.length&&<div className="px-5 py-12 text-center text-sm font-bold text-slate-500">現在の案件はありません。</div>}</div>;
}
