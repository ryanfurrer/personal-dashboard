"use client";

import { memo, useState } from "react";
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
  if (status === "today") return "Today";
  if (status === "overdue") return `Overdue`;
  if (status === "soon") return formatted;
  return formatted;
}

type TaskCardProps = {
  task: TaskItem;
  status?: TaskStatusResult;
  pendingActionId?: Id<"tasks"> | null;
  onToggleComplete?: (task: TaskItem) => void;
  onEdit?: (task: TaskItem) => void;
  onDelete?: (task: TaskItem) => void;
};

export const TaskCard = memo(function TaskCard({
  task,
  status,
  pendingActionId,
  onToggleComplete,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const [notesExpanded, setNotesExpanded] = useState(false);
  const actionDisabled = pendingActionId === task._id;
  const dueDateStatus = task.due_date ? getDueDateStatus(task.due_date) : null;
  const isOverdue = dueDateStatus === "overdue" && !task.is_completed;

  const accentClass = task.is_completed
    ? "bg-emerald-500/60"
    : dueDateStatus === "overdue"
    ? "bg-rose-500"
    : dueDateStatus === "today" || dueDateStatus === "soon"
    ? "bg-amber-500"
    : "bg-foreground/10";

  return (
    <article className={cn(
      "group hover-glow relative overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 shadow-xs",
      "transition-opacity duration-300 ease-out motion-reduce:transition-none",
      isOverdue && "bg-rose-500/[0.03] dark:bg-rose-500/[0.05]",
      task.is_completed && "opacity-60 hover:opacity-100",
    )}>
      {/* Left urgency accent */}
      <div
        className={cn(
          "absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full transition-[background-color] duration-200 ease-out motion-reduce:transition-none",
          accentClass,
        )}
      />

      <div className="flex flex-col gap-1 px-4 py-3">
        {/* Main row: checkbox + title + chip + menu */}
        <div className="flex items-center gap-2.5">
          {/* Toggle checkbox */}
          <button
            onClick={() => onToggleComplete?.(task)}
            disabled={actionDisabled}
            aria-label={task.is_completed ? "Mark as incomplete" : "Mark as complete"}
            className={cn(
              "shrink-0 size-[18px] rounded-full border-2 flex items-center justify-center",
              "touch-manipulation select-none",
              "transition-[background-color,border-color,transform] duration-150 ease motion-reduce:transition-none",
              "active:scale-[0.88] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
              "disabled:pointer-events-none disabled:opacity-40",
              task.is_completed
                ? "bg-emerald-500 border-emerald-500"
                : "border-foreground/25 bg-transparent hover:border-primary/60",
            )}
          >
            {task.is_completed ? (
              <Check className="size-2.5 text-white" aria-hidden="true" />
            ) : null}
          </button>

          {/* Title */}
          <span
            title={task.title}
            className={cn(
              "flex-1 min-w-0 truncate font-display text-sm font-bold leading-snug",
              "transition-[color,opacity,text-decoration-color] duration-200 ease-out motion-reduce:transition-none",
              task.is_completed
                ? "text-muted-foreground/50 line-through decoration-muted-foreground/30"
                : "text-foreground",
            )}
          >
            {task.title}
          </span>

          {/* Inline status chip */}
          {task.is_completed ? (
            <span className="shrink-0 inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 tabular-nums">
              Done · {new Date(task.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
            </span>
          ) : task.due_date && dueDateStatus ? (
            <span
              className={cn(
                "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium tabular-nums",
                dueDateStatus === "overdue" && "bg-rose-500/10 text-rose-600 dark:text-rose-400",
                dueDateStatus === "today" && "bg-amber-500/10 text-amber-600 dark:text-amber-400",
                dueDateStatus === "soon" && "bg-amber-500/8 text-amber-500/80 dark:text-amber-400/70",
                dueDateStatus === "future" && "bg-muted text-muted-foreground",
              )}
            >
              {formatDueDate(task.due_date, dueDateStatus)}
            </span>
          ) : null}

          {/* Actions menu */}
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

        {/* Notes — secondary line, click to expand */}
        {task.notes ? (
          <p
            onClick={() => setNotesExpanded((v) => !v)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && setNotesExpanded((v) => !v)}
            aria-expanded={notesExpanded}
            className={cn(
              "cursor-pointer pl-[26px] text-xs leading-relaxed text-muted-foreground/70",
              "transition-colors duration-150 hover:text-muted-foreground",
              "focus-visible:outline-none focus-visible:underline",
              notesExpanded ? "whitespace-pre-wrap" : "truncate",
            )}
          >
            {task.notes}
          </p>
        ) : null}

        {/* aria-live status region always in DOM */}
        <p
          aria-live="polite"
          className={cn(
            "pl-[26px] text-[10px]",
            status ? "animate-fade-scale" : "sr-only",
            status?.success ? "text-muted-foreground" : "text-destructive",
          )}
        >
          {status?.message ?? ""}
        </p>
      </div>
    </article>
  );
});
