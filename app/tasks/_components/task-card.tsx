"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// @ts-expect-error - Direct import for performance
import Check from "lucide-react/dist/esm/icons/check";
// @ts-expect-error - Direct import for performance
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
// @ts-expect-error - Direct import for performance
import Pencil from "lucide-react/dist/esm/icons/pencil";
// @ts-expect-error - Direct import for performance
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { cn } from "@/lib/utils";
import { TaskItem, TaskStatusResult } from "../_lib/task-helpers";

type DueDateStatus = "overdue" | "today" | "soon" | "future";

function getDueDateStatus(dueDate: string): DueDateStatus {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(`${dueDate}T00:00:00`);
  const diffDays = Math.round((due.getTime() - today.getTime()) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  if (diffDays <= 4) return "soon";
  return "future";
}

function formatDueDate(dueDate: string, status: DueDateStatus): string {
  const due = new Date(`${dueDate}T00:00:00`);
  const formatted = due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  if (status === "today") return "Due today";
  if (status === "overdue") return `Overdue · ${formatted}`;
  return `Due ${formatted}`;
}

type TaskCardProps = {
  task: TaskItem;
  status?: TaskStatusResult;
  pendingActionId?: Id<"tasks"> | null;
  onToggleComplete?: (task: TaskItem) => void;
  onEdit?: (task: TaskItem) => void;
  onDelete?: (task: TaskItem) => void;
};

export function TaskCard({
  task,
  status,
  pendingActionId,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const actionDisabled = pendingActionId === task._id;
  const dueDateStatus = task.due_date ? getDueDateStatus(task.due_date) : null;

  const accentClass = task.is_completed
    ? "bg-emerald-500/60"
    : dueDateStatus === "overdue"
    ? "bg-rose-500"
    : dueDateStatus === "today" || dueDateStatus === "soon"
    ? "bg-amber-500"
    : "bg-foreground/10";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 shadow-xs transition-[box-shadow] duration-150 ease hover:shadow-sm">
      {/* Left urgency accent */}
      <div
        className={cn(
          "absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full transition-[background-color] duration-200 ease-out motion-reduce:transition-none",
          accentClass,
        )}
      />

      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Title row: checkbox + title + menu */}
        <div className="flex items-start gap-2.5">
          {/* Toggle checkbox */}
          <button
            onClick={() => onToggleComplete?.(task)}
            disabled={actionDisabled}
            aria-label={task.is_completed ? "Mark as incomplete" : "Mark as complete"}
            className={cn(
              "mt-px size-[18px] shrink-0 rounded-full border-2 flex items-center justify-center",
              "touch-manipulation select-none",
              "transition-[background-color,border-color] duration-150 ease motion-reduce:transition-none",
              "active:scale-[0.88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "disabled:pointer-events-none disabled:opacity-40",
              task.is_completed
                ? "bg-emerald-500 border-emerald-500"
                : "border-foreground/25 bg-transparent hover:border-foreground/50",
            )}
          >
            {task.is_completed ? (
              <Check className="size-2.5 text-white" aria-hidden="true" />
            ) : null}
          </button>

          <span
            className={cn(
              "flex-1 min-w-0 text-sm font-medium leading-snug",
              "transition-[color,opacity,text-decoration-color] duration-200 ease-out motion-reduce:transition-none",
              task.is_completed
                ? "text-muted-foreground/50 line-through decoration-muted-foreground/30"
                : "text-foreground",
            )}
          >
            {task.title}
          </span>

          {/* Actions — visible on hover/focus */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Task actions"
                  disabled={actionDisabled}
                  className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150 ease motion-reduce:transition-none"
                />
              }
            >
              <MoreHorizontal className="size-3" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {onEdit ? (
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
              ) : null}
              {onDelete ? (
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(task)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Notes */}
        {task.notes ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground pl-[26px]">
            {task.notes}
          </p>
        ) : null}

        {/* Due date chip + transient status */}
        <div className="flex items-center gap-2 flex-wrap pl-[26px]">
          {task.due_date && dueDateStatus ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums",
                dueDateStatus === "overdue" && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                dueDateStatus === "today" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                dueDateStatus === "soon" && "bg-amber-500/8 text-amber-500/80 dark:text-amber-400/70",
                dueDateStatus === "future" && "bg-muted text-muted-foreground",
              )}
            >
              {formatDueDate(task.due_date, dueDateStatus)}
            </span>
          ) : null}

          {/* aria-live region always in DOM so screen readers catch updates */}
          <p
            aria-live="polite"
            className={cn(
              "text-[10px]",
              status ? "animate-fade-scale" : "sr-only",
              status?.success ? "text-muted-foreground" : "text-destructive",
            )}
          >
            {status?.message ?? ""}
          </p>
        </div>
      </div>
    </article>
  );
}
