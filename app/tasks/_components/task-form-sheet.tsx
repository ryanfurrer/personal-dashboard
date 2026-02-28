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
import { Switch } from "@/components/ui/switch";
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
  createMore: boolean;
  onCreateMoreChange: (checked: boolean) => void;
  onSubmit: () => Promise<void> | void;
};

export function TaskFormSheet({
  open,
  onOpenChange,
  editingTaskId,
  form,
  setForm,
  formError,
  submitting,
  createMore,
  onCreateMoreChange,
  onSubmit,
}: TaskFormSheetProps) {
  const isMobile = useIsMobile();
  const isCreateMode = editingTaskId === null;
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  const submitWithMode = React.useCallback(async () => {
    await onSubmit();
  }, [onSubmit]);

  const handleKeyDown = React.useCallback(
    async (event: React.KeyboardEvent) => {
      const isSubmitShortcut =
        event.key === "Enter" && (event.metaKey || event.ctrlKey);
      if (!isSubmitShortcut || submitting) return;
      event.preventDefault();
      await submitWithMode();
      if (isCreateMode && createMore) {
        requestAnimationFrame(() => {
          titleInputRef.current?.focus();
        });
      }
    },
    [createMore, isCreateMode, submitWithMode, submitting],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "w-full max-h-[90dvh] rounded-t-xl"
            : "w-full sm:max-w-md"
        }
        onKeyDown={handleKeyDown}
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
              ref={titleInputRef}
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
          {isCreateMode && (
            <div className="flex items-center gap-2">
              <Switch
                id="task-create-more"
                checked={createMore}
                onCheckedChange={(checked) => onCreateMoreChange(Boolean(checked))}
              />
              <label htmlFor="task-create-more" className="text-sm text-muted-foreground">
                Create more
              </label>
            </div>
          )}
        </div>

        <SheetFooter className="border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submitWithMode()} disabled={submitting}>
            {submitting ? "Saving..." : editingTaskId ? "Save Changes" : "Create Task"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
