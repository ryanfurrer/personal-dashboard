
import PageHeader from "@/components/page-header";
import { Archive } from "lucide-react";

export default function ArchivedJournalPage() {
    return (
        <>
            <PageHeader icon={Archive} title="Archived Journal" />
            <main className="p-4 lg:p-6">
                <p>Archived Journal</p>
            </main>
        </>
    );
}
