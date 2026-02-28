import PageHeader from "@/components/page-header";
import { NotepadText } from "lucide-react";
import type { Metadata } from "next";
import NotesByTag from "./_components/notes-by-tag";

export const metadata: Metadata = {
    title: "notes",
};

export default function NotesPage() {
    return (
        <>
            <PageHeader icon={NotepadText} title="Notes" />
            <main className="p-4 lg:p-6">
                <NotesByTag />
            </main>
        </>
    );
}
