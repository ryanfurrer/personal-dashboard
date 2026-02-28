"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { groupNotesByTag, NoteItem, stripTagTokens } from "../_lib/note-helpers";

function formatNoteDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function NotesByTag() {
  const notes = useQuery(api.notes.listNotes, {}) as NoteItem[] | undefined;
  const grouped = useMemo(
    () => groupNotesByTag(notes ?? []).filter((group) => group.tag !== "untagged"),
    [notes],
  );

  if (notes === undefined) {
    return <p className="text-sm text-muted-foreground">Loading notes...</p>;
  }

  if (notes.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No notes yet. Add one from the Home page notes textarea.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (grouped.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No tagged notes yet. Add a note with a #tag from the Home page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {grouped.map((group) => (
        <Card key={group.tag} size="sm">
          <CardContent className="space-y-3">
            <h2 className="text-lg leading-none font-semibold tracking-tight text-foreground">
              <span className="text-muted-foreground">#</span>
              {group.tag}
            </h2>
            <div className="space-y-3">
              {group.notes.map((note, index) => {
                const displayText = stripTagTokens(note.content) || note.content.trim();
                return (
                  <div key={`${group.tag}-${note._id}`} className="space-y-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">
                        {formatNoteDate(note.created_at)}
                      </p>
                      <p className="whitespace-pre-wrap text-sm text-foreground">
                        {displayText}
                      </p>
                    </div>
                    {index < group.notes.length - 1 && <Separator />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
