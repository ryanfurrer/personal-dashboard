"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { groupNotesByTag, NoteItem, stripTagTokens } from "../_lib/note-helpers";

function formatNoteDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
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
    return (
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={`note-tag-skeleton-${index}`}
            className="flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 shadow-xs"
          >
            <div className="flex items-baseline justify-between gap-2 border-b border-border/60 px-4 py-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="flex flex-col divide-y divide-border/40">
              {Array.from({ length: 2 }).map((_, noteIndex) => (
                <div key={noteIndex} className="flex flex-col gap-1.5 px-4 py-3">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </section>
    );
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
        <article
          key={group.tag}
          className="flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10 shadow-xs"
        >
          {/* Tag header */}
          <div className="flex items-baseline justify-between gap-2 border-b border-border/60 px-4 py-3">
            <h2 className="truncate text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              <span className="text-sky-500 dark:text-sky-400">#</span>
              {group.tag}
            </h2>
            <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground/50">
              {group.notes.length === 1 ? "1 note" : `${group.notes.length} notes`}
            </span>
          </div>

          {/* Notes — divide-y replaces manual Separator + index check */}
          <div className="flex flex-col divide-y divide-border/40">
            {group.notes.map((note) => {
              const displayText = stripTagTokens(note.content) || note.content.trim();
              return (
                <div key={note._id} className="flex flex-col gap-1 px-4 py-3">
                  <p className="text-[10px] tabular-nums text-muted-foreground/50">
                    {formatNoteDate(note.created_at)}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                    {displayText}
                  </p>
                </div>
              );
            })}
          </div>
        </article>
      ))}
    </section>
  );
}
