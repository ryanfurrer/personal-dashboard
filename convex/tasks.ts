import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertValidDueDate(dueDate?: string): void {
  if (!dueDate) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
    throw new Error("Due date must use YYYY-MM-DD format");
  }
}

function compareTasksForList(
  a: {
    is_completed: boolean;
    due_date?: string;
    created_at: number;
  },
  b: {
    is_completed: boolean;
    due_date?: string;
    created_at: number;
  },
): number {
  // Incomplete first
  if (a.is_completed !== b.is_completed) {
    return a.is_completed ? 1 : -1;
  }

  // Tasks with due date first, then due date ascending
  const aDue = a.due_date ?? "";
  const bDue = b.due_date ?? "";
  if (!!aDue !== !!bDue) {
    return aDue ? -1 : 1;
  }
  if (aDue && bDue && aDue !== bDue) {
    return aDue.localeCompare(bDue);
  }

  // Newer first as fallback
  return b.created_at - a.created_at;
}

export const listTasks = query({
  args: {},
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_status", (q) => q.eq("status", "active"))
      .collect();

    return tasks.sort(compareTasksForList);
  },
});

export const getTaskById = query({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.status === "deleted") {
      return null;
    }
    return task;
  },
});

export const createTask = mutation({
  args: {
    title: v.string(),
    notes: v.optional(v.string()),
    dueDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (!title) {
      throw new Error("Task title is required");
    }
    assertValidDueDate(args.dueDate);

    const now = Date.now();
    return await ctx.db.insert("tasks", {
      title,
      notes: args.notes?.trim() || undefined,
      due_date: args.dueDate,
      is_completed: false,
      status: "active",
      created_at: now,
      updated_at: now,
    });
  },
});

export const updateTask = mutation({
  args: {
    taskId: v.id("tasks"),
    title: v.string(),
    notes: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    isCompleted: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.status === "deleted") {
      throw new Error("Task not found");
    }

    const title = args.title.trim();
    if (!title) {
      throw new Error("Task title is required");
    }
    assertValidDueDate(args.dueDate);

    await ctx.db.patch(args.taskId, {
      title,
      notes: args.notes?.trim() || undefined,
      due_date: args.dueDate,
      is_completed: args.isCompleted ?? task.is_completed,
      updated_at: Date.now(),
    });
  },
});

export const toggleTaskComplete = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.status === "deleted") {
      throw new Error("Task not found");
    }

    const nextCompleted = !task.is_completed;
    await ctx.db.patch(args.taskId, {
      is_completed: nextCompleted,
      updated_at: Date.now(),
    });

    return { isCompleted: nextCompleted };
  },
});

export const deleteTask = mutation({
  args: {
    taskId: v.id("tasks"),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task || task.status === "deleted") {
      throw new Error("Task not found");
    }

    const now = Date.now();
    await ctx.db.patch(args.taskId, {
      status: "deleted",
      deleted_at: now,
      updated_at: now,
    });
  },
});
