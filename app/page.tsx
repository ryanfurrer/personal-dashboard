// @ts-expect-error - Direct import for performance
import Home from "lucide-react/dist/esm/icons/home";
import PageHeader from "@/components/page-header";
import HabitsSection from "./habits/_components/habits-section";
import TasksSection from "./tasks/_components/tasks-section";
import NotesSection from "./notes/_components/notes-section";
import SocialPlatformCardSectionDynamic from "./socials/_components/social-platform-card-section-dynamic";

export default function Page() {
  return (
    <>
      <PageHeader icon={Home} title="Home" />
      <main className="p-4 lg:p-6">
        <div className="flex flex-col gap-12">

          {/* Primary area — two columns on xl+ */}
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 xl:gap-8 items-start">

            {/* Left: action-oriented sections */}
            <div className="flex flex-col gap-12">
              <TasksSection />
              <HabitsSection />
            </div>

            {/* Right: notes panel — sticky on large screens */}
            <aside className="xl:sticky xl:top-[4.5rem]">
              <NotesSection />
            </aside>

          </div>

          {/* Social metrics — full width, informational */}
          <SocialPlatformCardSectionDynamic />

        </div>
      </main>
    </>
  );
}
