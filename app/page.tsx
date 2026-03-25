import { Hero } from "@/components/landing/hero";
import { Values } from "@/components/landing/values";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Groups } from "@/components/landing/groups";
import { Events } from "@/components/landing/events";
import { Privacy } from "@/components/landing/privacy";
import { CTA } from "@/components/landing/cta";
import { Footer } from "@/components/landing/footer";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <Values />
      <HowItWorks />
      <Groups />
      <Events />
      <Privacy />
      <CTA />
      <Footer />
    </main>
  );
}
