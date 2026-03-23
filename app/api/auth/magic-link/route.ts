import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../../../lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const supabase = createServerSupabase();
    const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    request.headers.get("x-forwarded-proto") && request.headers.get("x-forwarded-host")
    ? `${request.headers.get("x-forwarded-proto")}://${request.headers.get("x-forwarded-host")}`
    : request.headers.get("origin") ||
      "http://localhost:3000";

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to send magic link" }, { status: 500 });
  }
}
