import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .schema("ringops")
      .from("boxers")
      .select("id", { count: "exact", head: true })
      .eq("is_public", true);

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      app: "RINGOPS",
      database: "connected",
      publicBoxers: count ?? 0,
      checkedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        app: "RINGOPS",
        database: "unavailable",
        checkedAt: new Date().toISOString(),
      },
      { status: 503 },
    );
  }
}
