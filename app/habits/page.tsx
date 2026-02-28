import HabitsSection from "./_components/habits-section";
import PageHeader from "@/components/page-header";
import { CalendarCheck } from "lucide-react";

export default function HabitsPage() {
  return (
    <>
      <PageHeader icon={CalendarCheck} title="Habits" />
      <main className="p-4 lg:p-6">
        <HabitsSection mode="active" />
      </main>
    </>
  );
}
