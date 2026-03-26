"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { submitFeedbackItem, listReportableProfiles } from "../../lib/db";

export default function FeedbackPage() {
  const [me, setMe] = useState("");
  const [kind, setKind] = useState<"bug" | "feature_request" | "abuse_report">("bug");
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [reportedUserId, setReportedUserId] = useState("");
  const [reportableProfiles, setReportableProfiles] = useState<any[]>([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      const profiles = await listReportableProfiles(user.id).catch(() => []);
      setReportableProfiles(profiles);
    };
    run();
  }, []);

  const submit = async () => {
    try {
      await submitFeedbackItem({
        user_id: me,
        kind,
        title,
        details,
        reported_user_id: kind === "abuse_report" && reportedUserId.trim() ? reportedUserId.trim() : null,
      });
      setStatus(
        kind === "bug"
          ? "Bug report submitted."
          : kind === "feature_request"
            ? "Feature request submitted."
            : "Abuse report submitted."
      );
      setTitle("");
      setDetails("");
      setReportedUserId("");
    } catch (e: any) {
      setStatus(e.message || "Unable to submit feedback.");
    }
  };

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Report a bug, report abuse, or request a feature</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Your note goes straight into the internal database for review.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <div style={{ display: "grid", gap: 12 }}>
            <select
              id="feedback-kind"
              name="feedbackKind"
              value={kind}
              onChange={(e) => setKind(e.target.value as "bug" | "feature_request" | "abuse_report")}
              style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, background: "#fff" }}
            >
              <option value="bug">Report bug</option>
              <option value="feature_request">Request feature</option>
              <option value="abuse_report">Report abuse</option>
            </select>

            {kind === "abuse_report" ? (
              <select
                id="reported-user-id"
                name="reportedUserId"
                value={reportedUserId}
                onChange={(e) => setReportedUserId(e.target.value)}
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16, background: "#fff" }}
              >
                <option value="">Select reported user</option>
                {reportableProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>{profile.display_name || profile.id}</option>
                ))}
              </select>
            ) : null}

            {kind === "abuse_report" ? (
              <input
                id="reported-user-note"
                name="reportedUserNote"
                value={reportedUserId}
                onChange={(e) => setReportedUserId(e.target.value)}
                placeholder="Or paste reported user ID"
                style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
              />
            ) : null}

            <input
              id="feedback-title"
              name="feedbackTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === "abuse_report" ? "Short reason, e.g. Catfish or scammer" : "Short title"}
              style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
            />
            <textarea
              id="feedback-details"
              name="feedbackDetails"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={
                kind === "abuse_report"
                  ? "Tell us what happened and why you are reporting this member."
                  : "Tell us what happened or what you want"
              }
              style={{ minHeight: 140, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }}
            />
            <button
              className="button"
              onClick={submit}
              disabled={!me || !title.trim() || !details.trim() || (kind === "abuse_report" && !reportedUserId.trim())}
            >
              Submit
            </button>
            {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
          </div>
        </section>
      </div>
    </ClientShell>
  );
}
