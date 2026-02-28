import PageHeader from "@/components/page-header";
import SocialPlatformCardSection from "./_components/social-platform-card-section";
import { MessageCircle } from "lucide-react";

export default function SocialsPage() {
    return (
        <>
            <PageHeader icon={MessageCircle} title="Socials" />
            <main className="p-4 lg:p-6">
                <SocialPlatformCardSection />
                <p>Add graphs, quick timeline picker, a date picker, and a way to filter by platform.</p>
            </main>
        </>
    );
}
