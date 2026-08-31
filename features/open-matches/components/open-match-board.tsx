"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { divisions } from "@/features/boxers/data/preview-boxers";

type Competition = "男子" | "女子";
type Item={
  id:string; organizationId:string; targetBoxerId:string|null; targetBoxer:string; organization:string;
  competition:Competition; date:string; venue:string; division:string; minWeight:number|null; maxWeight:number|null; rounds:number;
  klass:string; stance:string; minBouts:number|null; maxBouts:number|null; region:string; travel:string;
  deadline:string; note:string;
};
type ManagedOrg={id:string;name:string;type:string};
type MyBoxer={id:string;name:string;organizationId:string;competition:Competition;division:string};

const divisionCodes:Record<string,string>={"アトム級":"atom","ミニフライ級":"mini_fly","ミニマム級":"minimum","ライトフライ級":"light_fly","フライ級":"fly","スーパーフライ級":"super_fly","バンタム級":"bantam","スーパーバンタム級":"super_bantam","フェザー級":"feather","スーパーフェザー級":"super_feather","ライト級":"light","スーパーライト級":"super_light","ウェルター級":"welter","スーパーウェルター級":"super_welter","ミドル級":"middle","スーパーミドル級":"super_middle","ライトヘビー級":"light_heavy","クルーザー級":"cruiser","ヘビー級":"heavy"};
const divisionAliases:Record<string,string>={atomweight:"アトム級",mini_flyweight:"ミニフライ級",minimumweight:"ミニマム級",light_flyweight:"ライトフライ級",flyweight:"フライ級",super_flyweight:"スーパーフライ級",bantamweight:"バンタム級",super_bantamweight:"スーパーバンタム級",featherweight:"フェザー級",super_featherweight:"スーパーフェザー級",lightweight:"ライト級",super_lightweight:"スーパーライト級",welterweight:"ウェルター級",super_welterweight:"スーパーウェルター級",middleweight:"ミドル級",super_middleweight:"スーパーミドル級",light_heavyweight:"ライトヘビー級",cruiserweight:"クルーザー級",heavyweight:"ヘビー級"};
const codeToDivision={...Object.fromEntries(Object.entries(divisionCodes).map(([label,code])=>[code,label])),...divisionAliases};
const stanceToDb:Record<string,string|undefined>={"指定なし":undefined,"右":"orthodox","左":"southpaw"};
const classToDb:Record<string,string|undefined>={"指定なし":undefined,"A級":"A","B級":"B","C級":"C"};
const competitionToDb:Record<Competition,"men"|"women">={男子:"men",女子:"women"};

const demo:Item[]=[
  {id:"demo-1",organizationId:"preview-gym",targetBoxerId:"20000000-0000-4000-8000-000000000001",targetBoxer:"山田 直樹",organization:"青空ボクシングジム",competition:"男子",date:"2026-11-20",venue:"後楽園ホール",division:"スーパーバンタム級",minWeight:54.8,maxWeight:55.2,rounds:6,klass:"B級",stance:"指定なし",minBouts:5,maxBouts:10,region:"国内",travel:"東京へ遠征可",deadline:"2026-09-30",note:"戦績5〜10戦程度を希望。"},
  {id:"demo-2",organizationId:"preview-promoter",targetBoxerId:null,targetBoxer:"対戦枠",organization:"東京プロモーション",competition:"女子",date:"2026-10-24",venue:"後楽園ホール",division:"フライ級",minWeight:49.8,maxWeight:50.8,rounds:6,klass:"B級",stance:"指定なし",minBouts:null,maxBouts:8,region:"全国",travel:"要相談",deadline:"2026-09-10",note:"女子フライ級の対戦候補を募集。"},
];
const previewOrgs:ManagedOrg[]=[{id:"preview-gym",name:"青空ボクシングジム",type:"gym"},{id:"preview-promoter",name:"東京プロモーション",type:"promoter"}];
const previewBoxers:MyBoxer[]=[{id:"20000000-0000-4000-8000-000000000001",name:"山田 直樹",organizationId:"preview-gym",competition:"男子",division:"スーパーバンタム級"}];

