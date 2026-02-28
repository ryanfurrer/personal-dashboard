import type { Id } from "@/convex/_generated/dataModel";

export type NoteItem = {
  _id: Id<"notes">;
  content: string;
  tags: string[];
  created_at: number;
  updated_at: number;
};

export type GroupedNotes = Array<{
  tag: string;
  notes: NoteItem[];
}>;

const TAG_TOKEN_PATTERN = /(^|\s)#[a-z0-9_-]+/gi;

export function stripTagTokens(content: string): string {
  return content
    .replace(TAG_TOKEN_PATTERN, " ")
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter((line, index, lines) => line.length > 0 || index !== lines.length - 1)
    .join("\n")
    .trim();
}

export function groupNotesByTag(notes: NoteItem[]): GroupedNotes {
  const groups = new Map<string, NoteItem[]>();

  for (const note of notes) {
    if (note.tags.length === 0) {
      const untagged = groups.get("untagged");
      if (untagged) {
        untagged.push(note);
      } else {
        groups.set("untagged", [note]);
      }
      continue;
    }

    for (const tag of note.tags) {
      const existing = groups.get(tag);
      if (existing) {
        existing.push(note);
      } else {
        groups.set(tag, [note]);
      }
    }
  }

  return Array.from(groups.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tag, taggedNotes]) => ({
      tag,
      notes: taggedNotes.toSorted((a, b) => b.created_at - a.created_at),
    }));
}
