"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function safeNextPath(value: FormDataEntryValue | null) {
  const next = String(value ?? "").trim();
  if (!next.startsWith("/") || next.startsWith("//")) return "/";
  return next;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNextPath(formData.get("next"));
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const params = new URLSearchParams({
      error: "メールアドレスまたはパスワードを確認してください",
    });
    if (next !== "/") params.set("next", next);
    redirect(`/login?${params.toString()}`);
  }

  redirect(next);
}

export async function signUp(formData: FormData) {
  const displayName = String(formData.get("displayName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName } },
  });

  if (error) {
    redirect(
      `/login?error=${encodeURIComponent("アカウントを作成できませんでした")}`,
    );
  }

  if (data.session) redirect("/onboarding");

  redirect(
    `/login?message=${encodeURIComponent("確認メールを送信しました。メール確認後にログインしてください。")}`,
  );
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
