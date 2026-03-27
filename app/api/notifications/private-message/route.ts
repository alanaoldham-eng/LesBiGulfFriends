import { NextRequest, NextResponse } from "next/server";

async function getUserEmail(supabaseUrl: string, serviceRoleKey: string, userId: string) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: "no-store",
  });
  const json = await res.json();
  const user = (json?.users || []).find((u: any) => u.id === userId);
  return user?.email || null;
}

export async function POST(request: NextRequest) {
  try {
    const { recipientUserId, senderName, snippet } = await request.json();
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@lesbigulffriends.com";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!apiKey || !supabaseUrl || !serviceRoleKey || !recipientUserId) {
      return NextResponse.json({ error: "Missing environment variables" }, { status: 500 });
    }

    const settingsRes = await fetch(`${supabaseUrl}/rest/v1/notification_settings?user_id=eq.${recipientUserId}&select=*`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    });
    const settings = await settingsRes.json();
    if (!settings?.[0]?.email_private_messages) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const email = await getUserEmail(supabaseUrl, serviceRoleKey, recipientUserId);
    if (!email) return NextResponse.json({ ok: true, skipped: true });

    const html = `<div style="font-family: Arial, sans-serif; line-height: 1.6;"><h2>New private message</h2><p>${senderName || "A member"} sent you a private message.</p><p style="padding:12px;background:#faf4f7;border-radius:12px;">${snippet || ""}</p><p><a href="${siteUrl}/messages" style="display:inline-block;padding:12px 16px;background:#8d2d5d;color:#fff;text-decoration:none;border-radius:10px;">Open Messages</a></p></div>`;
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Les Bi Gulf Friends <${fromEmail}>`,
        to: [email],
        subject: "You got a new private message",
        html,
      }),
    });
    const data = await resendRes.json();
    if (!resendRes.ok) {
      return NextResponse.json({ error: data?.message || "Unable to send email" }, { status: 400 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: "Unable to send email notification" }, { status: 500 });
  }
}
