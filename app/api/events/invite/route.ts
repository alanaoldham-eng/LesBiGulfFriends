import { createClient } from "@supabase/supabase-js";

type InviteBody = {
  mode: "public" | "private";
  eventId: string;
  ownerId: string;
  friendIds?: string[];
};

async function sendEmailIfOptedIn(args: {
  apiKey?: string | null;
  fromEmail: string;
  to: string;
  subject: string;
  html: string;
}) {
  if (!args.apiKey || !args.to) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${args.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: args.fromEmail,
      to: [args.to],
      subject: args.subject,
      html: args.html,
    }),
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as InviteBody;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRole) {
      return Response.json({ ok: false, error: "Missing Supabase server env." }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, serviceRole);
    const resendApiKey = process.env.RESEND_API_KEY || null;
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@example.com";

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("id", body.eventId)
      .single();

    if (eventError) {
      return Response.json({ ok: false, error: eventError.message }, { status: 400 });
    }

    let targetIds: string[] = [];

    if (body.mode === "public") {
      const { data: profiles, error: profileError } = await supabase
        .from("profiles")
        .select("id, membership_status");

      if (profileError) {
        return Response.json({ ok: false, error: profileError.message }, { status: 400 });
      }

      targetIds = (profiles || [])
        .filter((p: any) => !p.membership_status || p.membership_status === "active")
        .map((p: any) => p.id);
    } else {
      targetIds = body.friendIds || [];
    }

    targetIds = [...new Set(targetIds.filter((id) => id && id !== body.ownerId))];

    if (!targetIds.length) {
      return Response.json({ ok: true, invitedCount: 0 });
    }

    const usersResponse = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const userMap = new Map((usersResponse.data?.users || []).map((u: any) => [u.id, u.email]));

    const { data: settings } = await supabase
      .from("notification_settings")
      .select("user_id, email_event_invites")
      .in("user_id", targetIds);

    const settingMap = new Map((settings || []).map((s: any) => [s.user_id, !!s.email_event_invites]));

    const now = new Date().toISOString();

    for (const userId of targetIds) {
      const email = userMap.get(userId);
      const row = {
        event_id: body.eventId,
        inviter_id: body.ownerId,
        invitee_email: email ? String(email).toLowerCase() : `${userId}@member.local`,
        invitee_user_id: userId,
        status: "sent",
        sent_at: now,
      };

      const { data: existing } = await supabase
        .from("event_invites")
        .select("id")
        .eq("event_id", row.event_id)
        .eq("invitee_user_id", row.invitee_user_id)
        .maybeSingle();

      if (existing?.id) {
        await supabase
          .from("event_invites")
          .update({
            status: "sent",
            sent_at: row.sent_at,
            invitee_email: row.invitee_email,
            inviter_id: row.inviter_id,
          })
          .eq("id", existing.id);
      } else {
        await supabase.from("event_invites").insert(row);
      }

      if (email && settingMap.get(userId)) {
        await sendEmailIfOptedIn({
          apiKey: resendApiKey,
          fromEmail,
          to: String(email),
          subject: `You're invited: ${event.title}`,
          html: `<p>You have been invited to <strong>${event.title}</strong>.</p><p>Starts: ${event.starts_at}</p><p>Location: ${event.location || "TBA"}</p>`,
        });
      }
    }

    return Response.json({ ok: true, invitedCount: targetIds.length });
  } catch (error: any) {
    return Response.json({ ok: false, error: error?.message || "Unknown error" }, { status: 500 });
  }
}
