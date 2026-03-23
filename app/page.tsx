import { readJson } from "../lib/content";
import { SectionCard } from "../components/SectionCard";

type HomeContent = {
  title: string;
  intro: string;
  cards: { title: string; body: string }[];
};

export default function HomePage() {
  const content = readJson<HomeContent>("content/pages/home.json");

  return (
    <>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.1 }}>{content.title}</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>{content.intro}</p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <a className="button" href="/admin/index.html">Open Tina Admin</a>
          <a className="button secondary" href="https://supabase.com/dashboard">Open Supabase</a>
        </div>
      </section>
      <div className="grid">
        {content.cards.map((card) => (
          <SectionCard key={card.title} title={card.title} body={card.body} />
        ))}
      </div>
    </>
  );
}
