import type { Metadata } from "next";
import { WalletProvider } from "@/components/WalletProvider";
import { script } from "@/lib/fonts";
import "./globals.css";

export const metadata: Metadata = {
  title: "LoyalChain",
  description: "Real restaurants. Real rewards. On chain.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${script.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body
        className="flex min-h-full flex-col bg-black text-white"
        suppressHydrationWarning
      >
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  );
}
