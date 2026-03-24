import { readJson } from "../lib/content";
import { SectionCard } from "../components/SectionCard";
import Link from "next/link";

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
        <div className="landing-hero">
          <div className="pill">Private beta • women-centered • mobile-first</div>
          <h1 style={{ margin: 0, fontSize: 36, lineHeight: 1.05 }}>{content.title}</h1>
          <p style={{ fontSize: 17, lineHeight: 1.7, opacity: 0.9 }}>{content.intro}</p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Link className="button" href="/signup">Sign up</Link>
            <Link className="button secondary" href="/login">Log in</Link>
          </div>
          <div className="trust-row">
            <span>💬 Friends-first chat</span>
            <span>🛡️ Safety-minded onboarding</span>
            <span>🌴 Gulf Coast community</span>
          </div>
        </div>
      </section>

      <section className="grid">
        {content.cards.map((card) => (
          <SectionCard key={card.title} title={card.title} body={card.body} />
        ))}
      </section>

      <section className="landing-secondary">
        <h2 style={{ marginTop: 0 }}>What happens after sign-in?</h2>
        <div className="grid">
          <SectionCard title="Create your profile" body="Choose a nickname or display name so your email stays private inside the community." />
          <SectionCard title="Make friends first" body="Send or accept friend requests before direct messages unlock, so conversations start with mutual consent." />
          <SectionCard title="Join groups" body="Discover interest-based groups and local circles without feeling flooded by too many features at once." />
        </div>
      </section>
    </>
  );
}
