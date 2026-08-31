"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

export function CandidateList({
  databaseConnected,
  previewBoxers,
}: {
  databaseConnected:boolean;
  previewBoxers:BoxerPreview[];
}) {
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
            boxerClass:boxer!.boxerClass,stance:boxer!.stance,record:`${boxer!.totalBouts}戦 ${boxer!.wins}勝（${boxer!.koWins}KO）${boxer!.losses}敗${boxer!.draws?` ${boxer!.draws}分`:""}`,
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
        const listRows=lists??[];
        const listIds=listRows.map(item=>item.id);
        if(!listIds.length){if(active)setRows([]);return;}

        const {data:items,error:itemError}=await supabase.schema("ringops").from("candidate_list_boxers").select("list_id,boxer_id,added_at").in("list_id",listIds).order("added_at",{ascending:false});
        if(itemError)throw itemError;
        const itemRows=items??[];
        const boxerIds=[...new Set(itemRows.map(item=>item.boxer_id))];
        if(!boxerIds.length){if(active)setRows([]);return;}

        const [{data:boxers,error:boxerError},{data:statuses,error:statusError}]=await Promise.all([
          supabase.schema("ringops").from("boxers").select("id,organization_id,name,division_code,boxer_class,stance,total_bouts,wins,losses,draws,ko_wins").in("id",boxerIds),
          supabase.schema("ringops").from("boxer_match_statuses").select("boxer_id,status,verified_at").in("boxer_id",boxerIds),
        ]);
        if(boxerError||statusError)throw boxerError||statusError;

        const orgIds=[...new Set((boxers??[]).map(boxer=>boxer.organization_id))];
        const {data:organizations,error:orgError}=orgIds.length
          ? await supabase.schema("ringops").from("organizations").select("id,display_name").in("id",orgIds)
          : {data:[],error:null};
        if(orgError)throw orgError;

        const listMap=new Map(listRows.map(item=>[item.id,item.name]));
        const boxerMap=new Map((boxers??[]).map(boxer=>[boxer.id,boxer]));
        const statusMap=new Map((statuses??[]).map(status=>[status.boxer_id,status]));
        const orgMap=new Map((organizations??[]).map(org=>[org.id,org.display_name]));
        const mapped:CandidateRow[]=itemRows.flatMap(item=>{
          const boxer=boxerMap.get(item.boxer_id);
          if(!boxer)return [];
          const status=statusMap.get(item.boxer_id);
          return [{
            listId:item.list_id,listName:listMap.get(item.list_id)??"候補選手",boxerId:boxer.id,name:boxer.name,
            gym:orgMap.get(boxer.organization_id)??"所属ジム",division:divisionLabels[boxer.division_code]??boxer.division_code,
            boxerClass:`${boxer.boxer_class}級`,stance:boxer.stance==="southpaw"?"左":"右",
            record:`${boxer.total_bouts}戦 ${boxer.wins}勝（${boxer.ko_wins}KO）${boxer.losses}敗${boxer.draws?` ${boxer.draws}分`:""}`,
            status:status?statusLabels[status.status]??status.status:"未確認",verified:status?.verified_at?relativeDate(status.verified_at):"未確認",
            addedAt:item.added_at,
          }];
        });
        if(active)setRows(mapped);
      }catch{
        if(active)setError("候補選手を読み込めませんでした。");
      }finally{
        if(active)setLoading(false);
      }
    }

    void load();
    return()=>{active=false};
  },[databaseConnected,previewBoxers]);

  const listNames=useMemo(()=>[...new Set(rows.map(row=>row.listName))],[rows]);
  const visible=selectedList==="すべて"?rows:rows.filter(row=>row.listName===selectedList);

  async function remove(row:CandidateRow){
    setError("");
    try{
      if(localMode){
        const ids=JSON.parse(localStorage.getItem("ringops_candidate_boxers")||"[]") as string[];
        localStorage.setItem("ringops_candidate_boxers",JSON.stringify(ids.filter(id=>id!==row.boxerId)));
      }else{
        const supabase=createClient();
        const {error:deleteError}=await supabase.schema("ringops").from("candidate_list_boxers").delete().eq("list_id",row.listId).eq("boxer_id",row.boxerId);
        if(deleteError)throw deleteError;
      }
      setRows(current=>current.filter(item=>!(item.listId===row.listId&&item.boxerId===row.boxerId)));
    }catch{
      setError("候補から削除できませんでした。");
    }
  }

  if(loading)return <div className="border-y-2 border-slate-950 bg-white px-5 py-14 text-center text-sm font-bold text-slate-500">候補選手を読み込んでいます…</div>;

  return <>
    {error&&<div className="mb-4 border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-bold text-rose-800">{error}</div>}
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="text-[11px] font-black tracking-[.12em] text-slate-400">SHORTLIST</p>
        <h2 className="mt-1 text-2xl font-black">候補 {visible.length}名</h2>
      </div>
      {listNames.length>1&&<label><span className="mb-1 block text-[10px] font-black text-slate-400">候補リスト</span><select className="h-9 border border-slate-300 bg-white px-3 text-xs font-bold" value={selectedList} onChange={e=>setSelectedList(e.target.value)}><option>すべて</option>{listNames.map(name=><option key={name}>{name}</option>)}</select></label>}
    </div>

    <div className="border-y-2 border-slate-950 bg-white">
      <div className="hidden grid-cols-[1.6fr_1.35fr_.7fr_1.2fr_1fr_auto] gap-4 border-b border-slate-200 bg-slate-50 px-5 py-3 text-[10px] font-black text-slate-500 lg:grid">
        <span>選手</span><span>戦績</span><span>構え</span><span>受付 / 確認</span><span>リスト</span><span>操作</span>
      </div>
      {visible.map(row=><article className="grid gap-4 border-b border-slate-200 px-5 py-5 last:border-0 lg:grid-cols-[1.6fr_1.35fr_.7fr_1.2fr_1fr_auto] lg:items-center" key={`${row.listId}:${row.boxerId}`}>
        <div><Link className="font-black hover:underline" href={`/boxers/${row.boxerId}`}>{row.name}</Link><p className="mt-1 text-xs font-bold text-slate-600">{row.division}｜{row.boxerClass}</p><p className="mt-1 text-[11px] text-slate-400">{row.gym}</p></div>
        <p className="text-sm font-black">{row.record}</p>
        <p className="text-sm font-black">{row.stance}</p>
        <div><span className="inline-flex bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-700">{row.status}</span><p className="mt-1 text-[10px] font-bold text-slate-400">確認：{row.verified}</p></div>
        <div><p className="text-xs font-black">{row.listName}</p><p className="mt-1 text-[10px] text-slate-400">追加 {formatDate(row.addedAt)}</p></div>
        <div className="flex gap-2 lg:flex-col"><Link className="flex h-9 items-center justify-center bg-slate-950 px-3 text-xs font-black text-white" href={`/matchmaking/new?boxer=${row.boxerId}`}>相談</Link><button className="h-9 px-2 text-[10px] font-bold text-slate-500 underline underline-offset-4" onClick={()=>remove(row)}>候補から削除</button></div>
      </article>)}
      {!visible.length&&<div className="px-5 py-16 text-center"><p className="font-black">候補選手はまだありません</p><p className="mt-2 text-sm text-slate-500">選手ページから候補に保存すると、ここでまとめて比較できます。</p><Link className="mt-5 inline-flex h-10 items-center border border-slate-950 px-4 text-xs font-black" href="/">選手を探す</Link></div>}
    </div>
  </>;
}

function relativeDate(value:string){const diff=Math.max(0,Math.floor((Date.now()-new Date(value).getTime())/86400000));if(diff===0)return"今日";if(diff===1)return"昨日";return`${diff}日前`;}
function formatDate(value:string){return new Intl.DateTimeFormat("ja-JP",{month:"2-digit",day:"2-digit"}).format(new Date(value));}