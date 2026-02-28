
import PageHeader from "@/components/page-header";
import { Archive } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "archived notes",
};

export default function ArchivedNotesPage() {
    return (
        <>
            <PageHeader icon={Archive} title="Archived Notes" />
            <main className="p-4 lg:p-6">
                <p>Archived Notes</p>
            </main>
        </>
    );
}
