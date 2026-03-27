import { NextRequest, NextResponse } from "next/server";

async function getUsersByIds(supabaseUrl: string, serviceRoleKey: string) {
  const res = await fetch(`${supabaseUrl}/auth/v1/admin/users`, {
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
    },
    cache: "no-store",
  });
  const json = await res.json();
  return json?.users || [];
}

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@lesbigulffriends.com";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!apiKey || !supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Missing environment variables" }, { status: 500 });
    }

    const settingsRes = await fetch(`${supabaseUrl}/rest/v1/notification_settings?email_breakfast_reminders=eq.true&select=user_id`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    });
    const settings = await settingsRes.json();
    const userIds = (settings || []).map((s: any) => s.user_id);
    if (!userIds.length) return NextResponse.json({ ok: true, sent: 0 });

    const today = new Date().toISOString().slice(0, 10);
    const checkinsRes = await fetch(`${supabaseUrl}/rest/v1/game_checkins?game_key=eq.breakfast_of_champions&checkin_date=eq.${today}&select=user_id`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    });
    const checkins = await checkinsRes.json();
    const checkedInIds = new Set((checkins || []).map((c: any) => c.user_id));
    const users = await getUsersByIds(supabaseUrl, serviceRoleKey);

    let sent = 0;
    for (const userId of userIds) {
      if (checkedInIds.has(userId)) continue;
      const user = users.find((u: any) => u.id === userId);
      const email = user?.email;
      if (!email) continue;
      const html = `<div style="font-family: Arial, sans-serif; line-height: 1.6;"><h2>Breakfast of Champions reminder</h2><p>Take a few minutes to meditate and post your intention for the day.</p><p><a href="${siteUrl}/games/breakfast_of_champions" style="display:inline-block;padding:12px 16px;background:#8d2d5d;color:#fff;text-decoration:none;border-radius:10px;">Check in now</a></p></div>`;
      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Les Bi Gulf Friends <${fromEmail}>`,
          to: [email],
          subject: "Breakfast of Champions reminder",
          html,
        }),
      });
      if (resendRes.ok) sent += 1;
    }

    return NextResponse.json({ ok: true, sent });
  } catch (error) {
    return NextResponse.json({ error: "Unable to send reminders" }, { status: 500 });
  }
}
