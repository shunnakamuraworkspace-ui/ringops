"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BoutNumber, StatusMark } from "@/components/ops-ui";
import { createClient } from "@/lib/supabase/client";
import { divisions } from "@/features/boxers/data/preview-boxers";

type Competition="男子"|"女子";
type Bout={id:string;eventId:string;boxerA:string;boxerB:string;competition:Competition;division:string;rounds:number|null;weight:string;status:string};
type EventItem={id:string;name:string;date:string;venue:string;promoter:string;status:string;bouts:Bout[]};

const statusLabels:Record<string,string>={planning:"準備中",matching:"マッチメイク中",confirmed:"カード確定",completed:"終了",cancelled:"中止"};
const boutStatusLabels:Record<string,string>={recruiting:"募集中",negotiating:"交渉中",confirmed:"決定"};
const boutStatusToDb:Record<string,string>={募集中:"recruiting",交渉中:"negotiating",決定:"confirmed"};
const eventStatusOptions=["planning","matching","confirmed","completed","cancelled"];
const boutStatusOptions=["募集中","交渉中","決定"];
const competitionToDb:Record<Competition,"men"|"women">={男子:"men",女子:"women"};
const divisionCodes:Record<string,string>={"アトム級":"atom","ミニフライ級":"mini_fly","ミニマム級":"minimum","ライトフライ級":"light_fly","フライ級":"fly","スーパーフライ級":"super_fly","バンタム級":"bantam","スーパーバンタム級":"super_bantam","フェザー級":"feather","スーパーフェザー級":"super_feather","ライト級":"light","スーパーライト級":"super_light","ウェルター級":"welter","スーパーウェルター級":"super_welter","ミドル級":"middle","スーパーミドル級":"super_middle","ライトヘビー級":"light_heavy","クルーザー級":"cruiser","ヘビー級":"heavy"};
const codeToDivision:Record<string,string>={
  ...Object.fromEntries(Object.entries(divisionCodes).map(([label,code])=>[code,label])),
  atomweight:"アトム級",mini_flyweight:"ミニフライ級",minimumweight:"ミニマム級",light_flyweight:"ライトフライ級",flyweight:"フライ級",super_flyweight:"スーパーフライ級",bantamweight:"バンタム級",super_bantamweight:"スーパーバンタム級",featherweight:"フェザー級",super_featherweight:"スーパーフェザー級",lightweight:"ライト級",super_lightweight:"スーパーライト級",welterweight:"ウェルター級",super_welterweight:"スーパーウェルター級",middleweight:"ミドル級",super_middleweight:"スーパーミドル級",light_heavyweight:"ライトヘビー級",cruiserweight:"クルーザー級",heavyweight:"ヘビー級",
};

const demo:EventItem[]=[{
  id:"demo-1",name:"RING NIGHT 27",date:"2026-11-20",venue:"後楽園ホール",promoter:"東京プロモーション",status:"matching",
  bouts:[
    {id:"b1",eventId:"demo-1",boxerA:"山田 直樹",boxerB:"対戦相手募集中",competition:"男子",division:"スーパーバンタム級",rounds:6,weight:"55.0kg",status:"募集中"},
    {id:"b2",eventId:"demo-1",boxerA:"藤本 美咲",boxerB:"対戦候補A",competition:"女子",division:"フライ級",rounds:6,weight:"50.5kg",status:"交渉中"},
    {id:"b3",eventId:"demo-1",boxerA:"中村 拓海",boxerB:"マルコ・サントス",competition:"男子",division:"スーパーフェザー級",rounds:8,weight:"59.0kg",status:"決定"},
  ],
}];

