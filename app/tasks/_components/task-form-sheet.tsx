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
        {/* Top accent stripe */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-primary" />

        <SheetHeader>
          <SheetTitle>{editingTaskId ? "Edit Task" : "Create Task"}</SheetTitle>
          <SheetDescription>
            Add task details and optional due date.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="task-title" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Title
            </label>
            <Input
              id="task-title"
              ref={titleInputRef}
              name="task-title"
              autoComplete="off"
              value={form.title}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="task-notes" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Notes (optional)
            </label>
            <Textarea
              id="task-notes"
              name="task-notes"
              autoComplete="off"
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="task-due-date" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
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

          {formError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}
          {isCreateMode ? (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
              <label htmlFor="task-create-more" className="text-sm text-muted-foreground cursor-pointer select-none">
                Create more
              </label>
              <Switch
                id="task-create-more"
                checked={createMore}
                onCheckedChange={(checked) => onCreateMoreChange(Boolean(checked))}
              />
            </div>
          ) : null}
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
