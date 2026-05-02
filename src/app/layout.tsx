import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { EnvBanner } from "@/components/EnvBanner";

export const metadata: Metadata = {
  title: "Athlete Market — Hire student athletes for gigs, content, and coaching",
  description:
    "Athlete Market is the marketplace for student athletes to monetize their NIL with gigs that fit around practice and class. Hire athletes for shoutouts, coaching, content, appearances, and more.",
  metadataBase: new URL("https://athletemarket.app"),
  openGraph: {
    title: "Athlete Market",
    description:
      "Hire student athletes for shoutouts, coaching, content, appearances, and more — on their schedule.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="flex min-h-full flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
        <EnvBanner />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