export function OpenMatchBoard({databaseConnected,industryMode}:{databaseConnected:boolean;industryMode:boolean}){
  const reviewMode=!industryMode;
  const [items,setItems]=useState<Item[]>(reviewMode?demo:[]);
  const [managedOrgs,setManagedOrgs]=useState<ManagedOrg[]>(reviewMode?previewOrgs:[]);
  const [myBoxers,setMyBoxers]=useState<MyBoxer[]>(reviewMode?previewBoxers:[]);
  const [loading,setLoading]=useState(databaseConnected&&industryMode);
  const [showForm,setShowForm]=useState(false);
  const [error,setError]=useState("");
  const [busyId,setBusyId]=useState("");

  const [organizationId,setOrganizationId]=useState(reviewMode?"preview-gym":"");
  const [targetBoxerId,setTargetBoxerId]=useState("");
  const [competition,setCompetition]=useState<Competition>("男子");
  const [division,setDivision]=useState("スーパーバンタム級");
  const [date,setDate]=useState("");
  const [venue,setVenue]=useState("");
  const [minWeight,setMinWeight]=useState("");
  const [maxWeight,setMaxWeight]=useState("");
  const [rounds,setRounds]=useState("6");
  const [klass,setKlass]=useState("B級");
  const [stance,setStance]=useState("指定なし");
  const [minBouts,setMinBouts]=useState("");
  const [maxBouts,setMaxBouts]=useState("");
  const [region,setRegion]=useState("");
  const [travel,setTravel]=useState("");
  const [deadline,setDeadline]=useState("");
  const [note,setNote]=useState("");

  useEffect(()=>{
    if(databaseConnected&&industryMode)return;
    try{
      const saved=JSON.parse(localStorage.getItem("ringops_open_matches")||"[]") as Item[];
      if(saved.length)setItems([...saved,...demo]);
      const rawDraft=localStorage.getItem("ringops_rerecruit_draft");
      if(rawDraft){
        const draft=JSON.parse(rawDraft) as {targetBoxerId?:string;date?:string;venue?:string;weight?:string;rounds?:number;note?:string};
        if(draft.targetBoxerId){
          setTargetBoxerId(draft.targetBoxerId);
          const boxer=previewBoxers.find(item=>item.id===draft.targetBoxerId);
          if(boxer){setCompetition(boxer.competition);setDivision(boxer.division);}
        }
        if(draft.date)setDate(draft.date);
        if(draft.venue)setVenue(draft.venue);
        if(draft.rounds)setRounds(String(draft.rounds));
        if(draft.note)setNote(draft.note);
        if(draft.weight){
          const numeric=Number(String(draft.weight).replace(/[^0-9.]/g,""));
          if(Number.isFinite(numeric)&&numeric>0){setMinWeight(String(numeric));setMaxWeight(String(numeric));}
        }
        setShowForm(true);
        localStorage.removeItem("ringops_rerecruit_draft");
      }
    }catch{/* review storage only */}
  },[databaseConnected,industryMode]);

  useEffect(()=>{
    if(!databaseConnected||!industryMode)return;
    let active=true;
    (async()=>{
      try{
        const supabase=createClient();
        const {data:userData}=await supabase.auth.getUser();
        if(!userData.user)throw new Error();

        const [{data:openRows,error:openError},{data:memberships,error:membershipError}]=await Promise.all([
          supabase.schema("ringops").from("open_matches").select("id,event_date,venue_name,competition_category,division_code,contract_weight_min_kg,contract_weight_max_kg,rounds,preferred_class,preferred_stance,min_bouts,max_bouts,region_condition,travel_condition,deadline,comment,target_boxer_id,organization_id").eq("status","open").order("deadline"),
          supabase.schema("ringops").from("organization_memberships").select("organization_id,role").eq("user_id",userData.user.id).eq("status","active").in("role",["owner","admin","matchmaker"]),
        ]);
        if(openError||membershipError)throw openError||membershipError;

        const managedIds=[...new Set((memberships??[]).map(row=>row.organization_id))];
        const openOrgIds=(openRows??[]).map(row=>row.organization_id);
        const orgIds=[...new Set([...managedIds,...openOrgIds])];
        const boxerIds=[...new Set((openRows??[]).map(row=>row.target_boxer_id).filter(Boolean))];

        const [orgResult,targetBoxerResult,myBoxerResult]=await Promise.all([
          orgIds.length?supabase.schema("ringops").from("organizations").select("id,display_name,organization_type").in("id",orgIds):Promise.resolve({data:[],error:null}),
          boxerIds.length?supabase.schema("ringops").from("boxers").select("id,name,organization_id,competition_category,division_code").in("id",boxerIds):Promise.resolve({data:[],error:null}),
          managedIds.length?supabase.schema("ringops").from("boxers").select("id,name,organization_id,competition_category,division_code").in("organization_id",managedIds).eq("is_public",true).order("name_kana"):Promise.resolve({data:[],error:null}),
        ]);
        if(orgResult.error||targetBoxerResult.error||myBoxerResult.error)throw orgResult.error||targetBoxerResult.error||myBoxerResult.error;

        const orgMap=new Map((orgResult.data??[]).map(org=>[org.id,org]));
        const targetBoxerMap=new Map((targetBoxerResult.data??[]).map(boxer=>[boxer.id,boxer]));
        const mapped:Item[]=(openRows??[]).map(row=>{
          const target=row.target_boxer_id?targetBoxerMap.get(row.target_boxer_id):null;
          const category=row.competition_category??target?.competition_category;
          return {
            id:row.id,organizationId:row.organization_id,targetBoxerId:row.target_boxer_id,targetBoxer:target?.name??"対戦枠",
            organization:orgMap.get(row.organization_id)?.display_name??"業界組織",competition:category==="women"?"女子":"男子",date:row.event_date??"",venue:row.venue_name??"—",
            division:codeToDivision[row.division_code]??row.division_code,minWeight:row.contract_weight_min_kg==null?null:Number(row.contract_weight_min_kg),maxWeight:row.contract_weight_max_kg==null?null:Number(row.contract_weight_max_kg),
            rounds:row.rounds,klass:row.preferred_class?`${row.preferred_class}級`:"指定なし",stance:row.preferred_stance==="southpaw"?"左":row.preferred_stance==="orthodox"?"右":"指定なし",
            minBouts:row.min_bouts,maxBouts:row.max_bouts,region:row.region_condition??"",travel:row.travel_condition??"",deadline:row.deadline??"",note:row.comment??"",
          };
        });
        const ownOrgs:ManagedOrg[]=managedIds.map(id=>orgMap.get(id)).filter(Boolean).map(org=>({id:org!.id,name:org!.display_name,type:org!.organization_type}));
        const ownBoxers:MyBoxer[]=(myBoxerResult.data??[]).map(boxer=>({id:boxer.id,name:boxer.name,organizationId:boxer.organization_id,competition:boxer.competition_category==="women"?"女子":"男子",division:codeToDivision[boxer.division_code]??boxer.division_code}));
        if(active){setItems(mapped);setManagedOrgs(ownOrgs);setMyBoxers(ownBoxers);setOrganizationId(current=>current||ownOrgs[0]?.id||"");}
      }catch{
        if(active)setError("募集情報を読み込めませんでした。");
      }finally{
        if(active)setLoading(false);
      }
    })();
    return()=>{active=false};
  },[databaseConnected,industryMode]);

  const targetOptions=useMemo(()=>myBoxers.filter(boxer=>boxer.organizationId===organizationId),[myBoxers,organizationId]);
  const managedIds=useMemo(()=>new Set(managedOrgs.map(org=>org.id)),[managedOrgs]);

  function chooseTargetBoxer(value:string){
    setTargetBoxerId(value);
    const boxer=myBoxers.find(item=>item.id===value);
    if(boxer){setCompetition(boxer.competition);setDivision(boxer.division);}
  }

  async function create(e:React.FormEvent){
    e.preventDefault();setError("");
    if(!organizationId){setError("投稿する組織を選択してください。");return;}
    const minW=minWeight?Number(minWeight):null;const maxW=maxWeight?Number(maxWeight):null;
    if(minW!==null&&maxW!==null&&maxW<minW){setError("契約ウェイトの上限は下限以上にしてください。");return;}
    if(minBouts&&maxBouts&&Number(maxBouts)<Number(minBouts)){setError("戦数上限は下限以上にしてください。");return;}

    if(!databaseConnected||!industryMode){
      const org=managedOrgs.find(value=>value.id===organizationId);
      const boxer=myBoxers.find(value=>value.id===targetBoxerId);
      const existing=JSON.parse(localStorage.getItem("ringops_open_matches")||"[]") as Item[];
      const nextSequence=Number(localStorage.getItem("ringops_open_match_sequence")||"0")+1;
      localStorage.setItem("ringops_open_match_sequence",String(nextSequence));
      const item:Item={id:`review-${nextSequence}`,organizationId,targetBoxerId:targetBoxerId||null,targetBoxer:boxer?.name??"対戦枠",organization:org?.name??"自組織",competition,date,venue,division,minWeight:minW,maxWeight:maxW,rounds:Number(rounds),klass,stance,minBouts:minBouts?Number(minBouts):null,maxBouts:maxBouts?Number(maxBouts):null,region,travel,deadline,note};
      localStorage.setItem("ringops_open_matches",JSON.stringify([item,...existing]));
      setItems([item,...items]);setShowForm(false);resetForm();return;
    }

    try{
      const supabase=createClient();
      const {data:userData}=await supabase.auth.getUser();
      const user=userData.user;if(!user)throw new Error();
      const {error:insertError}=await supabase.schema("ringops").from("open_matches").insert({
        organization_id:organizationId,target_boxer_id:targetBoxerId||null,event_date:date||null,venue_name:venue||null,competition_category:competitionToDb[competition],division_code:divisionCodes[division],
        contract_weight_min_kg:minW,contract_weight_max_kg:maxW,rounds:Number(rounds),preferred_class:classToDb[klass]??null,preferred_stance:stanceToDb[stance]??null,
        min_bouts:minBouts?Number(minBouts):null,max_bouts:maxBouts?Number(maxBouts):null,region_condition:region||null,travel_condition:travel||null,
        deadline:deadline||null,comment:note||null,status:"open",created_by:user.id,
      });
      if(insertError)throw insertError;
      location.reload();
    }catch{
      setError("募集を登録できませんでした。組織権限を確認してください。");
    }
  }

  async function changeStatus(id:string,status:"paused"|"closed"){
    setBusyId(id);setError("");
    try{
      if(databaseConnected&&industryMode){
        const supabase=createClient();
        const {error:updateError}=await supabase.schema("ringops").from("open_matches").update({status}).eq("id",id);
        if(updateError)throw updateError;
      }else{
        const existing=JSON.parse(localStorage.getItem("ringops_open_matches")||"[]") as Item[];
        localStorage.setItem("ringops_open_matches",JSON.stringify(existing.filter(item=>item.id!==id)));
      }
      setItems(current=>current.filter(item=>item.id!==id));
    }catch{
      setError("募集状態を変更できませんでした。");
    }finally{
      setBusyId("");
    }
  }

  function resetForm(){
    setTargetBoxerId("");setCompetition("男子");setDivision("スーパーバンタム級");setDate("");setVenue("");setMinWeight("");setMaxWeight("");setRounds("6");setKlass("B級");setStance("指定なし");setMinBouts("");setMaxBouts("");setRegion("");setTravel("");setDeadline("");setNote("");
  }

  if(loading)return <div className="border-y-2 border-slate-950 bg-white py-12 text-center text-sm font-bold text-slate-500">募集情報を読み込んでいます…</div>;

  return <>
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-bold text-slate-500">募集中 {items.length}件</p>{reviewMode&&<p className="mt-1 text-[10px] font-bold text-slate-400">確認モード：作成内容はこの端末に保存されます。</p>}</div>
      <button className="h-10 bg-slate-950 px-4 text-xs font-black text-white" onClick={()=>setShowForm(!showForm)}>{showForm?"閉じる":"対戦相手募集を作成"}</button>
    </div>
    {error&&<div className="mb-4 border border-rose-200 bg-rose-50 p-3 text-xs font-bold text-rose-800">{error}</div>}

    {showForm&&<form className="mb-6 border-y-2 border-slate-950 bg-white p-5" onSubmit={create}>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Select label="投稿組織" value={organizationId} onChange={value=>{setOrganizationId(value);setTargetBoxerId("");}} values={managedOrgs.map(org=>({value:org.id,label:org.name}))}/>
        <Select label="対象選手（任意）" value={targetBoxerId} onChange={chooseTargetBoxer} values={[{value:"",label:"対戦枠として募集"},...targetOptions.map(boxer=>({value:boxer.id,label:boxer.name}))]}/>
        <Select label="競技区分" value={competition} onChange={value=>setCompetition(value as Competition)} values={[{value:"男子",label:"男子"},{value:"女子",label:"女子"}]}/>
        <Select label="階級" value={division} onChange={setDivision} values={divisions.map(value=>({value,label:value}))}/>
        <Select label="R" value={rounds} onChange={setRounds} values={["4","6","8","10","12"].map(value=>({value,label:`${value}R`}))}/>
        <Field label="興行日"><input className="input" type="date" required value={date} onChange={e=>setDate(e.target.value)}/></Field>
        <Field label="会場"><input className="input" required value={venue} onChange={e=>setVenue(e.target.value)} placeholder="後楽園ホール"/></Field>
        <Field label="契約ウェイト 下限 kg"><input className="input" type="number" step="0.01" value={minWeight} onChange={e=>setMinWeight(e.target.value)} placeholder="54.8"/></Field>
        <Field label="契約ウェイト 上限 kg"><input className="input" type="number" step="0.01" value={maxWeight} onChange={e=>setMaxWeight(e.target.value)} placeholder="55.2"/></Field>
        <Select label="希望クラス" value={klass} onChange={setKlass} values={["指定なし","A級","B級","C級"].map(value=>({value,label:value}))}/>
        <Select label="構え" value={stance} onChange={setStance} values={["指定なし","右","左"].map(value=>({value,label:value}))}/>
        <Field label="戦数 下限"><input className="input" type="number" min="0" value={minBouts} onChange={e=>setMinBouts(e.target.value)} placeholder="5"/></Field>
        <Field label="戦数 上限"><input className="input" type="number" min="0" value={maxBouts} onChange={e=>setMaxBouts(e.target.value)} placeholder="10"/></Field>
        <Field label="地域条件"><input className="input" value={region} onChange={e=>setRegion(e.target.value)} placeholder="例：関東優先"/></Field>
        <Field label="遠征条件"><input className="input" value={travel} onChange={e=>setTravel(e.target.value)} placeholder="例：東京へ遠征可"/></Field>
        <Field label="募集期限"><input className="input" type="date" required value={deadline} onChange={e=>setDeadline(e.target.value)}/></Field>
      </div>
      <Field label="条件・コメント"><textarea className="mt-1 min-h-24 w-full border border-slate-300 p-3 text-sm outline-none focus:border-slate-950" value={note} onChange={e=>setNote(e.target.value)} maxLength={1500}/></Field>
      <div className="mt-4 flex justify-end"><button className="h-11 bg-slate-950 px-5 text-xs font-black text-white">募集を公開</button></div>
    </form>}

    <div className="border-y-2 border-slate-950 bg-white">
      {items.map(item=><article className="grid gap-4 border-b border-slate-200 px-5 py-5 last:border-0 lg:grid-cols-[1.45fr_1fr_.9fr_.8fr_1.15fr] lg:items-center" key={item.id}>
        <div><b>{item.targetBoxer}</b><p className="mt-1 text-xs font-bold text-slate-500">{item.organization}</p><p className="mt-1 text-xs text-slate-400">{item.date}｜{item.venue}</p></div>
        <div><p className="text-[10px] font-black text-slate-400">{item.competition}</p><b className="text-sm">{item.division}</b><p className="mt-1 text-xs text-slate-500">{weightLabel(item.minWeight,item.maxWeight)}</p></div>
        <div><b>{item.klass} / {item.rounds}R</b><p className="mt-1 text-xs text-slate-500">構え {item.stance}｜戦数 {rangeLabel(item.minBouts,item.maxBouts)}</p></div>
        <div><p className="text-[11px] text-slate-400">募集期限</p><b>{item.deadline||"未設定"}</b></div>
        <div className="flex flex-col gap-2"><Link className="flex h-10 items-center justify-center border border-slate-950 px-3 text-xs font-black hover:bg-slate-950 hover:text-white" href={searchHref(item)}>この条件で選手を探す</Link>{managedIds.has(item.organizationId)&&<div className="flex gap-2"><button className="h-8 flex-1 border border-slate-300 text-[10px] font-bold text-slate-600" disabled={busyId===item.id} onClick={()=>changeStatus(item.id,"paused")}>一時停止</button><button className="h-8 flex-1 text-[10px] font-bold text-slate-500 underline" disabled={busyId===item.id} onClick={()=>changeStatus(item.id,"closed")}>募集終了</button></div>}</div>
        {(item.region||item.travel||item.note)&&<div className="border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500 lg:col-span-5"><p>{[item.region,item.travel].filter(Boolean).join("｜")}</p>{item.note&&<p className="mt-1">{item.note}</p>}</div>}
      </article>)}
      {!items.length&&<div className="py-12 text-center text-sm font-bold text-slate-500">現在募集中の案件はありません。</div>}
    </div>
  </>;
}

