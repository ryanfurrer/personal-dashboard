import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const TAG_PATTERN = /(^|\s)#([a-z0-9_-]+)/gi;

function extractTags(content: string): string[] {
  const tags = new Set<string>();
  for (const match of content.matchAll(TAG_PATTERN)) {
    const tag = match[2]?.trim().toLowerCase();
    if (!tag) continue;
    tags.add(tag);
  }
  return Array.from(tags).sort((a, b) => a.localeCompare(b));
}

export const listNotes = query({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db
      .query("notes")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return notes.sort((a, b) => b.created_at - a.created_at);
  },
});

export const createNote = mutation({
  args: {
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const content = args.content.trim();
    if (!content) throw new Error("Note content is required");

    const now = Date.now();
    return await ctx.db.insert("notes", {
      content,
      tags: extractTags(content),
      status: "active",
      created_at: now,
      updated_at: now,
    });
  },
});

export const updateNote = mutation({
  args: {
    noteId: v.id("notes"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note || note.status === "deleted") {
      throw new Error("Note not found");
    }

    const content = args.content.trim();
    if (!content) {
      throw new Error("Note content is required");
    }

    await ctx.db.patch(args.noteId, {
      content,
      tags: extractTags(content),
      updated_at: Date.now(),
    });
  },
});

export const deleteNote = mutation({
  args: {
    noteId: v.id("notes"),
  },
  handler: async (ctx, args) => {
    const note = await ctx.db.get(args.noteId);
    if (!note || note.status === "deleted") {
      throw new Error("Note not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.noteId, {
      status: "deleted",
      deleted_at: now,
      updated_at: now,
    });
  },
});
