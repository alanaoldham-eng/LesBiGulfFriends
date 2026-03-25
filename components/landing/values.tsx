"use client";

import { Heart, Sparkles, HandHeart, Eye } from "lucide-react";

const values = [
  {
    icon: Heart,
    title: "Authenticity",
    description:
      "Be yourself. Our community celebrates genuine connections and encourages members to show up as their true selves.",
  },
  {
    icon: Sparkles,
    title: "Respect",
    description:
      "Every member deserves kindness and understanding. We maintain a judgment-free zone where everyone feels valued.",
  },
  {
    icon: HandHeart,
    title: "Support",
    description:
      "We lift each other up. Whether you're newly out or a seasoned community member, you'll find friendship here.",
  },
  {
    icon: Eye,
    title: "Privacy",
    description:
      "Your story is yours to share. We protect member privacy with careful onboarding and consent-based connections.",
  },
];

export function Values() {
  return (
    <section className="bg-background py-12 md:py-20">
      <div className="container-app">
        {/* Section Header */}
        <div className="mb-10 text-center md:mb-14">
          <span className="mb-3 inline-block rounded-full bg-blush px-4 py-1.5 text-sm font-semibold text-wine">
            Our Values
          </span>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground md:text-4xl">
            Built on trust & respect
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
            Everything we do is guided by our commitment to creating a safe,
            welcoming space for women to connect.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid gap-4 md:grid-cols-2 md:gap-6">
          {values.map((value) => (
            <div
              key={value.title}
              className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition-all hover:border-coral/50 hover:shadow-lg hover:shadow-coral/10"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-coral to-sunset text-white shadow-md shadow-sunset/20">
                <value.icon className="h-6 w-6" />
              </div>
              <h3 className="mb-2 text-lg font-bold text-foreground">
                {value.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {value.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
