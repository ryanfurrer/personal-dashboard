import type { Id } from "@/convex/_generated/dataModel";

export type TaskItem = {
  _id: Id<"tasks">;
  title: string;
  notes?: string;
  due_date?: string;
  is_completed: boolean;
  status: "active" | "deleted";
  created_at: number;
  updated_at: number;
  deleted_at?: number;
};

export type TaskFormState = {
  title: string;
  notes: string;
  dueDate: string;
  isCompleted: boolean;
};

export type TaskStatusResult = {
  success: boolean;
  message: string;
};

export type TaskMutationPayload = {
  title: string;
  notes?: string;
  dueDate?: string;
  isCompleted?: boolean;
};

export function defaultTaskFormState(): TaskFormState {
  return {
    title: "",
    notes: "",
    dueDate: "",
    isCompleted: false,
  };
}

export function toTaskFormState(task: TaskItem): TaskFormState {
  return {
    title: task.title,
    notes: task.notes ?? "",
    dueDate: task.due_date ?? "",
    isCompleted: task.is_completed,
  };
}

export function validateTaskForm(
  form: TaskFormState,
): { ok: true } | { ok: false; error: string } {
  if (!form.title.trim()) {
    return { ok: false, error: "Task title is required." };
  }
  if (form.dueDate && !/^\d{4}-\d{2}-\d{2}$/.test(form.dueDate)) {
    return { ok: false, error: "Due date must be in YYYY-MM-DD format." };
  }
  return { ok: true };
}

export function buildTaskMutationPayload(form: TaskFormState): TaskMutationPayload {
  return {
    title: form.title.trim(),
    notes: form.notes.trim() || undefined,
    dueDate: form.dueDate || undefined,
    isCompleted: form.isCompleted,
  };
}

export function sortTasks(tasks: TaskItem[]): TaskItem[] {
  return [...tasks].sort((a, b) => {
    if (a.is_completed !== b.is_completed) {
      return a.is_completed ? 1 : -1;
    }

    const aDue = a.due_date ?? "";
    const bDue = b.due_date ?? "";
    if (!!aDue !== !!bDue) {
      return aDue ? -1 : 1;
    }
    if (aDue && bDue && aDue !== bDue) {
      return aDue.localeCompare(bDue);
    }

    return b.created_at - a.created_at;
  });
}
