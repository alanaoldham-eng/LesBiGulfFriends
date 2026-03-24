"use client";

import Image from "next/image";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border bg-cream py-10 md:py-14">
      <div className="container-app">
        <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-start md:justify-between md:text-left">
          {/* Logo & Info */}
          <div className="flex flex-col items-center md:items-start">
            <div className="mb-3 flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Les Bi Gulf Friends"
                width={40}
                height={40}
                className="rounded-xl"
              />
              <span className="text-lg font-bold text-foreground">
                Les Bi Gulf Friends
              </span>
            </div>
            <p className="max-w-xs text-sm text-muted-foreground">
              A private, women-centered community for lesbian and bisexual women
              on the Gulf Coast.
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center gap-6 text-sm md:justify-end">
            <Link
              href="/privacy"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/groups"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Groups
            </Link>
            <Link
              href="/events"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Events
            </Link>
            <Link
              href="/login"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 flex flex-col items-center gap-3 border-t border-border pt-6 text-xs text-muted-foreground md:flex-row md:justify-between">
          <p>© 2026 Les Bi Gulf Friends. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with{" "}
            <span className="text-sunset">♥</span>{" "}
            using Next.js + Tina + Supabase
          </p>
        </div>
      </div>
    </footer>
  );
}
