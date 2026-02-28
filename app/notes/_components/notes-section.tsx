"use client";

import { useMutation, useQuery } from "convex/react";
import { useMemo, useState } from "react";
import { api } from "@/convex/_generated/api";
import SectionHeader from "@/components/section-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { NoteItem } from "../_lib/note-helpers";
import TagHighlightTextarea from "./tag-highlight-textarea";

function normalizeLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

export default function NotesSection() {
  const notes = useQuery(api.notes.listNotes, {}) as NoteItem[] | undefined;
  const createNote = useMutation(api.notes.createNote);
  const updateNote = useMutation(api.notes.updateNote);
  const deleteNote = useMutation(api.notes.deleteNote);

  const [editorValue, setEditorValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [optimisticValue, setOptimisticValue] = useState<string | null>(null);

  const orderedNotes = useMemo(
    () => (notes ?? []).toSorted((a, b) => a.created_at - b.created_at),
    [notes]
  );
  const noteLines = useMemo(() => orderedNotes.map((note) => note.content), [orderedNotes]);
  const serverValue = useMemo(() => noteLines.join("\n"), [noteLines]);
  const pendingOptimisticValue =
    optimisticValue !== null && optimisticValue !== serverValue
      ? optimisticValue
      : null;
  const displayedValue = isFocused ? editorValue : pendingOptimisticValue ?? serverValue;

  const syncNotes = async (sourceValue: string) => {
    if (notes === undefined) return;
    const desired = normalizeLines(sourceValue);
    const existing = orderedNotes;
    const shared = Math.min(desired.length, existing.length);

    for (let i = 0; i < shared; i += 1) {
      if (desired[i] === existing[i].content) continue;
      await updateNote({ noteId: existing[i]._id, content: desired[i] });
    }

    if (desired.length > existing.length) {
      for (let i = existing.length; i < desired.length; i += 1) {
        await createNote({ content: desired[i] });
      }
    }

    if (desired.length < existing.length) {
      for (let i = desired.length; i < existing.length; i += 1) {
        await deleteNote({ noteId: existing[i]._id });
      }
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader title="Notes" id="notes" />
      <Card size="sm">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-semibold">Daily notes</CardTitle>
        </CardHeader>
        <CardContent>
          <TagHighlightTextarea
            value={displayedValue}
            onChange={(event) => {
              setEditorValue(event.target.value);
            }}
            onFocus={() => {
              setEditorValue(displayedValue);
              setIsFocused(true);
            }}
            onBlur={() => {
              const latestValue = editorValue;
              setOptimisticValue(latestValue);
              setIsFocused(false);
              void syncNotes(latestValue);
            }}
            placeholder="Write daily notes... use #tags to save important items."
            className="min-h-52"
          />
        </CardContent>
      </Card>
    </section>
  );
}
