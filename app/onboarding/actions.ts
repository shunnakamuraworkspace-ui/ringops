"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function createOrganization(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim().toLowerCase();
  const type = String(formData.get("type") ?? "gym");
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) redirect("/login");

  const { error } = await supabase.schema("ringops").rpc("create_organization", {
    p_display_name: displayName,
    p_slug: slug,
    p_type: type,
  });
  if (error) redirect(`/onboarding?error=${encodeURIComponent("組織を登録できませんでした。名称または識別名を確認してください。")}`);
  redirect("/gym");
}
