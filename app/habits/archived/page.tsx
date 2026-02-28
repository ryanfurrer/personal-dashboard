import HabitsSection from "../_components/habits-section";
import PageHeader from "@/components/page-header";
import { Archive } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "archived habits",
};

export default function ArchivedHabitsPage() {
  return (
    <>
      <PageHeader icon={Archive} title="Archived Habits" />
      <main className="p-4 lg:p-6">
        <HabitsSection mode="archived" />
      </main>
    </>
  );
}
