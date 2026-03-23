import { readJson } from "../../lib/content";

type PrivacyContent = {
  title: string;
  body: string;
};

export default function PrivacyPage() {
  const content = readJson<PrivacyContent>("content/community/privacy.json");

  return (
    <>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 28 }}>{content.title}</h1>
        <p style={{ fontSize: 16, lineHeight: 1.7 }}>{content.body}</p>
      </section>
      <section
        style={{
          border: "1px solid #ecdbe4",
          borderRadius: 20,
          padding: 16,
          background: "#fff",
        }}
      >
        <h2 style={{ marginTop: 0 }}>Starter privacy checklist</h2>
        <ul style={{ lineHeight: 1.7, paddingLeft: 18 }}>
          <li>Collect only the minimum data you need.</li>
          <li>Keep Supabase service role keys off the client.</li>
          <li>Store profile photos in a controlled bucket.</li>
          <li>Add a full hosted privacy policy before public launch.</li>
        </ul>
      </section>
    </>
  );
}
