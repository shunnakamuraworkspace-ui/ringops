"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function acceptInvitation(formData: FormData){
  const token=String(formData.get("token")??"").trim();
  const supabase=await createClient();
  const {data:userData}=await supabase.auth.getUser();
  if(!userData.user)redirect(`/login?message=${encodeURIComponent("招待を受けるには、招待されたメールアドレスでログインしてください。")}`);
  const {error}=await supabase.schema("ringops").rpc("accept_organization_invitation",{p_token:token});
  if(error)redirect(`/invite?token=${encodeURIComponent(token)}&error=${encodeURIComponent("招待を受けられませんでした。メールアドレス、有効期限、ログイン状態を確認してください。")}`);
  redirect("/gym");
}
