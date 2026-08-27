"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function CandidateSaveButton({
  boxerId,
  databaseConnected,
  compact = false,
}: {
  boxerId: string;
  databaseConnected: boolean;
  compact?: boolean;
}) {
  const [saved,setSaved]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");

  useEffect(()=>{
    try{
      const ids=JSON.parse(localStorage.getItem("ringops_candidate_boxers")||"[]") as string[];
      setSaved(ids.includes(boxerId));
    }catch{/* local review storage only */}
  },[boxerId]);

  function saveLocal(){
    const ids=JSON.parse(localStorage.getItem("ringops_candidate_boxers")||"[]") as string[];
    const next=[...new Set([...ids,boxerId])];
    localStorage.setItem("ringops_candidate_boxers",JSON.stringify(next));
    setSaved(true);
  }

  async function save(){
    if(saved||busy)return;
    setBusy(true);setError("");
    try{
      if(!databaseConnected){
        saveLocal();
        return;
      }

      const supabase=createClient();
      const {data:userData}=await supabase.auth.getUser();
      if(!userData.user){
        saveLocal();
        return;
      }

      const {error:rpcError}=await supabase.schema("ringops").rpc("save_candidate_boxer",{
        p_boxer_id:boxerId,
        p_list_name:"候補選手",
      });
      if(rpcError)throw rpcError;
      setSaved(true);
    }catch{
      setError("保存できませんでした");
    }finally{
      setBusy(false);
    }
  }

  return <div className={compact?"mt-1":"mt-3"}>
    <button
      className={compact
        ? "text-[10px] font-black text-slate-500 underline underline-offset-4 disabled:opacity-50"
        : "flex h-10 w-full items-center justify-center border border-slate-950 px-3 text-xs font-black hover:bg-slate-950 hover:text-white disabled:border-slate-300 disabled:text-slate-400"}
      disabled={saved||busy}
      onClick={save}
      type="button"
    >
      {saved?"候補に保存済み":busy?"保存中…":"候補に保存"}
    </button>
    {error&&<p className="mt-1 text-[10px] font-bold text-rose-700">{error}</p>}
  </div>;
}
