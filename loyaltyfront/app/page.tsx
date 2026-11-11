import type { Metadata } from "next";
import SignInScreen from "./signin/SignInScreen";

export const metadata: Metadata = {
  title: "LoyalChain",
  description: "Real restaurants. Real rewards. On chain.",
};

export default function Home() {
  return <SignInScreen />;
}
