"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
// @ts-expect-error - Direct import for performance
import Archive from "lucide-react/dist/esm/icons/archive";
// @ts-expect-error - Direct import for performance
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
// @ts-expect-error - Direct import for performance
import Pencil from "lucide-react/dist/esm/icons/pencil";
// @ts-expect-error - Direct import for performance
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
// @ts-expect-error - Direct import for performance
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
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
  onArchive,
  onRestore,
  onDelete,
}: HabitCardProps) {
  const actionDisabled = pendingActionId === habit._id;
  const completeDisabled = actionDisabled || !habit.canCompleteToday;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="truncate">{habit.name}</CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Habit actions"
                  disabled={actionDisabled}
                />
              }
            >
              <MoreHorizontal className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {mode === "active" && onEdit && (
                <DropdownMenuItem onClick={() => onEdit(habit)}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {mode === "active" && onArchive && (
                <DropdownMenuItem onClick={() => onArchive(habit)}>
                  <Archive className="size-4" />
                  Archive
                </DropdownMenuItem>
              )}
              {mode === "archived" && onRestore && (
                <DropdownMenuItem onClick={() => onRestore(habit)}>
                  <RotateCcw className="size-4" />
                  Restore
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(habit)}>
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {habit.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {habit.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground">{frequencySummary(habit)}</p>
        <p className="font-mono text-xl tabular-nums">
          {habit.currentPeriodProgress}/{habit.target_count}
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{progressLabel(habit)}</Badge>
          <Badge variant="outline">{streakLabel(habit)}</Badge>
        </div>
        {!habit.isStarted && (
          <Badge variant="secondary">Starts on {habit.start_date}</Badge>
        )}
        {status && (
          <p
            className={`text-xs ${
              status.success ? "text-muted-foreground" : "text-destructive"
            }`}
          >
            {status.message}
          </p>
        )}
      </CardContent>

      {mode === "active" && (
        <CardFooter>
          <Button
            onClick={() => onComplete?.(habit)}
            disabled={completeDisabled}
            size="sm"
          >
            {!habit.isStarted
              ? "Not Started"
              : habit.isCompletedForCurrentPeriod
              ? "Completed"
              : "Complete"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
