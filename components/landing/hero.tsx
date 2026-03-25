"use client";

import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-cream to-background pb-12 pt-6 md:pb-20 md:pt-10">
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-coral/30 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 top-40 h-48 w-48 rounded-full bg-blush/40 blur-3xl" />

      <div className="container-app relative">
        <div className="mb-8 flex items-center gap-3 md:mb-12">
          <Image
            src="/logo.png"
            alt="Les Bi Gulf Friends"
            width={56}
            height={56}
            className="rounded-2xl shadow-lg ring-2 ring-blush"
            priority
          />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
              Les Bi Gulf Friends
            </h1>
            <p className="text-sm text-muted-foreground">
              Gulf Coast Community
            </p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-xl shadow-coral/10 md:p-10">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-coral/30 bg-blush/50 px-4 py-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sunset opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-sunset" />
            </span>
            <span className="text-sm font-semibold text-wine">
              Private Beta • Women-Centered • Mobile-First
            </span>
          </div>

          <h2 className="mb-4 text-balance font-[family-name:var(--font-display)] text-3xl font-bold leading-tight tracking-tight text-foreground md:text-5xl md:leading-tight">
            Your safe space to connect with{" "}
            <span className="text-sunset">like-minded women</span> on the Gulf Coast
          </h2>

          <p className="mb-8 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
            A private, women-centered community built on trust, friendship, and
            mutual respect. Make meaningful connections with lesbian and
            bisexual women who share your interests and values.
          </p>

          <div className="mb-8 flex flex-wrap gap-3">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-sunset px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-sunset/25 transition-all hover:bg-wine hover:shadow-wine/25"
            >
              Join the Community
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-2xl border-2 border-coral bg-white px-6 py-3.5 text-base font-bold text-wine transition-all hover:bg-blush"
            >
              Sign In
            </Link>
          </div>

          <div className="flex flex-wrap gap-4 text-sm font-medium text-foreground/80 md:gap-6">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blush">
                <span aria-hidden="true" className="text-base leading-none text-wine">💬</span>
              </div>
              <span>Friends-first chat</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blush">
                <span aria-hidden="true" className="text-base leading-none text-wine">🛡️</span>
              </div>
              <span>Safety-minded</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blush">
                <span aria-hidden="true" className="text-base leading-none text-wine">👥</span>
              </div>
              <span>Gulf Coast locals</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
