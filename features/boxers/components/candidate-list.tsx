"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { StatusMark } from "@/components/ops-ui";
import { createClient } from "@/lib/supabase/client";
import type { BoxerPreview } from "../data/preview-boxers";

type CandidateRow = {
  listId: string;
  listName: string;
  boxerId: string;
  name: string;
  gym: string;
  division: string;
  boxerClass: string;
  stance: string;
  record: string;
  status: string;
  verified: string;
  addedAt: string;
};

const divisionLabels: Record<string,string> = {
  atom:"アトム級",atomweight:"アトム級",mini_fly:"ミニフライ級",mini_flyweight:"ミニフライ級",minimum:"ミニマム級",minimumweight:"ミニマム級",light_fly:"ライトフライ級",light_flyweight:"ライトフライ級",fly:"フライ級",flyweight:"フライ級",super_fly:"スーパーフライ級",super_flyweight:"スーパーフライ級",
  bantam:"バンタム級",bantamweight:"バンタム級",super_bantam:"スーパーバンタム級",super_bantamweight:"スーパーバンタム級",feather:"フェザー級",featherweight:"フェザー級",super_feather:"スーパーフェザー級",super_featherweight:"スーパーフェザー級",
  light:"ライト級",lightweight:"ライト級",super_light:"スーパーライト級",super_lightweight:"スーパーライト級",welter:"ウェルター級",welterweight:"ウェルター級",super_welter:"スーパーウェルター級",super_welterweight:"スーパーウェルター級",
  middle:"ミドル級",middleweight:"ミドル級",super_middle:"スーパーミドル級",super_middleweight:"スーパーミドル級",light_heavy:"ライトヘビー級",light_heavyweight:"ライトヘビー級",cruiser:"クルーザー級",cruiserweight:"クルーザー級",heavy:"ヘビー級",heavyweight:"ヘビー級",
};
const statusLabels:Record<string,string>={accepting:"受付中",conditional:"条件次第",paused:"受付停止"};

