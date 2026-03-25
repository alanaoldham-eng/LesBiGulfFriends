"use client";

import { Shield, Lock, UserCheck, Eye } from "lucide-react";
import Link from "next/link";

const privacyFeatures = [
  {
    icon: UserCheck,
    title: "Vetted Membership",
    description:
      "Every new member goes through our thoughtful onboarding process to ensure a safe community.",
  },
  {
    icon: Lock,
    title: "Consent-Based Connections",
    description:
      "Direct messages only unlock after mutual friend requests, so conversations start with consent.",
  },
  {
    icon: Eye,
    title: "Privacy Controls",
    description:
      "Choose what to share. Your email stays private, and you control your visibility in groups.",
  },
  {
    icon: Shield,
    title: "Safe Reporting",
    description:
      "Our team takes concerns seriously. Report issues confidentially and we'll take action.",
  },
];

export function Privacy() {
  return (
    <section className="bg-gradient-to-b from-blush/20 to-cream py-12 md:py-20">
      <div className="container-app">
        <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-xl shadow-coral/5">
          <div className="grid md:grid-cols-2">
            {/* Content Side */}
            <div className="p-6 md:p-10">
              <span className="mb-3 inline-block rounded-full bg-blush px-4 py-1.5 text-sm font-semibold text-wine">
                Your Safety Matters
              </span>
              <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                Privacy by design
              </h2>
              <p className="mb-8 text-pretty text-muted-foreground">
                We built this community with your safety and privacy as the
                foundation. Here's how we protect you:
              </p>

              <div className="space-y-4">
                {privacyFeatures.map((feature) => (
                  <div key={feature.title} className="flex gap-4">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-blush text-wine">
                      <feature.icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="mb-1 text-sm font-bold text-foreground">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Link
                href="/privacy"
                className="mt-8 inline-flex items-center text-sm font-semibold text-sunset transition-colors hover:text-wine"
              >
                Read our full privacy policy →
              </Link>
            </div>

            {/* Visual Side */}
            <div className="relative hidden bg-gradient-to-br from-coral via-sunset to-wine p-10 md:flex md:items-center md:justify-center">
              <div className="relative">
                {/* Decorative elements */}
                <div className="absolute -left-8 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute -bottom-8 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />

                {/* Shield illustration */}
                <div className="relative flex h-48 w-48 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm">
                  <Shield className="h-24 w-24 text-white/90" strokeWidth={1.5} />
                </div>

                {/* Floating badges */}
                <div className="absolute -right-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-wine shadow-lg">
                  Encrypted
                </div>
                <div className="absolute -left-4 bottom-4 rounded-full bg-white px-3 py-1.5 text-xs font-bold text-wine shadow-lg">
                  Private
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
