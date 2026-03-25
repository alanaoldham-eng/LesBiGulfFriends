import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { inviteeEmail, inviterName, eventTitle, startsAt, location } = await request.json();
    if (!inviteeEmail || !eventTitle) {
      return NextResponse.json({ error: "inviteeEmail and eventTitle are required" }, { status: 400 });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@lesbigulffriends.com";
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    if (!apiKey) {
      return NextResponse.json({ error: "Missing RESEND_API_KEY" }, { status: 500 });
    }

    const html = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>You’re invited to an event on Les Bi Gulf Friends</h2>
        <p>${inviterName || "A member"} invited you to: <strong>${eventTitle}</strong></p>
        <p>${startsAt ? `When: ${startsAt}<br/>` : ""}${location ? `Where: ${location}` : ""}</p>
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
        to: [inviteeEmail],
        subject: `Event invite: ${eventTitle}`,
        html,
      }),
    });

    const data = await resendRes.json();
    if (!resendRes.ok) {
      return NextResponse.json({ error: data?.message || "Unable to send event invite email" }, { status: 400 });
    }

    return NextResponse.json({ ok: true, resendMessageId: data?.id || null, sentAt: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json({ error: "Unable to send event invite email" }, { status: 500 });
  }
}
