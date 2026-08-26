import Link from "next/link";
import { MessageRoom } from "@/features/messages/components/message-room";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function MessagesPage(){
  const {databaseConnected,industryMode}=await loadBoxers();
  return <main className="mx-auto max-w-[1380px] px-4 py-7"><div className="mb-5 flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-3xl font-black">連絡</h1><p className="mt-2 text-sm text-slate-500">チャットだけを独立させず、マッチメイク案件・興行と紐づけて残します。</p></div>{databaseConnected&&!industryMode&&<Link className="border border-slate-950 px-4 py-2 text-xs font-black" href="/login">業界ログイン</Link>}</div><MessageRoom databaseConnected={databaseConnected} industryMode={industryMode}/></main>
}
