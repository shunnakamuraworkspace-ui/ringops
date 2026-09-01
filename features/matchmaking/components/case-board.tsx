"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ContextPanel, StatusMark, StatusTrack } from "@/components/ops-ui";
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

const defaults:CaseItem[]=[
  {id:"demo-1",boxerAId:"20000000-0000-4000-8000-000000000001",boxerA:"山田 直樹",boxerBId:"20000000-0000-4000-8000-000000000002",boxerB:"佐藤 海斗",event:"RING NIGHT 27",date:"2026-11-20",venue:"後楽園ホール",weight:"55.0kg",rounds:6,message:"相手ジムから契約ウェイトの回答待ち。",status:"交渉中",createdAt:"2026-08-31T10:14:00.000Z"},
  {id:"demo-2",boxerAId:"20000000-0000-4000-8000-000000000007",boxerA:"藤本 美咲",boxerBId:null,boxerB:"対戦候補A",event:"RING NIGHT 27",date:"2026-11-20",venue:"後楽園ホール",weight:"50.5kg",rounds:6,message:"両ジムの最終確認待ち。",status:"ジム確認待ち",createdAt:"2026-08-30T15:20:00.000Z"},
  {id:"demo-3",boxerAId:"20000000-0000-4000-8000-000000000005",boxerA:"中村 拓海",boxerBId:"20000000-0000-4000-8000-000000000008",boxerB:"マルコ・サントス",event:"WINTER BOXING",date:"2026-12-05",venue:"有明アリーナ",weight:"59.0kg",rounds:8,message:"両者承認済み。興行カードへ反映済み。",status:"決定",createdAt:"2026-08-28T09:00:00.000Z"},
];
const dbToJa:Record<string,string>={recruiting:"募集中",consulting:"相談中",negotiating:"交渉中",gym_confirmation_pending:"ジム確認待ち",provisional:"内定",confirmed:"決定",cancelled:"中止"};
const jaToDb:Record<string,string>=Object.fromEntries(Object.entries(dbToJa).map(([key,value])=>[value,key]));
const editableOptions=["募集中","相談中","交渉中","ジム確認待ち","内定","中止"];
const rerecruitable=new Set(["相談中","交渉中","ジム確認待ち","内定"]);
const progressStages=["相談中","交渉中","ジム確認待ち","内定","決定"];

