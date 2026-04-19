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
  if (!args.apiKey) return;

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

    const { data: existingInvites } = await supabase
      .from("event_invites")
      .select("invitee_user_id")
      .eq("event_id", body.eventId);

    const existingIds = new Set((existingInvites || []).map((x: any) => x.invitee_user_id).filter(Boolean));

    let targetIds: string[] = [];
    if (body.mode === "public") {
      const { data: profiles } = await supabase.from("profiles").select("id");
      targetIds = (profiles || []).map((p: any) => p.id);
    } else {
      targetIds = body.friendIds || [];
    }

    targetIds = targetIds.filter((id) => id && !existingIds.has(id) && id !== body.ownerId);

    const usersResponse = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const userMap = new Map((usersResponse.data?.users || []).map((u: any) => [u.id, u.email]));

    const { data: settings } = await supabase
      .from("notification_settings")
      .select("user_id, email_event_invites")
      .in("user_id", targetIds);

    const settingMap = new Map((settings || []).map((s: any) => [s.user_id, !!s.email_event_invites]));

    for (const userId of targetIds) {
      const email = userMap.get(userId);
      if (!email) continue;

      await supabase.from("event_invites").insert({
        event_id: body.eventId,
        inviter_id: body.ownerId,
        invitee_email: String(email).toLowerCase(),
        invitee_user_id: userId,
        status: "sent",
        sent_at: new Date().toISOString(),
      });

      if (settingMap.get(userId)) {
        await sendEmailIfOptedIn({
          apiKey: resendApiKey,
          fromEmail,
          to: email,
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
