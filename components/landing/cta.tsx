"use client";

import Link from "next/link";
import { Heart } from "lucide-react";

export function CTA() {
  return (
    <section className="bg-background py-12 md:py-20">
      <div className="container-app">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-coral via-sunset to-wine p-8 text-center shadow-2xl md:p-14">
          {/* Decorative elements */}
          <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <div className="mb-6 inline-flex items-center justify-center rounded-full bg-white/20 p-4 backdrop-blur-sm">
              <Heart className="h-8 w-8 text-white" fill="currentColor" />
            </div>

            <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-bold text-white md:text-4xl">
              Ready to find your community?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-pretty text-white/90 md:text-lg">
              Join hundreds of lesbian and bisexual women building genuine
              friendships across the Gulf Coast.
            </p>

            <div className="flex flex-wrap justify-center gap-4">
              <Link
                href="/signup"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 text-base font-bold text-wine shadow-xl transition-all hover:bg-blush hover:shadow-2xl"
              >
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-2xl border-2 border-white/30 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              >
                I Have an Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