export function CaseBoard({ databaseConnected, industryMode }: { databaseConnected:boolean; industryMode:boolean }) {
  const router=useRouter();
  const reviewMode=!databaseConnected||!industryMode;
  const [items,setItems]=useState<CaseItem[]>(reviewMode?defaults:[]);
  const [loading,setLoading]=useState(databaseConnected&&industryMode);
  const [error,setError]=useState("");
  const [busyId,setBusyId]=useState("");
  const [recruitCaseId,setRecruitCaseId]=useState("");
  const [selectedId,setSelectedId]=useState(defaults[0]?.id??"");

  useEffect(()=>{
    if(reviewMode){
      try{
        const saved=JSON.parse(localStorage.getItem("ringops_cases")||"[]") as CaseItem[];
        if(saved.length)setItems([...saved,...defaults.filter(item=>!saved.some(savedItem=>savedItem.id===item.id))]);
      }catch{}
      return;
    }
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
        if(active){setItems(mapped);setSelectedId(mapped[0]?.id??"");}
      }catch{
        if(active)setError("案件を読み込めませんでした。RLSとSupabase設定を確認してください。");
      }finally{
        if(active)setLoading(false);
      }
    })();
    return()=>{active=false};
  },[databaseConnected,industryMode,reviewMode]);

  const selected=useMemo(()=>items.find(item=>item.id===selectedId)??items[0]??null,[items,selectedId]);

  async function update(id:string,status:string){
    const previous=items;
    const next=items.map(item=>item.id===id?{...item,status}:item);
    setItems(next);setError("");
    if(reviewMode){
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
      if(reviewMode){setItems(current=>current.map(item=>item.id===id?{...item,status:"決定"}:item));return;}
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
      if(reviewMode){
        localStorage.setItem("ringops_rerecruit_draft",JSON.stringify({sourceCaseId:item.id,targetBoxerId,event:item.event,date:item.date,venue:item.venue,weight:item.weight,rounds:item.rounds,note:item.message}));
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

  if(loading)return <div className="border-y border-[var(--ringops-line-strong)] bg-white px-5 py-12 text-center text-sm font-bold text-slate-500">案件を読み込んでいます…</div>;

  return (
    <div className="border-y border-[var(--ringops-line-strong)] bg-white">
      {error?<div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-xs font-bold text-rose-800">{error}</div>:null}
      <div className="grid lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <div className="hidden grid-cols-[72px_1.45fr_1.1fr_.8fr_1fr] gap-3 border-b border-[var(--ringops-line-strong)] bg-[#f8f8f5] px-4 py-2.5 text-[9px] font-black uppercase tracking-[.06em] text-slate-400 md:grid">
            <span>案件</span><span>選手</span><span>興行</span><span>条件</span><span>状態</span>
          </div>
          {items.map(item=>(
            <button type="button" onClick={()=>setSelectedId(item.id)} className={`ops-row grid w-full gap-2 px-4 py-3 text-left md:grid-cols-[72px_1.45fr_1.1fr_.8fr_1fr] md:items-center md:gap-3 ${selected?.id===item.id?"bg-[#f4f7f8] shadow-[inset_3px_0_0_var(--ringops-accent)]":""}`} key={item.id}>
              <div><span className="font-mono text-[11px] font-black text-slate-400">#{item.id.replace("demo-","").slice(0,6).toUpperCase()}</span></div>
              <div className="min-w-0"><b className="block truncate text-[13px]">{matchLabel(item)}</b><p className="mt-1 text-[10px] text-slate-400 md:hidden">{item.event} · {item.date}</p></div>
              <div className="hidden min-w-0 md:block"><p className="truncate text-[11px] font-bold">{item.event||"興行未設定"}</p><p className="mt-1 truncate text-[9px] text-slate-400">{item.date||"日程未設定"}{item.venue?` · ${item.venue}`:""}</p></div>
              <div className="hidden md:block"><p className="text-[11px] font-black">{item.weight||"—"}</p><p className="mt-1 text-[9px] text-slate-400">{item.rounds?`${item.rounds}R`:"R未定"}</p></div>
              <div className="flex items-center justify-between gap-3 md:block"><StatusMark label={item.status} tone={caseTone(item.status)} compact /><span className="text-[10px] font-black text-[var(--ringops-accent)] md:hidden">詳細 →</span></div>
            </button>
          ))}
          {!items.length?<div className="px-5 py-12 text-center text-sm font-bold text-slate-500">現在の案件はありません。</div>:null}
        </section>

        {selected?<ContextPanel title={matchLabel(selected)} kicker={`MATCH #${selected.id.replace("demo-","").slice(0,8).toUpperCase()}`} footer={<PanelActions item={selected} busyId={busyId} recruitCaseId={recruitCaseId} setRecruitCaseId={setRecruitCaseId} update={update} approve={approve} rerecruit={rerecruit} />}>
          <StatusMark label={selected.status} tone={caseTone(selected.status)} />
          <div className="mt-5"><StatusTrack steps={progressStages} current={selected.status} /></div>

          <dl className="mt-6 border-t border-[var(--ringops-line-strong)] text-[11px]">
            <InfoRow label="興行" value={selected.event||"未設定"} />
            <InfoRow label="日程" value={selected.date||"未設定"} />
            <InfoRow label="会場" value={selected.venue||"未設定"} />
            <InfoRow label="契約" value={`${selected.weight||"—"} / ${selected.rounds?`${selected.rounds}R`:"R未定"}`} />
          </dl>

          <div className="mt-6 border-t border-[var(--ringops-line-strong)] pt-4">
            <p className="ops-label">次の操作</p>
            <p className="mt-2 text-sm font-black leading-6">{nextAction(selected.status)}</p>
          </div>

          <div className="mt-6 border-t border-[var(--ringops-line)] pt-4">
            <p className="ops-label">交渉メモ</p>
            <p className="mt-2 text-[11px] leading-5 text-slate-600">{selected.message||"メモはありません。"}</p>
            <p className="mt-3 text-[9px] font-bold text-slate-400">開始 {formatDateTime(selected.createdAt)}</p>
          </div>
        </ContextPanel>:null}
      </div>
    </div>
  );
}

function PanelActions({item,busyId,recruitCaseId,setRecruitCaseId,update,approve,rerecruit}:{item:CaseItem;busyId:string;recruitCaseId:string;setRecruitCaseId:(value:string)=>void;update:(id:string,status:string)=>Promise<void>;approve:(id:string)=>Promise<void>;rerecruit:(item:CaseItem,targetBoxerId:string)=>Promise<void>}){
  const targets=[{id:item.boxerAId,name:item.boxerA},{id:item.boxerBId,name:item.boxerB}].filter((value):value is {id:string;name:string}=>Boolean(value.id&&value.name));
  const canRerecruit=rerecruitable.has(item.status)&&targets.length>0;

  if(item.status==="決定")return <div className="flex items-center justify-between"><StatusMark label="試合決定" tone="confirmed" /><span className="text-[10px] font-bold text-slate-400">興行へ反映</span></div>;

  return <div>
    <p className="ops-label mb-2">状態を更新</p>
    <div className="flex gap-2"><select className="input h-9 text-xs font-bold" value={item.status} onChange={e=>void update(item.id,e.target.value)}>{editableOptions.map(value=><option key={value}>{value}</option>)}</select>{["ジム確認待ち","内定"].includes(item.status)?<button className="ops-primary h-9 shrink-0" disabled={busyId===item.id} onClick={()=>void approve(item.id)}>承認</button>:null}</div>
    {canRerecruit?<div className="mt-4 border-t border-[var(--ringops-line)] pt-3">{recruitCaseId!==item.id?<button className="ops-text-action" onClick={()=>setRecruitCaseId(item.id)}>対戦相手を再募集</button>:<div><p className="mb-2 text-[10px] font-bold text-slate-400">残す選手を選択</p><div className="flex flex-wrap gap-2">{targets.map(target=><button className="ops-secondary h-8 px-2" disabled={busyId===item.id} key={target.id} onClick={()=>void rerecruit(item,target.id)}>{target.name}</button>)}<button className="px-1 text-[10px] text-slate-400 underline" onClick={()=>setRecruitCaseId("")}>取消</button></div></div>}</div>:null}
  </div>;
}

function InfoRow({label,value}:{label:string;value:string}){return <div className="grid grid-cols-[64px_1fr] gap-3 border-b border-[var(--ringops-line)] py-2.5"><dt className="font-bold text-slate-400">{label}</dt><dd className="font-black text-slate-700">{value}</dd></div>}
function matchLabel(item:CaseItem){if(item.boxerA&&item.boxerB)return`${item.boxerA} vs ${item.boxerB}`;return item.boxerA??item.boxerB??"対戦候補未設定";}
function caseTone(status:string):"negotiating"|"pending"|"confirmed"|"paused"|"neutral"{if(status==="交渉中")return"negotiating";if(status==="ジム確認待ち"||status==="内定")return"pending";if(status==="決定")return"confirmed";if(status==="中止")return"paused";return"neutral";}
function nextAction(status:string){if(status==="相談中")return"相手ジムの一次回答を確認する";if(status==="交渉中")return"契約条件を確定し、ジム確認へ進める";if(status==="ジム確認待ち")return"両ジムの承認をそろえる";if(status==="内定")return"最終承認後、試合決定にする";if(status==="決定")return"興行カードの情報を確認する";if(status==="中止")return"必要なら条件を引き継いで再募集する";return"条件を整理して相談を進める";}
function formatDateTime(value:string){const date=new Date(value);return Number.isNaN(date.getTime())?value:new Intl.DateTimeFormat("ja-JP",{month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(date);}