export function EventBoard({databaseConnected,industryMode}:{databaseConnected:boolean;industryMode:boolean}){
  const reviewMode=!databaseConnected||!industryMode;
  const [events,setEvents]=useState<EventItem[]>(reviewMode?demo:[]);
  const [loading,setLoading]=useState(databaseConnected&&industryMode);
  const [error,setError]=useState("");
  const [showForm,setShowForm]=useState(false);
  const [name,setName]=useState("");
  const [date,setDate]=useState("");
  const [venue,setVenue]=useState("");
  const [boutDraftEventId,setBoutDraftEventId]=useState("");
  const [boutCompetition,setBoutCompetition]=useState<Competition>("男子");
  const [boutDivision,setBoutDivision]=useState("スーパーバンタム級");
  const [boutWeight,setBoutWeight]=useState("");
  const [boutRounds,setBoutRounds]=useState("6");
  const [busyId,setBusyId]=useState("");

  useEffect(()=>{
    if(reviewMode){
      try{
        const saved=JSON.parse(localStorage.getItem("ringops_events")||"[]") as EventItem[];
        if(saved.length)setEvents(saved);
      }catch{}
      setLoading(false);
      return;
    }
    let active=true;
    (async()=>{
      try{
        const supabase=createClient();
        const {data:eventRows,error:eventError}=await supabase.schema("ringops").from("events")
          .select("id,promoter_organization_id,name,event_date,venue_name,status")
          .order("event_date");
        if(eventError)throw eventError;
        const eventIds=(eventRows??[]).map((event)=>event.id);
        const orgIds=[...new Set((eventRows??[]).map((event)=>event.promoter_organization_id))];
        const [{data:orgs,error:orgError},{data:boutRows,error:boutError}]=await Promise.all([
          orgIds.length?supabase.schema("ringops").from("organizations").select("id,display_name").in("id",orgIds):Promise.resolve({data:[],error:null}),
          eventIds.length?supabase.schema("ringops").from("bouts").select("id,event_id,boxer_a_id,boxer_b_id,competition_category,division_code,contract_weight_kg,scheduled_rounds,matchmaking_status").in("event_id",eventIds).order("created_at"):Promise.resolve({data:[],error:null}),
        ]);
        if(orgError||boutError)throw orgError||boutError;
        const boxerIds=[...new Set((boutRows??[]).flatMap((bout)=>[bout.boxer_a_id,bout.boxer_b_id]).filter((value):value is string=>Boolean(value)))];
        const {data:boxers,error:boxerError}=boxerIds.length?await supabase.schema("ringops").from("boxers").select("id,name,competition_category,division_code").in("id",boxerIds):{data:[],error:null};
        if(boxerError)throw boxerError;
        const orgMap=new Map((orgs??[]).map((org)=>[org.id,org.display_name]));
        const boxerMap=new Map((boxers??[]).map((boxer)=>[boxer.id,boxer]));
        const mapped:EventItem[]=(eventRows??[]).map((event)=>({
          id:event.id,name:event.name,date:event.event_date,venue:event.venue_name,promoter:orgMap.get(event.promoter_organization_id)??"興行主",status:event.status,
          bouts:(boutRows??[]).filter((bout)=>bout.event_id===event.id).map((bout)=>{
            const boxerA=bout.boxer_a_id?boxerMap.get(bout.boxer_a_id):null;
            const boxerB=bout.boxer_b_id?boxerMap.get(bout.boxer_b_id):null;
            const category=bout.competition_category??boxerA?.competition_category??boxerB?.competition_category;
            const divisionCode=bout.division_code??boxerA?.division_code??boxerB?.division_code;
            return {id:bout.id,eventId:event.id,boxerA:boxerA?.name??"選手A未定",boxerB:boxerB?.name??"対戦相手募集中",competition:category==="women"?"女子":"男子",division:codeToDivision[divisionCode??""]??divisionCode??"階級未定",rounds:bout.scheduled_rounds,weight:bout.contract_weight_kg!=null?`${bout.contract_weight_kg}kg`:"—",status:boutStatusLabels[bout.matchmaking_status]??"募集中"};
          }),
        }));
        if(active)setEvents(mapped);
      }catch{if(active)setError("興行情報を読み込めませんでした。");}
      finally{if(active)setLoading(false);}
    })();
    return()=>{active=false};
  },[databaseConnected,industryMode,reviewMode]);

  function persistReview(next:EventItem[]){setEvents(next);localStorage.setItem("ringops_events",JSON.stringify(next));}

  async function createEvent(e:React.FormEvent){
    e.preventDefault();setError("");
    if(reviewMode){const item:EventItem={id:`event-${Date.now()}`,name,date,venue,promoter:"自組織",status:"planning",bouts:[]};persistReview([item,...events]);setName("");setDate("");setVenue("");setShowForm(false);return;}
    try{
      const supabase=createClient();
      const {data:userData}=await supabase.auth.getUser();
      if(!userData.user)throw new Error();
      const {data:memberships,error:membershipError}=await supabase.schema("ringops").from("organization_memberships").select("organization_id,role").eq("user_id",userData.user.id).eq("status","active").in("role",["owner","admin","matchmaker"]);
      if(membershipError)throw membershipError;
      const ids=(memberships??[]).map((membership)=>membership.organization_id);
      const {data:orgs,error:orgError}=ids.length?await supabase.schema("ringops").from("organizations").select("id,organization_type,display_name").in("id",ids):{data:[],error:null};
      if(orgError)throw orgError;
      const promoter=(orgs??[]).find((org)=>org.organization_type==="promoter");
      if(!promoter)throw new Error();
      const {data:created,error:insertError}=await supabase.schema("ringops").from("events").insert({promoter_organization_id:promoter.id,name,event_date:date,venue_name:venue,status:"planning",created_by:userData.user.id}).select("id").single();
      if(insertError)throw insertError;
      setEvents(current=>[{id:created.id,name,date,venue,promoter:promoter.display_name,status:"planning",bouts:[]},...current]);setName("");setDate("");setVenue("");setShowForm(false);
    }catch{setError("興行を作成できませんでした。興行主組織の権限を確認してください。");}
  }

  async function addBout(event:EventItem){
    setError("");setBusyId(event.id);const rounds=Number(boutRounds);const weight=boutWeight?Number(boutWeight):null;
    try{
      if(reviewMode){const bout:Bout={id:`bout-${Date.now()}`,eventId:event.id,boxerA:"選手A未定",boxerB:"対戦相手募集中",competition:boutCompetition,division:boutDivision,rounds,weight:weight!=null?`${weight}kg`:"—",status:"募集中"};persistReview(events.map(item=>item.id===event.id?{...item,bouts:[...item.bouts,bout]}:item));}
      else{
        const supabase=createClient();
        const {data:created,error:insertError}=await supabase.schema("ringops").from("bouts").insert({event_id:event.id,bout_date:event.date,venue_name:event.venue,competition_category:competitionToDb[boutCompetition],division_code:divisionCodes[boutDivision],contract_weight_kg:weight,scheduled_rounds:rounds,matchmaking_status:"recruiting"}).select("id").single();
        if(insertError)throw insertError;
        const bout:Bout={id:created.id,eventId:event.id,boxerA:"選手A未定",boxerB:"対戦相手募集中",competition:boutCompetition,division:boutDivision,rounds,weight:weight!=null?`${weight}kg`:"—",status:"募集中"};
        setEvents(current=>current.map(item=>item.id===event.id?{...item,bouts:[...item.bouts,bout]}:item));
      }
      setBoutDraftEventId("");setBoutCompetition("男子");setBoutDivision("スーパーバンタム級");setBoutWeight("");setBoutRounds("6");
    }catch{setError("対戦枠を追加できませんでした。");}
    finally{setBusyId("");}
  }

  async function changeBoutStatus(eventId:string,boutId:string,status:string){
    setError("");const next=events.map(event=>event.id===eventId?{...event,bouts:event.bouts.map(bout=>bout.id===boutId?{...bout,status}:bout)}:event);
    if(reviewMode){persistReview(next);return;}setEvents(next);
    try{const supabase=createClient();const {error:updateError}=await supabase.schema("ringops").from("bouts").update({matchmaking_status:boutStatusToDb[status]}).eq("id",boutId);if(updateError)throw updateError;}
    catch{setError("試合カードの進捗を更新できませんでした。");}
  }

  async function changeEventStatus(id:string,status:string){
    setError("");const next=events.map(event=>event.id===id?{...event,status}:event);
    if(reviewMode){persistReview(next);return;}setEvents(next);
    try{const supabase=createClient();const {error:updateError}=await supabase.schema("ringops").from("events").update({status}).eq("id",id);if(updateError)throw updateError;}
    catch{setError("興行ステータスを更新できませんでした。");}
  }

  if(loading)return <div className="border-y border-[var(--ringops-line-strong)] bg-white py-12 text-center text-sm font-bold text-slate-500">興行を読み込んでいます…</div>;

  return <>
    <div className="mb-3 flex items-center justify-between gap-3"><p className="text-[11px] font-bold text-slate-500"><b className="text-[var(--ringops-ink)]">{events.length}件</b> の興行</p><button className="ops-primary" onClick={()=>setShowForm(!showForm)}>{showForm?"閉じる":"興行を作成"}</button></div>
    {error?<div className="mb-3 border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</div>:null}
    {showForm?<form className="mb-4 grid gap-3 border-y border-[var(--ringops-line-strong)] bg-white p-4 sm:grid-cols-[1fr_180px_1fr_auto] sm:items-end" onSubmit={createEvent}><Field label="興行名"><input className="input" required value={name} onChange={e=>setName(e.target.value)} /></Field><Field label="興行日"><input className="input" type="date" required value={date} onChange={e=>setDate(e.target.value)} /></Field><Field label="会場"><input className="input" required value={venue} onChange={e=>setVenue(e.target.value)} /></Field><button className="ops-primary h-10">作成</button></form>:null}

    <div className="space-y-5">
      {events.map(event=><article className="border-y border-[var(--ringops-line-strong)] bg-white" key={event.id}>
        <header className="grid gap-4 border-b border-[var(--ringops-line-strong)] bg-[#f8f8f5] px-4 py-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div><div className="flex flex-wrap items-baseline gap-x-3 gap-y-1"><h2 className="text-lg font-black tracking-tight">{event.name}</h2><span className="text-[10px] font-black text-slate-400">{event.bouts.length} BOUTS</span></div><p className="mt-1 text-[11px] font-bold text-slate-500">{event.date} · {event.venue} · {event.promoter}</p></div>
          <label className="flex items-center gap-2"><span className="ops-label">興行進捗</span><select className="h-9 border border-[var(--ringops-line-strong)] bg-white px-2 text-[11px] font-black" value={event.status} onChange={e=>void changeEventStatus(event.id,e.target.value)}>{eventStatusOptions.map(value=><option value={value} key={value}>{statusLabels[value]}</option>)}</select></label>
        </header>

        <div className="flex items-center justify-between border-b border-[var(--ringops-line)] px-4 py-2.5"><p className="text-[9px] font-black uppercase tracking-[.12em] text-slate-400">Match Card</p><button className="ops-secondary h-8 px-2" onClick={()=>setBoutDraftEventId(current=>current===event.id?"":event.id)} type="button">{boutDraftEventId===event.id?"閉じる":"対戦枠を追加"}</button></div>

        {boutDraftEventId===event.id?<div className="grid gap-2 border-b border-[var(--ringops-line-strong)] bg-[#fafaf8] p-3 sm:grid-cols-2 lg:grid-cols-[110px_180px_120px_110px_auto] lg:items-end"><Field label="競技区分"><select className="input" value={boutCompetition} onChange={e=>setBoutCompetition(e.target.value as Competition)}><option>男子</option><option>女子</option></select></Field><Field label="階級"><select className="input" value={boutDivision} onChange={e=>setBoutDivision(e.target.value)}>{divisions.map(value=><option key={value}>{value}</option>)}</select></Field><Field label="契約kg"><input className="input" type="number" step="0.1" value={boutWeight} onChange={e=>setBoutWeight(e.target.value)} placeholder="55.0" /></Field><Field label="予定R"><select className="input" value={boutRounds} onChange={e=>setBoutRounds(e.target.value)}>{[4,6,8,10,12].map(value=><option value={value} key={value}>{value}R</option>)}</select></Field><button className="ops-primary h-10 disabled:opacity-50" disabled={busyId===event.id} onClick={()=>void addBout(event)} type="button">{busyId===event.id?"追加中…":"対戦枠を追加"}</button></div>:null}

        {event.bouts.map((bout,index)=><div className="ops-row grid gap-3 px-4 py-4 sm:grid-cols-[48px_1fr_145px_140px] sm:items-center" key={bout.id}>
          <div><BoutNumber value={index+1} /></div>
          <div className="min-w-0"><p className="text-[9px] font-black uppercase tracking-[.07em] text-slate-400">{bout.competition} · {bout.division} · {bout.rounds?`${bout.rounds}R`:"R未定"} · {bout.weight}</p><div className="mt-2 grid grid-cols-[1fr_28px_1fr] items-center gap-2"><b className="truncate text-[13px]">{bout.boxerA}</b><span className="text-center text-[9px] font-black text-slate-300">VS</span><b className="truncate text-[13px]">{bout.boxerB}</b></div></div>
          <div><StatusMark label={bout.status} tone={boutTone(bout.status)} compact /><select className="mt-2 h-8 w-full border border-[var(--ringops-line)] bg-white px-2 text-[10px] font-bold" value={bout.status} onChange={e=>void changeBoutStatus(event.id,bout.id,e.target.value)}>{boutStatusOptions.map(value=><option key={value}>{value}</option>)}</select></div>
          <div className="sm:text-right">{bout.status==="募集中"?<Link className="ops-primary h-8 px-3" href={openMatchHref(event,bout)}>相手を探す</Link>:bout.status==="交渉中"?<Link className="ops-secondary h-8 px-3" href="/matchmaking">案件を見る</Link>:<span className="text-[11px] font-black text-emerald-700">カード決定</span>}</div>
        </div>)}
        {!event.bouts.length?<div className="px-4 py-8 text-sm font-bold text-slate-500">対戦カードはまだ登録されていません。</div>:null}
      </article>)}
      {!events.length?<div className="border-y border-[var(--ringops-line-strong)] bg-white py-12 text-center text-sm font-bold text-slate-500">興行がありません。</div>:null}
    </div>
  </>;
}

function openMatchHref(event:EventItem,bout:Bout){const params=new URLSearchParams({fromEvent:"1",competition:bout.competition==="女子"?"women":"men",division:bout.division,rounds:String(bout.rounds??6),date:event.date,venue:event.venue});const numeric=Number(bout.weight.replace(/[^0-9.]/g,""));if(Number.isFinite(numeric)&&numeric>0){params.set("minWeight",String(numeric));params.set("maxWeight",String(numeric));}return `/open-matches?${params.toString()}`;}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="ops-label mb-1.5 block">{label}</span>{children}</label>}
function boutTone(status:string):"open"|"negotiating"|"confirmed"|"neutral"{if(status==="募集中")return"open";if(status==="交渉中")return"negotiating";if(status==="決定")return"confirmed";return"neutral";}