function searchHref(item:Item){const params=new URLSearchParams();params.set("competition",item.competition==="女子"?"women":"men");params.set("division",item.division);params.set("rounds",String(item.rounds));if(item.klass!=="指定なし")params.set("class",item.klass);if(item.stance!=="指定なし")params.set("stance",item.stance);if(item.minWeight!==null)params.set("minWeight",String(item.minWeight));if(item.maxWeight!==null)params.set("maxWeight",String(item.maxWeight));if(item.minBouts!==null)params.set("minBouts",String(item.minBouts));if(item.maxBouts!==null)params.set("maxBouts",String(item.maxBouts));return`/?${params.toString()}`;}
function weightLabel(min:number|null,max:number|null){if(min===null&&max===null)return"指定なし";if(min!==null&&max!==null&&min===max)return`${min}kg`;return`${min??"—"}〜${max??"—"}kg`;}
function rangeLabel(min:number|null,max:number|null){if(min===null&&max===null)return"指定なし";return`${min??"—"}〜${max??"—"}戦`;}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-1.5 block text-[11px] font-black text-slate-500">{label}</span>{children}</label>}
function Select({label,value,onChange,values}:{label:string;value:string;onChange:(v:string)=>void;values:{value:string;label:string}[]}){return <Field label={label}><select className="input" value={value} onChange={e=>onChange(e.target.value)}>{values.map(option=><option key={`${option.value}:${option.label}`} value={option.value}>{option.label}</option>)}</select></Field>}
