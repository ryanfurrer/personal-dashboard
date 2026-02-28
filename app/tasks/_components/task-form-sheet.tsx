"use client";

import * as React from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useIsMobile } from "@/hooks/use-mobile";
import { TaskFormState } from "../_lib/task-helpers";

type TaskFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTaskId: Id<"tasks"> | null;
  form: TaskFormState;
  setForm: React.Dispatch<React.SetStateAction<TaskFormState>>;
  formError: string | null;
  submitting: boolean;
  onSubmit: () => void;
};

export function TaskFormSheet({
  open,
  onOpenChange,
  editingTaskId,
  form,
  setForm,
  formError,
  submitting,
  onSubmit,
}: TaskFormSheetProps) {
  const isMobile = useIsMobile();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "w-full max-h-[90dvh] rounded-t-xl"
            : "w-full sm:max-w-md"
        }
      >
        <SheetHeader>
          <SheetTitle>{editingTaskId ? "Edit Task" : "Create Task"}</SheetTitle>
          <SheetDescription>
            Add task details and optional due date.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-notes" className="text-sm font-medium">
              Notes (optional)
            </label>
            <Textarea
              id="task-notes"
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="task-due-date" className="text-sm font-medium">
              Due Date (optional)
            </label>
            <DatePicker
              id="task-due-date"
              value={form.dueDate}
              placeholder="Select due date"
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, dueDate: value }))
              }
            />
          </div>

          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </div>

        <SheetFooter className="border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Saving..." : editingTaskId ? "Save Changes" : "Create Task"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
