"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CaseItem={
  id:string;
  boxerAId:string|null;
  boxerA:string|null;
  boxerBId:string|null;
  boxerB:string|null;
  event:string;
  date:string;
  venue:string;
  weight:string;
  rounds:number;
  message:string;
  status:string;
  createdAt:string;
};

const defaults:CaseItem[]=[{
  id:"demo-1",boxerAId:null,boxerA:null,boxerBId:"20000000-0000-4000-8000-000000000002",boxerB:"佐藤 海斗",
  event:"9月18日 後楽園",date:"2026-09-18",venue:"後楽園ホール",weight:"55.0kg",rounds:6,message:"条件確認中",status:"交渉中",createdAt:new Date().toISOString(),
}];
const dbToJa:Record<string,string>={recruiting:"募集中",consulting:"相談中",negotiating:"交渉中",gym_confirmation_pending:"ジム確認待ち",provisional:"内定",confirmed:"決定",cancelled:"中止"};
const jaToDb:Record<string,string>=Object.fromEntries(Object.entries(dbToJa).map(([key,value])=>[value,key]));
const editableOptions=["募集中","相談中","交渉中","ジム確認待ち","内定","中止"];
const rerecruitable=new Set(["相談中","交渉中","ジム確認待ち","内定"]);

export function CaseBoard({ databaseConnected, industryMode }: { databaseConnected:boolean; industryMode:boolean }) {
  const router=useRouter();
  const [items,setItems]=useState<CaseItem[]>(databaseConnected?[]:defaults);
  const [loading,setLoading]=useState(databaseConnected&&industryMode);
  const [error,setError]=useState("");
  const [busyId,setBusyId]=useState("");
  const [recruitCaseId,setRecruitCaseId]=useState("");

  useEffect(()=>{
    if(!databaseConnected){
      try{
        const saved=localStorage.getItem("ringops_cases");
        if(saved)setItems([...JSON.parse(saved),...defaults]);
      }catch{/* preview storage only */}
      return;
    }
    if(!industryMode)return;
    let active=true;
    (async()=>{
      try{
        const supabase=createClient();
        const {data:cases,error:caseError}=await supabase.schema("ringops").from("matchmaking_cases")
          .select("id,proposed_event_name,event_date,venue_name,contract_weight_kg,rounds,conditions,status,boxer_a_id,boxer_b_id,created_at")
          .order("updated_at",{ascending:false});
        if(caseError)throw caseError;
        const boxerIds=[...new Set((cases??[]).flatMap(item=>[item.boxer_a_id,item.boxer_b_id]).filter(Boolean))];
        const {data:boxers,error:boxerError}=boxerIds.length
          ? await supabase.schema("ringops").from("boxers").select("id,name").in("id",boxerIds)
          : {data:[],error:null};
        if(boxerError)throw boxerError;
        const boxerMap=new Map((boxers??[]).map(boxer=>[boxer.id,boxer.name]));
        const mapped:CaseItem[]=(cases??[]).map(item=>({
          id:item.id,boxerAId:item.boxer_a_id,boxerA:item.boxer_a_id?boxerMap.get(item.boxer_a_id)??"選手A":null,
          boxerBId:item.boxer_b_id,boxerB:item.boxer_b_id?boxerMap.get(item.boxer_b_id)??"選手B":null,
          event:item.proposed_event_name??"興行未設定",date:item.event_date??"",venue:item.venue_name??"",weight:item.contract_weight_kg!=null?`${item.contract_weight_kg}kg`:"—",
          rounds:item.rounds??0,message:item.conditions??"",status:dbToJa[item.status]??item.status,createdAt:item.created_at,
        }));
        if(active)setItems(mapped);
      }catch{
        if(active)setError("案件を読み込めませんでした。RLSとSupabase設定を確認してください。");
      }finally{
        if(active)setLoading(false);
      }
    })();
    return()=>{active=false};
  },[databaseConnected,industryMode]);

  async function update(id:string,status:string){
    const previous=items;
    setItems(items.map(item=>item.id===id?{...item,status}:item));setError("");
    if(!databaseConnected){
      const next=items.map(item=>item.id===id?{...item,status}:item);
      localStorage.setItem("ringops_cases",JSON.stringify(next.filter(item=>!item.id.startsWith("demo-"))));
      return;
    }
    try{
      const supabase=createClient();
      const {error:updateError}=await supabase.schema("ringops").from("matchmaking_cases").update({status:jaToDb[status]}).eq("id",id);
      if(updateError)throw updateError;
    }catch{
      setItems(previous);setError("進捗を更新できませんでした。権限を確認してください。");
    }
  }

  async function approve(id:string){
    setError("");setBusyId(id);
    try{
      if(!databaseConnected){setItems(current=>current.map(item=>item.id===id?{...item,status:"決定"}:item));return;}
      const supabase=createClient();
      const {error:approveError}=await supabase.schema("ringops").rpc("set_case_approval",{p_case_id:id,p_approved:true});
      if(approveError)throw approveError;
      const {data}=await supabase.schema("ringops").from("matchmaking_cases").select("status").eq("id",id).single();
      setItems(current=>current.map(item=>item.id===id?{...item,status:dbToJa[data?.status??""]??item.status}:item));
    }catch{
      setError("承認できませんでした。対象ジムの権限を確認してください。");
    }finally{
      setBusyId("");
    }
  }

  async function rerecruit(item:CaseItem,targetBoxerId:string){
    setError("");setBusyId(item.id);
    try{
      if(!databaseConnected){
        localStorage.setItem("ringops_rerecruit_draft",JSON.stringify({
          sourceCaseId:item.id,targetBoxerId,event:item.event,date:item.date,venue:item.venue,weight:item.weight,rounds:item.rounds,note:item.message,
        }));
        setItems(current=>current.map(value=>value.id===item.id?{...value,status:"中止"}:value));
        router.push("/open-matches?fromCase=1");
        return;
      }
      const supabase=createClient();
      const {data,error:rpcError}=await supabase.schema("ringops").rpc("reopen_case_as_open_match",{p_case_id:item.id,p_target_boxer_id:targetBoxerId});
      if(rpcError)throw rpcError;
      router.push(`/open-matches?reopened=${encodeURIComponent(String(data))}`);
    }catch{
      setError("再募集を作成できませんでした。案件権限と対象選手を確認してください。");
    }finally{
      setBusyId("");setRecruitCaseId("");
    }
  }

  if(loading)return <div className="border-y-2 border-slate-950 bg-white px-5 py-12 text-center text-sm font-bold text-slate-500">案件を読み込んでいます…</div>;
  if(databaseConnected&&!industryMode)return <div className="border-y-2 border-slate-950 bg-white px-5 py-12 text-center text-sm font-bold text-slate-500">業界アカウントでログインすると案件を表示します。</div>;

  return <div className="border-y-2 border-slate-950 bg-white">
    {error&&<div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-xs font-bold text-rose-800">{error}</div>}
    <div className="hidden grid-cols-[1.6fr_1.35fr_1fr_.7fr_1.5fr] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-black text-slate-500 md:grid"><span>対戦候補</span><span>興行 / 日程</span><span>条件</span><span>R</span><span>進捗 / 操作</span></div>
    {items.map(item=>{
      const targets=[{id:item.boxerAId,name:item.boxerA},{id:item.boxerBId,name:item.boxerB}].filter((value):value is {id:string;name:string}=>Boolean(value.id&&value.name));
      const canRerecruit=rerecruitable.has(item.status)&&targets.length>0;
      return <article className="grid gap-3 border-b border-slate-200 px-5 py-5 last:border-0 md:grid-cols-[1.6fr_1.35fr_1fr_.7fr_1.5fr] md:items-center" key={item.id}>
        <div><b>{matchLabel(item)}</b><p className="mt-1 text-xs text-slate-500">案件ID {item.id.slice(0,8)}</p></div>
        <div><b className="text-sm">{item.event||"興行未設定"}</b><p className="mt-1 text-xs text-slate-500">{item.date||"日程未設定"}{item.venue?`｜${item.venue}`:""}</p></div>
        <div><b className="text-sm">{item.weight||"—"}</b>{item.message&&<p className="mt-1 line-clamp-2 text-[10px] text-slate-400">{item.message}</p>}</div>
        <b>{item.rounds?`${item.rounds}R`:"—"}</b>
        <div>
          <div className="flex gap-2">{item.status==="決定"?<span className="flex h-10 flex-1 items-center justify-center bg-emerald-50 px-3 text-xs font-black text-emerald-800">試合決定</span>:<><select className="h-10 min-w-0 flex-1 border border-slate-300 px-2 text-xs font-bold" value={item.status} onChange={e=>update(item.id,e.target.value)}>{editableOptions.map(value=><option key={value}>{value}</option>)}</select>{["ジム確認待ち","内定"].includes(item.status)&&<button className="h-10 shrink-0 border border-slate-950 px-3 text-xs font-black disabled:opacity-50" disabled={busyId===item.id} onClick={()=>approve(item.id)}>自組織で承認</button>}</>}</div>
          {canRerecruit&&<div className="mt-2 border-t border-slate-100 pt-2">{recruitCaseId!==item.id?<button className="text-[10px] font-black text-slate-600 underline underline-offset-4" onClick={()=>setRecruitCaseId(item.id)}>対戦相手を再募集</button>:<div><p className="mb-1.5 text-[10px] font-bold text-slate-400">残す選手を選択</p><div className="flex flex-wrap gap-1.5">{targets.map(target=><button className="border border-slate-300 px-2 py-1 text-[10px] font-black hover:border-slate-950 disabled:opacity-50" disabled={busyId===item.id} key={target.id} onClick={()=>rerecruit(item,target.id)}>{target.name}を残す</button>)}<button className="px-1 text-[10px] text-slate-400 underline" onClick={()=>setRecruitCaseId("")}>取消</button></div></div>}</div>}
        </div>
      </article>;
    })}
    {!items.length&&<div className="px-5 py-12 text-center text-sm font-bold text-slate-500">現在の案件はありません。</div>}
  </div>;
}

function matchLabel(item:CaseItem){if(item.boxerA&&item.boxerB)return`${item.boxerA} vs ${item.boxerB}`;return item.boxerA??item.boxerB??"対戦候補未設定";}
