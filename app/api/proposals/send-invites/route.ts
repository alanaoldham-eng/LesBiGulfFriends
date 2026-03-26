import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { title, expiresAt, electionKey } = await request.json();
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@lesbigulffriends.com";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!apiKey || !supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing environment variables" }, { status: 500 });
    }

    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?select=id,display_name&display_name=not.is.null`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    });
    const profiles = await profileRes.json();

    const usersRes = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    });
    const usersJson = await usersRes.json();
    const users = usersJson?.users || [];

    const profileIds = new Set((profiles || []).map((p: any) => p.id));
    let sent = 0;
    for (const user of users) {
      if (!profileIds.has(user.id)) continue;
      const email = user.email;
      if (!email) continue;
      const html = `<div style="font-family: Arial, sans-serif; line-height:1.6;"><h2>New proposal: ${title}</h2><p>A new community proposal is open for voting.</p><p>Election: ${electionKey}<br/>Expires: ${expiresAt}</p><p><a href="${siteUrl}/proposals" style="display:inline-block;padding:12px 16px;background:#8d2d5d;color:#fff;text-decoration:none;border-radius:10px;">Vote now</a></p></div>`;
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Les Bi Gulf Friends <${fromEmail}>`,
          to: [email],
          subject: `Vote now: ${title}`,
          html,
        }),
      });
      if (resendRes.ok) sent += 1;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    return NextResponse.json({ error: "Unable to send proposal invites" }, { status: 500 });
  }
}
