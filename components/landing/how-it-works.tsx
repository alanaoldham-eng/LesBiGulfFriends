"use client";

import { UserPlus, Users, MessageSquare, PartyPopper } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Create your profile",
    description:
      "Sign up and customize your profile. Choose a display name to keep your email private.",
  },
  {
    icon: Users,
    step: "02",
    title: "Make friends first",
    description:
      "Browse profiles and send friend requests. Conversations start with mutual consent.",
  },
  {
    icon: MessageSquare,
    step: "03",
    title: "Start chatting",
    description:
      "Once you're friends, direct messages unlock. Chat privately and build real connections.",
  },
  {
    icon: PartyPopper,
    step: "04",
    title: "Join the community",
    description:
      "Discover groups, attend events, and become part of our growing Gulf Coast family.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-cream py-12 md:py-20">
      <div className="container-app">
        {/* Section Header */}
        <div className="mb-10 text-center md:mb-14">
          <span className="mb-3 inline-block rounded-full bg-blush px-4 py-1.5 text-sm font-semibold text-wine">
            Getting Started
          </span>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground md:text-4xl">
            How it works
          </h2>
          <p className="mx-auto max-w-2xl text-pretty text-muted-foreground">
            Joining our community is simple and safe. Here's what happens after
            you sign up.
          </p>
        </div>

        {/* Steps */}
        <div className="grid gap-6 md:grid-cols-4">
          {steps.map((item, index) => (
            <div key={item.step} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-12 hidden h-0.5 w-full bg-gradient-to-r from-coral to-blush md:block" />
              )}

              <div className="relative flex flex-col items-center text-center">
                {/* Step number badge */}
                <div className="relative mb-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-coral to-sunset text-white shadow-lg shadow-sunset/25 md:h-20 md:w-20">
                    <item.icon className="h-8 w-8 md:h-10 md:w-10" strokeWidth={1.5} />
                  </div>
                  <span className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-wine text-xs font-bold text-white">
                    {item.step}
                  </span>
                </div>

                <h3 className="mb-2 text-base font-bold text-foreground md:text-lg">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
