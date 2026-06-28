import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { cookies } from "next/headers";
import { Newsreader } from "next/font/google";
import { getLocale } from "@/lib/i18n/server";
import { LocaleProvider } from "@/lib/i18n/LocaleProvider";
import LangSwitcher from "./_components/LangSwitcher";
import ThemeToggle from "./_components/ThemeToggle";

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
  const themeCookie = cookies().get("dt_theme")?.value;
  const theme = themeCookie === "terminal" ? "terminal" : "reasoning";

  return (
    <html
      lang={locale === "zh" ? "zh-Hant" : "en"}
      data-theme={theme === "reasoning" ? "reasoning" : undefined}
      className={newsreader.variable}
    >
      <body className="bg-paper text-ink antialiased font-mono">
        <LocaleProvider initialLocale={locale}>
          <LangSwitcher />
          <ThemeToggle initial={theme} />
          {children}
        </LocaleProvider>
        <Analytics />
      </body>
    </html>
  );
}
