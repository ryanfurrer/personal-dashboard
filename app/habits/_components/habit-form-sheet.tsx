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
  onSubmit: () => void;
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
  onSubmit,
}: HabitFormSheetProps) {
  const isMobile = useIsMobile();
  const matchingCategory = findMatchingCategory(categories ?? [], form.categoryInput);
  const showCreateCategoryOption =
    form.categoryInput.trim().length > 0 && !matchingCategory;

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
          <SheetTitle>{editingHabitId ? "Edit Habit" : "Create Habit"}</SheetTitle>
          <SheetDescription>
            Configure the habit details and frequency.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="habit-name" className="text-sm font-medium">
              Name
            </label>
            <Input
              id="habit-name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="habit-description" className="text-sm font-medium">
              Description (optional)
            </label>
            <Textarea
              id="habit-description"
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="habit-start-date" className="text-sm font-medium">
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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="habit-frequency" className="text-sm font-medium">
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

          <div className="flex flex-col gap-1.5">
            <label htmlFor="habit-target-count" className="text-sm font-medium">
              {form.frequencyType === "daily"
                ? "Times per day"
                : form.frequencyType === "weekly"
                ? "Times per week"
                : "Times per month"}
            </label>
            <Input
              id="habit-target-count"
              type="number"
              min={1}
              step={1}
              value={form.targetCount}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, targetCount: event.target.value }))
              }
            />
          </div>

          {form.frequencyType === "daily" && (
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium">Selected Weekdays (optional)</p>
              <div className="flex flex-wrap gap-2">
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
          )}

          <div className="flex flex-col gap-1.5">
            <label htmlFor="habit-category" className="text-sm font-medium">
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

          {formError && <p className="text-sm text-destructive">{formError}</p>}
        </div>
        <SheetFooter className="border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit} disabled={submitting}>
            {submitting ? "Saving..." : editingHabitId ? "Save Changes" : "Create Habit"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
