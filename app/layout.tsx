import "./globals.css";
import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Les Bi Gulf Friends | Women-Centered Community",
  description:
    "A private, mobile-first community for lesbian and bisexual women on the Gulf Coast. Connect with like-minded friends in a safe, welcoming space.",
  openGraph: {
    title: "Les Bi Gulf Friends",
    description: "Women-centered community for the Gulf Coast",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#D55A4A",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${fraunces.variable}`}>
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
