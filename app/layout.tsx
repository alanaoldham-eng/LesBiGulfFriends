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

            <div id="topbar-actions-slot" className="topbar-actions-slot" />
          </header>

          <main className="container">
            {children}
            <div className="footer-note">
              Start with the web app first. Native iOS and Android can come later with Expo.
            </div>
          </main>
        </div>
      </body>
    </html>
  );
}
