import SocialPlatformCardSection from "./socials/_components/social-platform-card-section";
import PageHeader from "@/components/page-header";
import { Home } from "lucide-react";
import HabitsSection from "./habits/_components/habits-section";

export default function Page() {
    return (
        <>
            <PageHeader icon={Home} title="Home" />
            <main className="p-4 lg:p-6 space-y-12">
                <SocialPlatformCardSection />
                <HabitsSection />
            </main>
        </>
    );
}
