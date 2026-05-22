import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Draw Tree — the wire protocol for AI-native equity research",
  description:
    "Every investment thesis as a falsifiable tree. Every claim with a kill condition. Every verdict signed and timestamped.",
  openGraph: {
    title: "Draw Tree",
    description:
      "The wire protocol for AI-native equity research. Five verbs. JSON-on-HTTP. Ed25519-signed.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-paper text-ink antialiased font-mono">
        {children}
      </body>
    </html>
  );
}
