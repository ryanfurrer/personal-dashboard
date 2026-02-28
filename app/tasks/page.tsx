import PageHeader from "@/components/page-header";
import { ListTodo } from "lucide-react";
import TasksSection from "./_components/tasks-section";

export default function TasksPage() {
  return (
    <>
      <PageHeader icon={ListTodo} title="Tasks" />
      <main className="p-4 lg:p-6">
        <TasksSection />
      </main>
    </>
  );
}
