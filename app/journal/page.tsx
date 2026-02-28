
import PageHeader from "@/components/page-header";
import { NotebookText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "journal",
};

export default function JournalPage() {
    return (
        <>
            <PageHeader icon={NotebookText} title="Journal" />
            <main className="p-4 lg:p-6">
                <p>Journal</p>
            </main>
        </>
    );
}
