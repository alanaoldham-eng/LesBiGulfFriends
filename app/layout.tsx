import "./globals.css";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Les Bi Gulf Friends",
  description: "Mobile-first web app for Les Bi Gulf Friends",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <div id="topbar-left-slot" className="topbar-left-slot" />

            <Link href="/app" className="topbar-brand-wrap" aria-label="Les Bi Gulf Friends home">
              <Image
                src="/logo.png"
                alt="Les Bi Gulf Friends"
                width={38}
                height={38}
                style={{ borderRadius: 12, objectFit: "cover" }}
                priority
              />
              <div className="brand">Les Bi Gulf Friends</div>
            </Link>

            <div id="topbar-right-slot" className="topbar-right-slot" />
          </header>

          <main className="container">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
