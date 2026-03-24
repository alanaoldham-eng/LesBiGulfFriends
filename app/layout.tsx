import "./globals.css";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Les Bi Gulf Friends",
  description: "Mobile-first web app starter for Les Bi Gulf Friends",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <Image
              src="/logo.png"
              alt="Les Bi Gulf Friends"
              width={44}
              height={44}
              style={{ borderRadius: 12, objectFit: "cover" }}
            />
            <div>
              <div className="brand">Les Bi Gulf Friends</div>
              <div className="brand-sub">Vercel + Tina + Supabase starter</div>
            </div>
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
