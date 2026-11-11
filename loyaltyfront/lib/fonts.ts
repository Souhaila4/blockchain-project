import { Great_Vibes } from "next/font/google";

/** Decorative script face; preload off to avoid unused preload warnings in dev. */
export const script = Great_Vibes({
  weight: "400",
  subsets: ["latin"],
  preload: false,
  display: "swap",
  variable: "--font-script",
});
