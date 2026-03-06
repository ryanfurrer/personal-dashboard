"use client";

import * as React from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import { DatePicker } from "@/components/ui/date-picker";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  CategoryOption,
  FrequencyType,
  HabitFormState,
  findMatchingCategory,
  toggleWeekdaySelection,
  WEEKDAYS,
} from "../_lib/habit-helpers";
import { useIsMobile } from "@/hooks/use-mobile";

type HabitFormSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingHabitId: Id<"habits"> | null;
  form: HabitFormState;
  setForm: React.Dispatch<React.SetStateAction<HabitFormState>>;
  formError: string | null;
  categories: CategoryOption[] | undefined;
  submitting: boolean;
  createMore: boolean;
  onCreateMoreChange: (checked: boolean) => void;
  onSubmit: () => Promise<void> | void;
};

export function HabitFormSheet({
  open,
  onOpenChange,
  editingHabitId,
  form,
  setForm,
  formError,
  categories,
  submitting,
  createMore,
  onCreateMoreChange,
  onSubmit,
}: HabitFormSheetProps) {
  const isMobile = useIsMobile();
  const isCreateMode = editingHabitId === null;
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const matchingCategory = findMatchingCategory(categories ?? [], form.categoryInput);
  const showCreateCategoryOption =
    form.categoryInput.trim().length > 0 && !matchingCategory;

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
        <div className="absolute inset-x-0 top-0 h-[2px] bg-emerald-500" />

        <SheetHeader>
          <SheetTitle>{editingHabitId ? "Edit Habit" : "Create Habit"}</SheetTitle>
          <SheetDescription>
            Configure the habit details and frequency.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="habit-name" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Name
            </label>
            <Input
              id="habit-name"
              ref={titleInputRef}
              name="habit-name"
              autoComplete="off"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="habit-description" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Description (optional)
            </label>
            <Textarea
              id="habit-description"
              name="habit-description"
              autoComplete="off"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="habit-start-date" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Start Date
            </label>
            <DatePicker
              id="habit-start-date"
              value={form.startDate}
              onValueChange={(value) =>
                setForm((prev) => ({ ...prev, startDate: value }))
              }
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="habit-frequency" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Frequency
            </label>
            <Select
              value={form.frequencyType}
              onValueChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  frequencyType: value as FrequencyType,
                }))
              }
            >
              <SelectTrigger id="habit-frequency" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="habit-target-count" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {form.frequencyType === "daily"
                ? "Times per day"
                : form.frequencyType === "weekly"
                  ? "Times per week"
                  : "Times per month"}
            </label>
            <Input
              id="habit-target-count"
              name="habit-target-count"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              autoComplete="off"
              value={form.targetCount}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, targetCount: event.target.value }))
              }
            />
          </div>

          {form.frequencyType === "daily" ? (
            <div className="flex flex-col gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                Weekdays (optional)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((weekday) => {
                  const isSelected = form.selectedWeekdays.includes(weekday.value);
                  return (
                    <Button
                      key={weekday.value}
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          selectedWeekdays: toggleWeekdaySelection(
                            prev.selectedWeekdays,
                            weekday.value,
                          ),
                        }))
                      }
                    >
                      {weekday.label}
                    </Button>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to apply to all days.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2">
            <label htmlFor="habit-category" className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Category (optional)
            </label>
            <Combobox
              value={form.categoryInput || null}
              onInputValueChange={(value) => {
                setForm((prev) => ({ ...prev, categoryInput: value }));
              }}
              onValueChange={(value) => {
                if (!value) return;
                setForm((prev) => ({ ...prev, categoryInput: String(value) }));
              }}
            >
              <ComboboxInput
                id="habit-category"
                className="w-full"
                placeholder="Type to select or create"
                showClear
              />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxEmpty>No matching categories</ComboboxEmpty>
                  {showCreateCategoryOption && (
                    <ComboboxItem value={form.categoryInput.trim()}>
                      Create category: {form.categoryInput.trim()}
                    </ComboboxItem>
                  )}
                  {(categories ?? []).map((category) => (
                    <ComboboxItem key={category._id} value={category.display_name}>
                      {category.display_name}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>

          {formError ? (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </p>
          ) : null}
          {isCreateMode ? (
            <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/50 px-3 py-2.5">
              <label htmlFor="habit-create-more" className="text-sm text-muted-foreground cursor-pointer select-none">
                Create more
              </label>
              <Switch
                id="habit-create-more"
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
            {submitting ? "Saving..." : editingHabitId ? "Save Changes" : "Create Habit"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
