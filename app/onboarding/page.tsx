"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STEPS = [
  {
    title: "Welcome to Les Bi Gulf Friends",
    body: "A women-centered community for lesbian and bi women to find real friendship, groups, and meaningful connection without cold DMs or creepy energy.",
    emoji: "💖",
  },
  {
    title: "Start slow, stay safe",
    body: "You’ll sign in first, then build your profile. Chat unlocks only after friendship, so the experience feels calmer and more intentional.",
    emoji: "🛡️",
  },
  {
    title: "Find your people",
    body: "Browse groups, make friends, and later join real-life events. We want onboarding to feel warm, clear, and exciting — not overwhelming.",
    emoji: "🌈",
  },
  {
    title: "Ready to begin?",
    body: "Create your account, log in with your email and password, and take the first step into the community.",
    emoji: "✨",
  },
];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const item = STEPS[step];

  useEffect(() => {
    localStorage.setItem("lbgf_onboarding_seen", "1");
  }, [step]);

  return (
    <section className="hero">
      <div className="onboarding-shell">
        <div className="onboarding-progress">
          {STEPS.map((_, idx) => (
            <div key={idx} className={`onboarding-dot ${idx <= step ? "active" : ""}`} />
          ))}
        </div>

        <div className="onboarding-card">
          <div className="onboarding-emoji">{item.emoji}</div>
          <h1 style={{ margin: 0, fontSize: 30, lineHeight: 1.1 }}>{item.title}</h1>
          <p style={{ fontSize: 17, lineHeight: 1.7, opacity: 0.9 }}>{item.body}</p>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 10 }}>
            {step > 0 ? (
              <button className="button secondary" onClick={() => setStep(step - 1)}>
                Back
              </button>
            ) : null}

            {step < STEPS.length - 1 ? (
              <button className="button" onClick={() => setStep(step + 1)}>
                Next
              </button>
            ) : (
              <>
                <Link className="button" href="/login">Sign in</Link>
                <Link className="button secondary" href="/">Back to home</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
