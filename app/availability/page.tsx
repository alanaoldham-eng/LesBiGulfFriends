"use client";
export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import { ClientShell } from "../../components/ClientShell";
import { getCurrentUser } from "../../lib/auth";
import { listAvailabilityEntries, listProfilesForAdmin, upsertAvailabilityEntry, deleteAvailabilityEntry } from "../../lib/db";

function formatLocal(dt: string) {
  return new Date(dt).toLocaleString();
}

export default function AvailabilityPage() {
  const [me, setMe] = useState("");
  const [entries, setEntries] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");

  const dateFrom = useMemo(() => new Date().toISOString(), []);
  const dateTo = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 3);
    return d.toISOString();
  }, []);

  const refresh = async () => {
    const [rows, profileRows] = await Promise.all([
      listAvailabilityEntries(dateFrom, dateTo).catch(() => []),
      listProfilesForAdmin().catch(() => []),
    ]);
    setEntries(rows);
    setProfiles(profileRows);
  };

  useEffect(() => {
    const run = async () => {
      const user = await getCurrentUser();
      if (!user) return;
      setMe(user.id);
      await refresh();
    };
    run();
  }, []);

  const save = async () => {
    try {
      await upsertAvailabilityEntry({
        user_id: me,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        note: note || null,
      });
      setStatus("Availability saved.");
      setStartAt("");
      setEndAt("");
      setNote("");
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to save availability.");
    }
  };

  const remove = async (id: string) => {
    try {
      await deleteAvailabilityEntry(id, me);
      setStatus("Availability deleted.");
      await refresh();
    } catch (e: any) {
      setStatus(e.message || "Unable to delete availability.");
    }
  };

  const profileMap = new Map(profiles.map((p: any) => [p.id, p]));

  return (
    <ClientShell>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30 }}>Availability calendar</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>
          Share your availability for the next 3 months so members can plan group events together.
        </p>
      </section>

      <div className="grid">
        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Your availability</h3>
          <div style={{ display: "grid", gap: 12 }}>
            <input id="availability-start" name="availabilityStart" type="datetime-local" value={startAt} onChange={(ev) => setStartAt(ev.target.value)} style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <input id="availability-end" name="availabilityEnd" type="datetime-local" value={endAt} onChange={(ev) => setEndAt(ev.target.value)} style={{ padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <textarea id="availability-note" name="availabilityNote" value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Optional note" style={{ minHeight: 100, padding: "14px 16px", borderRadius: 16, border: "1px solid #d7a8bf", fontSize: 16 }} />
            <button className="button" onClick={save} disabled={!startAt || !endAt}>Save availability</button>
            {status ? <p style={{ margin: 0, opacity: 0.8 }}>{status}</p> : null}
          </div>
        </section>

        <section style={{ border: "1px solid #e9d7e2", borderRadius: 20, padding: 16, background: "#fff" }}>
          <h3 style={{ marginTop: 0 }}>Community availability</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {entries.length ? entries.map((entry) => {
              const p = profileMap.get(entry.user_id);
              return (
                <div key={entry.id} style={{ border: "1px solid #f1dfe8", borderRadius: 16, padding: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                    <div>
                      <strong>{p?.display_name || "Member"}</strong>
                      <div style={{ opacity: 0.8 }}>{formatLocal(entry.start_at)} → {formatLocal(entry.end_at)}</div>
                      {entry.note ? <div style={{ opacity: 0.75 }}>{entry.note}</div> : null}
                    </div>
                    {entry.user_id === me ? <button className="button secondary" onClick={() => remove(entry.id)}>Delete</button> : null}
                  </div>
                </div>
              );
            }) : <p style={{ opacity: 0.8, margin: 0 }}>No availability shared yet.</p>}
          </div>
        </section>
      </div>
    </ClientShell>
  );
}
