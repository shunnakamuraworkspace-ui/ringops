"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Conversation={id:string;title:string;type:string;caseId:string|null;eventId:string|null};
type Msg={id:string;senderId:string;name:string;body:string;time:string};
const demoConversations:Conversation[]=[{id:"demo-room",title:"11/20 スーパーバンタム級6R",type:"matchmaking_case",caseId:"demo-1",eventId:null}];
const demoMessages:Msg[]=[{id:"1",senderId:"a",name:"東京プロモーション",body:"11月20日興行のスーパーバンタム級6Rについて確認お願いします。",time:"10:14"},{id:"2",senderId:"b",name:"青空ボクシングジム",body:"山田は55.0kg、11月以降で相談可能です。",time:"10:22"}];

export function MessageRoom({databaseConnected,industryMode}:{databaseConnected:boolean;industryMode:boolean}){
  const reviewMode=!industryMode;
  const [conversations,setConversations]=useState<Conversation[]>(reviewMode?demoConversations:[]); const [activeId,setActiveId]=useState(reviewMode?"demo-room":""); const [messages,setMessages]=useState<Msg[]>(reviewMode?demoMessages:[]); const [text,setText]=useState(""); const [loading,setLoading]=useState(databaseConnected&&industryMode); const [error,setError]=useState(""); const [currentUserId,setCurrentUserId]=useState("");
  const active=useMemo(()=>conversations.find(c=>c.id===activeId)??null,[conversations,activeId]);

  const loadMessages=useCallback(async(conversationId:string)=>{if(!databaseConnected||!industryMode)return;try{const supabase=createClient();const {data:messageRows,error:messageError}=await supabase.schema("ringops").from("messages").select("id,sender_profile_id,body,created_at").eq("conversation_id",conversationId).order("created_at");if(messageError)throw messageError;const senderIds=[...new Set((messageRows??[]).map((m:any)=>m.sender_profile_id))];const {data:profiles}=senderIds.length?await supabase.schema("ringops").from("profiles").select("id,display_name").in("id",senderIds):{data:[]};const names=new Map((profiles??[]).map((p:any)=>[p.id,p.display_name]));setMessages((messageRows??[]).map((m:any)=>({id:m.id,senderId:m.sender_profile_id,name:names.get(m.sender_profile_id)??"関係者",body:m.body,time:new Date(m.created_at).toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})})));}catch{setError("メッセージを読み込めませんでした。");}},[databaseConnected]);

  useEffect(()=>{
    if(!industryMode){
      try{
        const localCases=JSON.parse(localStorage.getItem("ringops_cases")||"[]") as Array<{id:string;boxerA?:string|null;boxerB?:string|null;event?:string}>;
        const localMessages=JSON.parse(localStorage.getItem("ringops_case_messages")||"{}") as Record<string,Array<{id:string;sender?:string;body:string;createdAt:string}>>;
        if(localCases.length){
          const mapped=localCases.map(c=>({id:c.id,title:`${c.boxerA??c.boxerB??"対戦候補"}｜${c.event??"案件"}`,type:"matchmaking_case",caseId:c.id,eventId:null}));
          setConversations(mapped);setActiveId(mapped[0].id);
          const first=localMessages[mapped[0].id]??[];
          setMessages(first.map(m=>({id:m.id,senderId:"me",name:m.sender??"自組織",body:m.body,time:new Date(m.createdAt).toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})})));
        }
      }catch{/* review storage only */}
      setLoading(false);return;
    }
    if(!databaseConnected){setLoading(false);return;}let activeFlag=true;(async()=>{try{const supabase=createClient();const {data:userData}=await supabase.auth.getUser();if(!userData.user)throw new Error();if(activeFlag)setCurrentUserId(userData.user.id);const {data:rows,error:conversationError}=await supabase.schema("ringops").from("conversations").select("id,title,conversation_type,matchmaking_case_id,event_id").order("updated_at",{ascending:false});if(conversationError)throw conversationError;const mapped=(rows??[]).map((c:any)=>({id:c.id,title:c.title||"連絡ルーム",type:c.conversation_type,caseId:c.matchmaking_case_id,eventId:c.event_id}));if(activeFlag){setConversations(mapped);const first=mapped[0]?.id??"";setActiveId(first);if(first)await loadMessages(first);}}catch{if(activeFlag)setError("連絡ルームを読み込めませんでした。") }finally{if(activeFlag)setLoading(false)}})();return()=>{activeFlag=false}},[databaseConnected,industryMode,loadMessages]);

  useEffect(()=>{if(!databaseConnected||!industryMode||!activeId)return;const supabase=createClient();const channel=supabase.channel(`ringops-messages-${activeId}`).on("postgres_changes",{event:"INSERT",schema:"ringops",table:"messages",filter:`conversation_id=eq.${activeId}`},()=>{loadMessages(activeId)}).subscribe();return()=>{void supabase.removeChannel(channel)}},[databaseConnected,activeId,loadMessages]);

  async function choose(id:string){setActiveId(id);setError("");await loadMessages(id);}
  async function send(){const body=text.trim();if(!body||!activeId)return;setText("");if(!industryMode){const createdAt=new Date().toISOString();const msg={id:String(Date.now()),senderId:"me",name:"自組織",body,time:new Date(createdAt).toLocaleTimeString("ja-JP",{hour:"2-digit",minute:"2-digit"})};setMessages(current=>[...current,msg]);try{const all=JSON.parse(localStorage.getItem("ringops_case_messages")||"{}");all[activeId]=[...(all[activeId]||[]),{id:msg.id,sender:"自組織",body,createdAt}];localStorage.setItem("ringops_case_messages",JSON.stringify(all));}catch{/* review storage only */}return;}try{const supabase=createClient();const {error:insertError}=await supabase.schema("ringops").from("messages").insert({conversation_id:activeId,sender_profile_id:currentUserId,body});if(insertError)throw insertError;await loadMessages(activeId);}catch{setError("メッセージを送信できませんでした。");setText(body);}}

  if(loading)return <div className="rounded-lg border border-[#d9dee5] bg-white p-10 text-center text-sm font-bold text-slate-500">連絡ルームを読み込んでいます…</div>;

  return <div className="grid min-h-[620px] rounded-lg border border-[#d9dee5] bg-white lg:grid-cols-[260px_1fr_280px]">
    <aside className="border-r border-slate-200 p-3"><p className="px-2 py-2 text-[11px] font-black text-slate-400">ルーム</p>{conversations.map(c=><button className={`mt-1 w-full px-3 py-3 text-left text-sm ${c.id===activeId?"border-l-2 border-slate-950 bg-slate-50 font-black":"font-bold text-slate-600"}`} key={c.id} onClick={()=>choose(c.id)}>{c.title}</button>)}{!conversations.length&&<p className="px-3 py-5 text-xs text-slate-500">相談や興行からルームが作成されます。</p>}</aside>
    <section className="flex min-h-[620px] flex-col"><div className="border-b border-slate-200 px-5 py-4"><b>{active?.title??"連絡"}</b><p className="mt-1 text-xs text-slate-500">案件・興行に紐づく業務連絡</p></div>{error&&<div className="border-b border-rose-200 bg-rose-50 px-5 py-2 text-xs font-bold text-rose-800">{error}</div>}<div className="flex-1 space-y-5 overflow-y-auto p-5">{messages.map(m=><div key={m.id}><div className="flex items-baseline gap-2"><b className="text-sm">{m.senderId===currentUserId?"自分":m.name}</b><span className="text-[10px] text-slate-400">{m.time}</span></div><p className="mt-1 text-sm leading-6 text-slate-700">{m.body}</p></div>)}{activeId&&!messages.length&&<p className="text-sm text-slate-500">まだメッセージはありません。</p>}</div><div className="border-t border-slate-200 p-4"><div className="flex gap-2"><input className="input" disabled={!activeId} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();void send()}}} placeholder="メッセージを入力"/><button className="shrink-0 bg-slate-950 px-5 text-sm font-black text-white disabled:bg-slate-400" disabled={!activeId||!text.trim()} onClick={()=>void send()}>送信</button></div></div></section>
    <aside className="border-l border-slate-200 p-5"><p className="text-[11px] font-black text-slate-400">関連情報</p><dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs text-slate-400">種別</dt><dd className="mt-1 font-black">{active?.type==="matchmaking_case"?"マッチメイク案件":active?.type==="event"?"興行":"連絡"}</dd></div><div><dt className="text-xs text-slate-400">案件ID</dt><dd className="mt-1 break-all text-xs font-bold">{active?.caseId??"—"}</dd></div><div><dt className="text-xs text-slate-400">興行ID</dt><dd className="mt-1 break-all text-xs font-bold">{active?.eventId??"—"}</dd></div></dl></aside>
  </div>;
}
