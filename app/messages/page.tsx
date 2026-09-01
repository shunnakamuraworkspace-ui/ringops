import { OpsHeader } from "@/components/ops-ui";
import { MessageRoom } from "@/features/messages/components/message-room";
import { loadBoxers } from "@/lib/ringops/load-boxers";

export default async function MessagesPage(){
  const {databaseConnected,industryMode}=await loadBoxers();
  return <main className="mx-auto max-w-[1440px] px-4 pb-8 lg:px-7">
    <OpsHeader title="連絡" description="案件や興行に紐づくやり取りを、条件と一緒に時系列で残します。" />
    <div className="pt-4"><MessageRoom databaseConnected={databaseConnected} industryMode={industryMode}/></div>
  </main>;
}