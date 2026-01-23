import SocialPlatformCardSection from "@/components/social-platform-card-section";
import PageHeader from "@/components/page-header";
import { Home } from "lucide-react";

export default function Page() {
    return (
        <>
            <PageHeader icon={Home} title="Home" />
            <main className="p-4 lg:p-6">
                <SocialPlatformCardSection />
            </main>
        </>
    );
}