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
import Check from "lucide-react/dist/esm/icons/check";
// @ts-expect-error - Direct import for performance
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
// @ts-expect-error - Direct import for performance
import Pencil from "lucide-react/dist/esm/icons/pencil";
// @ts-expect-error - Direct import for performance
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
// @ts-expect-error - Direct import for performance
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import { cn } from "@/lib/utils";
import { TaskItem, TaskStatusResult } from "../_lib/task-helpers";

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

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle
          className={cn(
            "truncate",
            task.is_completed && "text-muted-foreground line-through",
          )}
        >
          {task.title}
        </CardTitle>
        <CardAction>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  variant="ghost"
                  size="icon-xs"
                  aria-label="Task actions"
                  disabled={actionDisabled}
                />
              }
            >
              <MoreHorizontal className="size-3" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              {onEdit && (
                <DropdownMenuItem onClick={() => onEdit(task)}>
                  <Pencil className="size-4" />
                  Edit
                </DropdownMenuItem>
              )}
              {onDelete && (
                <DropdownMenuItem variant="destructive" onClick={() => onDelete(task)}>
                  <Trash2 className="size-4" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        {task.notes && (
          <p className="line-clamp-2 text-sm text-muted-foreground">{task.notes}</p>
        )}
        <div className="flex items-center gap-2">
          <Badge variant={task.is_completed ? "secondary" : "outline"}>
            {task.is_completed ? "Completed" : "Open"}
          </Badge>
          {task.due_date && <Badge variant="outline">Due {task.due_date}</Badge>}
        </div>
        {status && (
          <p
            className={cn(
              "text-xs",
              status.success ? "text-muted-foreground" : "text-destructive",
            )}
          >
            {status.message}
          </p>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={() => onToggleComplete?.(task)}
          disabled={actionDisabled}
          size="sm"
          variant={task.is_completed ? "outline" : "default"}
          data-icon="inline-start"
        >
          {task.is_completed ? (
            <>
              <RotateCcw className="size-[1.2em]" />
              Undo
            </>
          ) : (
            <>
              <Check className="size-[1.2em]" />
              Complete
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}
