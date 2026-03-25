import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret) {
      const authHeader = request.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@lesbigulffriends.com";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (!supabaseUrl || !serviceRoleKey || !apiKey) {
      return NextResponse.json({ error: "Missing cron env vars" }, { status: 500 });
    }

    const queryUrl = `${supabaseUrl}/rest/v1/invites?status=eq.failed&select=id,invitee_email,profiles!invites_inviter_id_fkey(display_name)&limit=50`;
    const inviteRes = await fetch(queryUrl, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: "no-store",
    });

    const invites = await inviteRes.json();
    if (!inviteRes.ok) {
      console.error("Failed invites fetch error:", invites);
      return NextResponse.json({ error: "Unable to fetch failed invites", details: invites }, { status: 400 });
    }

    let retried = 0;
    let sent = 0;

    for (const inv of invites || []) {
      retried += 1;
      const inviterName = inv?.profiles?.display_name || "A friend";
      const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>You’re invited to Les Bi Gulf Friends</h2>
          <p>${inviterName} invited you to join Les Bi Gulf Friends.</p>
          <p>Create your account to connect and join the community.</p>
          <p><a href="${siteUrl}/signup" style="display:inline-block;padding:12px 16px;background:#8d2d5d;color:#fff;text-decoration:none;border-radius:10px;">Create account</a></p>
        </div>
      `;

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: `Les Bi Gulf Friends <${fromEmail}>`,
          to: [inv.invitee_email],
          subject: "You’re invited to Les Bi Gulf Friends",
          html,
        }),
      });
      const resendData = await resendRes.json();

      if (resendRes.ok) {
        sent += 1;
        await fetch(`${supabaseUrl}/rest/v1/invites?id=eq.${inv.id}`, {
          method: "PATCH",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            status: "sent",
            sent_at: new Date().toISOString(),
            error_message: null,
            resend_message_id: resendData?.id || null,
          }),
        });
      } else {
        console.error("Retry send failed for invite", inv.id, resendData);
        await fetch(`${supabaseUrl}/rest/v1/invites?id=eq.${inv.id}`, {
          method: "PATCH",
          headers: {
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({
            status: "failed",
            error_message: resendData?.message || resendData?.error || JSON.stringify(resendData),
          }),
        });
      }
    }

    return NextResponse.json({ ok: true, retried, sent });
  } catch (error) {
    console.error("Retry failed invites cron error:", error);
    return NextResponse.json({ error: "Unable to retry failed invites" }, { status: 500 });
  }
}
