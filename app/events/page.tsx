import { readJson } from "../../lib/content";
import { SectionCard } from "../../components/SectionCard";

type Content = {
  title: string;
  intro: string;
  cards: { title: string; body: string }[];
};

export default function EventsPage() {
  const content = readJson<Content>("content/pages/events.json");

  return (
    <>
      <section className="hero">
        <h1 style={{ margin: 0, fontSize: 28 }}>{content.title}</h1>
        <p style={{ fontSize: 16, lineHeight: 1.6, opacity: 0.9 }}>{content.intro}</p>
      </section>
      <div className="grid">
        {content.cards.map((card) => (
          <SectionCard key={card.title} title={card.title} body={card.body} />
        ))}
      </div>
    </>
  );
}
