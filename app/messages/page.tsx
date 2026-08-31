import { MessageRoom } from "@/features/messages/components/message-room";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function MessagesPage(){
  const {databaseConnected,industryMode}=await loadBoxers();
  return <main className="mx-auto max-w-[1380px] px-4 py-5 lg:px-7">
    <div className="mb-4"><h1 className="text-xl font-black sm:text-2xl">連絡</h1><p className="mt-1 text-xs text-slate-500">案件や興行に紐づくやり取りを、後から追える形で残します。</p></div>
    <div className="mb-4 rounded-lg border border-[#d8e2ea] bg-[#f0f5f8] px-4 py-3 text-xs leading-5 text-[#526879]"><b className="text-[#16324a]">使い方：</b> 左で案件を選び、中央でやり取り、右で関連条件を確認します。確認モードでは送信も試せます。</div>
    <MessageRoom databaseConnected={databaseConnected} industryMode={industryMode}/>
  </main>;
}
