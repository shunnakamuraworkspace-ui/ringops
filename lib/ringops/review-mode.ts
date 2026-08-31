import { cookies } from "next/headers";

export const reviewModeEnabled = process.env.RINGOPS_REVIEW_MODE !== "false";

export async function hasSupabaseSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore
    .getAll()
    .some(({ name }) => name.startsWith("sb-") && name.includes("auth-token"));
}

export async function shouldUseReviewMode() {
  if (!reviewModeEnabled) return false;
  return !(await hasSupabaseSessionCookie());
}