export function CandidateList({databaseConnected,previewBoxers}:{databaseConnected:boolean;previewBoxers:BoxerPreview[]}) {
  const [rows,setRows]=useState<CandidateRow[]>([]);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [selectedList,setSelectedList]=useState("すべて");
  const [localMode,setLocalMode]=useState(!databaseConnected);

  useEffect(()=>{
    let active=true;
    async function load(){
      setLoading(true);setError("");
      try{
        const loadLocal=()=>{
          const ids=JSON.parse(localStorage.getItem("ringops_candidate_boxers")||"[]") as string[];
          const mapped=ids.map((id)=>previewBoxers.find(boxer=>boxer.id===id)).filter(Boolean).map((boxer,index)=>({
            listId:"preview",listName:"候補選手",boxerId:boxer!.id,name:boxer!.name,gym:boxer!.gym,division:boxer!.division,
            boxerClass:boxer!.boxerClass,stance:boxer!.stance,record:`${boxer!.wins}-${boxer!.losses}${boxer!.draws?`-${boxer!.draws}`:""} / ${boxer!.koWins}KO`,
            status:boxer!.status,verified:boxer!.verified,addedAt:new Date(Date.now()-index*60000).toISOString(),
          }));
          if(active){setRows(mapped);setLocalMode(true);}
        };
        if(!databaseConnected){loadLocal();return;}
        const supabase=createClient();
        const {data:userData}=await supabase.auth.getUser();
        if(!userData.user){loadLocal();return;}
        if(active)setLocalMode(false);
        const {data:lists,error:listError}=await supabase.schema("ringops").from("candidate_lists").select("id,name,updated_at").order("updated_at",{ascending:false});
        if(listError)throw listError;
        const listRows=lists??[];const listIds=listRows.map(item=>item.id);
        if(!listIds.length){if(active)setRows([]);return;}
        const {data:items,error:itemError}=await supabase.schema("ringops").from("candidate_list_boxers").select("list_id,boxer_id,added_at").in("list_id",listIds).order("added_at",{ascending:false});
        if(itemError)throw itemError;
        const itemRows=items??[];const boxerIds=[...new Set(itemRows.map(item=>item.boxer_id))];
        if(!boxerIds.length){if(active)setRows([]);return;}
        const [{data:boxers,error:boxerError},{data:statuses,error:statusError}]=await Promise.all([
          supabase.schema("ringops").from("boxers").select("id,organization_id,name,division_code,boxer_class,stance,total_bouts,wins,losses,draws,ko_wins").in("id",boxerIds),
          supabase.schema("ringops").from("boxer_match_statuses").select("boxer_id,status,verified_at").in("boxer_id",boxerIds),
        ]);
        if(boxerError||statusError)throw boxerError||statusError;
        const orgIds=[...new Set((boxers??[]).map(boxer=>boxer.organization_id))];
        const {data:organizations,error:orgError}=orgIds.length?await supabase.schema("ringops").from("organizations").select("id,display_name").in("id",orgIds):{data:[],error:null};
        if(orgError)throw orgError;
        const listMap=new Map(listRows.map(item=>[item.id,item.name]));const boxerMap=new Map((boxers??[]).map(boxer=>[boxer.id,boxer]));const statusMap=new Map((statuses??[]).map(status=>[status.boxer_id,status]));const orgMap=new Map((organizations??[]).map(org=>[org.id,org.display_name]));
        const mapped:CandidateRow[]=itemRows.flatMap(item=>{
          const boxer=boxerMap.get(item.boxer_id);if(!boxer)return [];
          const status=statusMap.get(item.boxer_id);
          return [{listId:item.list_id,listName:listMap.get(item.list_id)??"候補選手",boxerId:boxer.id,name:boxer.name,gym:orgMap.get(boxer.organization_id)??"所属ジム",division:divisionLabels[boxer.division_code]??boxer.division_code,boxerClass:`${boxer.boxer_class}級`,stance:boxer.stance==="southpaw"?"左":"右",record:`${boxer.wins}-${boxer.losses}${boxer.draws?`-${boxer.draws}`:""} / ${boxer.ko_wins}KO`,status:status?statusLabels[status.status]??status.status:"未確認",verified:status?.verified_at?relativeDate(status.verified_at):"未確認",addedAt:item.added_at}];
        });
        if(active)setRows(mapped);
      }catch{if(active)setError("候補選手を読み込めませんでした。");}
      finally{if(active)setLoading(false);}
    }
    void load();return()=>{active=false};
  },[databaseConnected,previewBoxers]);

  const listNames=useMemo(()=>[...new Set(rows.map(row=>row.listName))],[rows]);
  const visible=selectedList==="すべて"?rows:rows.filter(row=>row.listName===selectedList);

  async function remove(row:CandidateRow){
    setError("");
    try{
      if(localMode){const ids=JSON.parse(localStorage.getItem("ringops_candidate_boxers")||"[]") as string[];localStorage.setItem("ringops_candidate_boxers",JSON.stringify(ids.filter(id=>id!==row.boxerId)));}
      else{const supabase=createClient();const {error:deleteError}=await supabase.schema("ringops").from("candidate_list_boxers").delete().eq("list_id",row.listId).eq("boxer_id",row.boxerId);if(deleteError)throw deleteError;}
      setRows(current=>current.filter(item=>!(item.listId===row.listId&&item.boxerId===row.boxerId)));
    }catch{setError("候補から削除できませんでした。");}
  }

  if(loading)return <div className="border-y border-[var(--ringops-line-strong)] bg-white px-5 py-12 text-center text-sm font-bold text-slate-500">候補選手を読み込んでいます…</div>;

  return <>
    {error?<div className="mb-3 border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">{error}</div>:null}
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-[11px] font-bold text-slate-500"><b className="text-[var(--ringops-ink)]">{visible.length}名</b> を比較中</p>
      {listNames.length>1?<label className="flex items-center gap-2"><span className="ops-label">候補リスト</span><select className="h-8 border border-[var(--ringops-line)] bg-white px-2 text-[11px] font-bold" value={selectedList} onChange={e=>setSelectedList(e.target.value)}><option>すべて</option>{listNames.map(name=><option key={name}>{name}</option>)}</select></label>:null}
    </div>

    <section className="ops-table">
      <div className="hidden grid-cols-[1.55fr_.8fr_.6fr_1.05fr_.8fr_150px] gap-4 border-b border-[var(--ringops-line-strong)] bg-[#f8f8f5] px-4 py-2.5 text-[9px] font-black uppercase tracking-[.06em] text-slate-400 lg:grid"><span>選手</span><span>戦績</span><span>構え</span><span>受付</span><span>保存</span><span className="text-right">操作</span></div>
      {visible.map(row=><article className="ops-row grid grid-cols-[1fr_auto] gap-x-3 gap-y-2 px-3 py-3 lg:grid-cols-[1.55fr_.8fr_.6fr_1.05fr_.8fr_150px] lg:items-center lg:gap-4 lg:px-4" key={`${row.listId}:${row.boxerId}`}>
        <div className="min-w-0"><Link className="truncate text-[14px] font-black hover:text-[var(--ringops-accent)]" href={`/boxers/${row.boxerId}`}>{row.name}</Link><p className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">{row.gym}</p><p className="mt-1 text-[9px] font-bold text-slate-400">{row.division} · {row.boxerClass}</p></div>
        <p className="hidden text-[11px] font-black lg:block">{row.record}</p>
        <p className="hidden text-[11px] font-black lg:block">{row.stance}</p>
        <div className="col-start-1 row-start-2 lg:col-auto lg:row-auto"><StatusMark label={row.status} tone={candidateTone(row.status)} compact/><p className="mt-1 text-[9px] text-slate-400">確認 {row.verified}</p></div>
        <div className="hidden lg:block"><p className="text-[10px] font-bold">{row.listName}</p><p className="mt-1 text-[9px] text-slate-400">{formatDate(row.addedAt)}</p></div>
        <div className="col-start-2 row-span-2 row-start-1 flex flex-col items-end justify-center gap-1.5 lg:col-auto lg:row-auto"><Link className="ops-primary h-8 px-3" href={`/matchmaking/new?boxer=${row.boxerId}`}>相談</Link><button className="text-[9px] font-bold text-slate-400 underline underline-offset-4 hover:text-slate-700" onClick={()=>void remove(row)}>候補から削除</button></div>
      </article>)}
      {!visible.length?<div className="px-5 py-14 text-center"><p className="font-black">候補選手はまだありません</p><p className="mt-2 text-sm text-slate-500">選手一覧から候補に保存すると、ここで比較できます。</p><Link className="ops-secondary mt-4" href="/">選手を探す</Link></div>:null}
    </section>
  </>;
}

function candidateTone(status:string):"open"|"conditional"|"paused"|"neutral"{if(status==="受付中")return"open";if(status==="条件次第")return"conditional";if(status==="受付停止")return"paused";return"neutral";}
function relativeDate(value:string){const diff=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/86400000));if(diff===0)return"今日";if(diff===1)return"昨日";return`${diff}日前`;}
function formatDate(value:string){return new Intl.DateTimeFormat("ja-JP",{month:"2-digit",day:"2-digit"}).format(new Date(value));}
