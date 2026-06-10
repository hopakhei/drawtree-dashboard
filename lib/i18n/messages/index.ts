import en, { Messages } from "./en";
import zh from "./zh";
import type { Locale } from "../index";

export type { Messages };

export function getMessages(locale: Locale): Messages {
  return locale === "zh" ? zh : en;
}
