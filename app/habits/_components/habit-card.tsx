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
import Archive from "lucide-react/dist/esm/icons/archive";
// @ts-expect-error - Direct import for performance
import Check from "lucide-react/dist/esm/icons/check";
// @ts-expect-error - Direct import for performance
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
// @ts-expect-error - Direct import for performance
import Pencil from "lucide-react/dist/esm/icons/pencil";
// @ts-expect-error - Direct import for performance
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
// @ts-expect-error - Direct import for performance
import Undo2 from "lucide-react/dist/esm/icons/undo-2";
// @ts-expect-error - Direct import for performance
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { cn } from "@/lib/utils";
import {
  HabitStatusResult,
  HabitWithStats,
  HabitsMode,
  frequencySummary,
  progressLabel,
  streakLabel,
} from "../_lib/habit-helpers";

type HabitCardProps = {
  habit: HabitWithStats;
  mode: HabitsMode;
  status?: HabitStatusResult;
  pendingActionId?: Id<"habits"> | null;
  onEdit?: (habit: HabitWithStats) => void;
  onComplete?: (habit: HabitWithStats) => void;
  onUncomplete?: (habit: HabitWithStats) => void;
  onArchive?: (habit: HabitWithStats) => void;
  onRestore?: (habit: HabitWithStats) => void;
  onDelete?: (habit: HabitWithStats) => void;
};

export function HabitCard({
  habit,
  mode,
  status,
  pendingActionId,
  onEdit,
  onComplete,
  onUncomplete,
  onArchive,
  onRestore,
  onDelete,
}: HabitCardProps) {
  const actionDisabled = pendingActionId === habit._id;
  const isDone = habit.isCompletedForCurrentPeriod;
  const completeDisabled = actionDisabled || (!isDone && !habit.canCompleteToday);
  const progressRatio = habit.target_count > 0
    ? Math.min(habit.currentPeriodProgress / habit.target_count, 1)
    : 0;

  const progressBarClass = isDone
    ? "bg-emerald-500"
    : progressRatio >= 0.5
    ? "bg-foreground/70"
    : "bg-muted-foreground/40";

  const topAccentClass = isDone
    ? "bg-emerald-500"
    : progressRatio > 0
    ? "bg-primary/50"
    : "bg-border";

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 shadow-xs transition-[box-shadow] duration-150 ease hover:shadow-sm">
      {/* Top accent line — tracks completion state */}
      <div
        className={cn(
          "absolute inset-x-0 top-0 h-px transition-[background-color] duration-300 ease-out motion-reduce:transition-none",
          topAccentClass,
        )}
      />

      <div className="flex flex-1 flex-col gap-3 p-4 pt-[18px]">
        {/* Header: name + menu */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold leading-snug text-foreground">
              {habit.name}
            </h3>
            <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
              {habit.category?.name ? `${habit.category.name} · ` : ""}
              {frequencySummary(habit)}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Habit actions"
                  disabled={actionDisabled}
                  className="shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100 transition-opacity duration-150 ease motion-reduce:transition-none"
                />
              }
            >
              <MoreHorizontal className="size-3" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {mode === "active" && onEdit ? (
                <DropdownMenuItem onClick={() => onEdit(habit)}>
                  <Pencil className="size-4" aria-hidden="true" />
                  Edit
                </DropdownMenuItem>
              ) : null}
              {mode === "active" && onArchive ? (
                <DropdownMenuItem onClick={() => onArchive(habit)}>
                  <Archive className="size-4" aria-hidden="true" />
                  Archive
                </DropdownMenuItem>
              ) : null}
              {mode === "archived" && onRestore ? (
                <DropdownMenuItem onClick={() => onRestore(habit)}>
                  <RotateCcw className="size-4" aria-hidden="true" />
                  Restore
                </DropdownMenuItem>
              ) : null}
              {onDelete ? (
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(habit)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Delete
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {habit.description ? (
          <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {habit.description}
          </p>
        ) : null}

        {/* Progress block */}
        <div className="flex flex-col gap-2">
          {/* Count */}
          <div className="flex items-baseline gap-1">
            <span
              className={cn(
                "font-mono tabular-nums text-2xl font-bold leading-none transition-[color] duration-300 ease-out motion-reduce:transition-none",
                isDone ? "text-emerald-600 dark:text-emerald-400" : "text-foreground",
              )}
            >
              {habit.currentPeriodProgress}
            </span>
            <span className="text-sm text-muted-foreground">/{habit.target_count}</span>
          </div>

          {/* Progress bar — scaleX is GPU-composited, no layout thrash */}
          <div
            className="relative h-1.5 w-full overflow-hidden rounded-full bg-border"
            role="progressbar"
            aria-valuenow={habit.currentPeriodProgress}
            aria-valuemin={0}
            aria-valuemax={habit.target_count}
            aria-label={`${habit.currentPeriodProgress} of ${habit.target_count} completed`}
          >
            <div
              className={cn(
                "absolute inset-0 h-full origin-left rounded-full transition-transform duration-500 ease-out motion-reduce:transition-none",
                progressBarClass,
              )}
              style={{ transform: `scaleX(${progressRatio})` }}
            />
          </div>

          {/* Status chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                isDone
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {progressLabel(habit)}
            </span>
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
              {streakLabel(habit)}
            </span>
            {!habit.isStarted ? (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                Starts {habit.start_date}
              </span>
            ) : null}
          </div>
        </div>

        {/* Transient status — aria-live region always in DOM */}
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

        {/* Complete button (active mode only) */}
        {mode === "active" ? (
          <Button
            onClick={() => isDone ? onUncomplete?.(habit) : onComplete?.(habit)}
            disabled={completeDisabled}
            size="sm"
            variant={isDone ? "outline" : "default"}
            className={cn(
              "mt-auto w-full gap-1.5",
              "active:scale-[0.97] transition-transform duration-100 ease-out motion-reduce:transition-none",
            )}
          >
            {isDone ? (
              <>
                <Undo2 className="size-[1.1em]" aria-hidden="true" />
                Undo
              </>
            ) : !habit.isStarted ? (
              "Not Started Yet"
            ) : (
              "Complete"
            )}
          </Button>
        ) : null}
      </div>
    </article>
  );
}
