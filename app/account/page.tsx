import type { Metadata } from "next";
import { AccountPageClient } from "@/components/AccountPageClient";

export const metadata: Metadata = {
  title: "Account",
  description: "CardSnap plan, usage, and subscription management.",
};

export default function AccountPage() {
  return <AccountPageClient />;
}
