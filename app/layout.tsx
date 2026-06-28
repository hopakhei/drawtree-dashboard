import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Newsreader } from "next/font/google";
import { getLocale } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import LangSwitcher from "./_components/LangSwitcher";

const newsreader = Newsreader({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600"],
  variable: "--font-serif-src",
});

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
  const locale = getLocale();

  return (
    <html
      lang={locale === "zh" ? "zh-Hant" : "en"}
      data-theme="reasoning"
      className={newsreader.variable}
    >
      <body className="bg-paper text-ink antialiased font-mono">
        <LocaleProvider initialLocale={locale}>
          <LangSwitcher />
          {children}
        </LocaleProvider>
        <Analytics />
      </body>
    </html>
  );
}
