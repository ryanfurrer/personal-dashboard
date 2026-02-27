"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import SectionHeader from "./section-header";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "./ui/card";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./ui/combobox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "./ui/sheet";
import { DatePicker } from "./ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Textarea } from "./ui/textarea";
// @ts-expect-error - Direct import for performance
import Plus from "lucide-react/dist/esm/icons/plus";
// @ts-expect-error - Direct import for performance
import MoreHorizontal from "lucide-react/dist/esm/icons/more-horizontal";
// @ts-expect-error - Direct import for performance
import Archive from "lucide-react/dist/esm/icons/archive";
// @ts-expect-error - Direct import for performance
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
// @ts-expect-error - Direct import for performance
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
// @ts-expect-error - Direct import for performance
import Pencil from "lucide-react/dist/esm/icons/pencil";

type HabitsMode = "active" | "archived";
type FrequencyType = "daily" | "weekly" | "monthly";

type HabitWithStats = {
  _id: Id<"habits">;
  name: string;
  description?: string;
  start_date: string;
  frequency_type: FrequencyType;
  target_count: number;
  selected_weekdays?: number[];
  category: { _id: Id<"habitCategories">; name: string } | null;
  currentPeriodProgress: number;
  streak: number;
  isStarted: boolean;
  canCompleteToday: boolean;
  isCompletedForCurrentPeriod: boolean;
};

type Category = {
  _id: Id<"habitCategories">;
  display_name: string;
};

type HabitStatusResult = {
  success: boolean;
  message: string;
};

type HabitFormState = {
  name: string;
  description: string;
  startDate: string;
  frequencyType: FrequencyType;
  targetCount: string;
  selectedWeekdays: number[];
  categoryInput: string;
};

const WEEKDAYS: Array<{ label: string; value: number }> = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

function getTodayLocalDate(): string {
  return new Date().toLocaleDateString("en-CA");
}

function frequencySummary(habit: HabitWithStats): string {
  if (habit.frequency_type === "daily") {
    const weekdays =
      habit.selected_weekdays && habit.selected_weekdays.length > 0
        ? ` • ${habit.selected_weekdays
          .map((weekday) => WEEKDAYS.find((d) => d.value === weekday)?.label ?? "")
          .join(", ")}`
        : "";
    return `Daily • ${habit.target_count}/day${weekdays}`;
  }
  if (habit.frequency_type === "weekly") {
    return `Weekly • ${habit.target_count}/week`;
  }
  return `Monthly • ${habit.target_count}/month`;
}

function streakLabel(habit: HabitWithStats): string {
  if (habit.frequency_type === "daily") {
    return `${habit.streak} day streak`;
  }
  if (habit.frequency_type === "weekly") {
    return `${habit.streak} week streak`;
  }
  return `${habit.streak} month streak`;
}

function progressLabel(habit: HabitWithStats): string {
  if (habit.frequency_type === "daily") {
    return `Today ${habit.currentPeriodProgress}/${habit.target_count}`;
  }
  if (habit.frequency_type === "weekly") {
    return `This week ${habit.currentPeriodProgress}/${habit.target_count}`;
  }
  return `This month ${habit.currentPeriodProgress}/${habit.target_count}`;
}

function toFormState(habit: HabitWithStats): HabitFormState {
  return {
    name: habit.name,
    description: habit.description ?? "",
    startDate: habit.start_date,
    frequencyType: habit.frequency_type,
    targetCount: String(habit.target_count),
    selectedWeekdays: habit.selected_weekdays ?? [],
    categoryInput: habit.category?.name ?? "",
  };
}

function defaultFormState(): HabitFormState {
  return {
    name: "",
    description: "",
    startDate: getTodayLocalDate(),
    frequencyType: "daily",
    targetCount: "1",
    selectedWeekdays: [],
    categoryInput: "",
  };
}

export default function HabitsSection({ mode = "active" }: { mode?: HabitsMode }) {
  const localDate = getTodayLocalDate();
  const habits = useQuery(
    mode === "active" ? api.habits.listActiveHabitsWithStats : api.habits.listArchivedHabitsWithStats,
    { localDate },
  ) as HabitWithStats[] | undefined;
  const categories = useQuery(api.habits.listCategories, {}) as
    | Category[]
    | undefined;
  const createHabit = useMutation(api.habits.createHabit);
  const updateHabit = useMutation(api.habits.updateHabit);
  const completeHabit = useMutation(api.habits.completeHabit);
  const archiveHabit = useMutation(api.habits.archiveHabit);
  const restoreHabit = useMutation(api.habits.restoreHabit);
  const deleteHabit = useMutation(api.habits.deleteHabit);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<Id<"habits"> | null>(null);
  const [form, setForm] = useState<HabitFormState>(defaultFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [headerStatus, setHeaderStatus] = useState<HabitStatusResult | null>(null);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [pendingHabitActionId, setPendingHabitActionId] = useState<Id<"habits"> | null>(
    null,
  );
  const [habitStatuses, setHabitStatuses] = useState<Map<string, HabitStatusResult>>(
    new Map(),
  );
  const headerStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const habitStatusTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const habitStatusTimeouts = habitStatusTimeoutsRef.current;
    return () => {
      if (headerStatusTimeoutRef.current) {
        clearTimeout(headerStatusTimeoutRef.current);
      }
      habitStatusTimeouts.forEach((timeout) => clearTimeout(timeout));
      habitStatusTimeouts.clear();
    };
  }, []);

  const groupedHabits = useMemo(() => {
    const source = habits ?? [];
    const groups = new Map<string, HabitWithStats[]>();
    for (const habit of source) {
      const key = habit.category?.name ?? "Uncategorized";
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(habit);
    }
    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [habits]);

  const setTransientHeaderStatus = useCallback((status: HabitStatusResult | null) => {
    setHeaderStatus(status);
    if (headerStatusTimeoutRef.current) {
      clearTimeout(headerStatusTimeoutRef.current);
    }
    if (!status) return;
    headerStatusTimeoutRef.current = setTimeout(() => {
      setHeaderStatus(null);
      headerStatusTimeoutRef.current = null;
    }, 4000);
  }, []);

  const setTransientHabitStatus = useCallback((habitId: string, status: HabitStatusResult) => {
    setHabitStatuses((prev) => {
      const next = new Map(prev);
      next.set(habitId, status);
      return next;
    });
    const existing = habitStatusTimeoutsRef.current.get(habitId);
    if (existing) clearTimeout(existing);
    const timeout = setTimeout(() => {
      setHabitStatuses((prev) => {
        const next = new Map(prev);
        next.delete(habitId);
        return next;
      });
      habitStatusTimeoutsRef.current.delete(habitId);
    }, 4000);
    habitStatusTimeoutsRef.current.set(habitId, timeout);
  }, []);

  const openCreateSheet = useCallback(() => {
    setEditingHabitId(null);
    setForm(defaultFormState());
    setFormError(null);
    setSheetOpen(true);
  }, []);

  const openEditSheet = useCallback(
    (habit: HabitWithStats) => {
      setEditingHabitId(habit._id);
      setForm(toFormState(habit));
      setFormError(null);
      setSheetOpen(true);
    },
    [],
  );

  const toggleWeekday = useCallback((weekday: number) => {
    setForm((prev) => {
      const exists = prev.selectedWeekdays.includes(weekday);
      const nextWeekdays = exists
        ? prev.selectedWeekdays.filter((day) => day !== weekday)
        : [...prev.selectedWeekdays, weekday].sort((a, b) => a - b);
      return { ...prev, selectedWeekdays: nextWeekdays };
    });
  }, []);

  const handleSubmitForm = useCallback(async () => {
    setFormError(null);
    const name = form.name.trim();
    const targetCount = Number(form.targetCount);
    if (!name) {
      setFormError("Habit name is required.");
      return;
    }
    if (!Number.isFinite(targetCount) || targetCount < 1) {
      setFormError("Target count must be at least 1.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) {
      setFormError("Start date must be in YYYY-MM-DD format.");
      return;
    }

    const trimmedCategory = form.categoryInput.trim();
    const matchedCategory = categories?.find(
      (category) =>
        category.display_name.trim().toLowerCase() === trimmedCategory.toLowerCase(),
    );

    const payload = {
      name,
      description: form.description.trim() || undefined,
      startDate: form.startDate,
      frequencyType: form.frequencyType,
      targetCount,
      selectedWeekdays:
        form.frequencyType === "daily" ? form.selectedWeekdays : undefined,
      categoryId: matchedCategory?._id,
      categoryName:
        !matchedCategory && trimmedCategory.length > 0 ? trimmedCategory : undefined,
    };

    setSubmittingForm(true);
    try {
      if (editingHabitId) {
        await updateHabit({
          habitId: editingHabitId,
          ...payload,
        });
        setTransientHeaderStatus({
          success: true,
          message: "Habit updated",
        });
      } else {
        await createHabit(payload);
        setTransientHeaderStatus({
          success: true,
          message: "Habit created",
        });
      }
      setSheetOpen(false);
      setEditingHabitId(null);
      setForm(defaultFormState());
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmittingForm(false);
    }
  }, [
    categories,
    createHabit,
    editingHabitId,
    form,
    updateHabit,
    setTransientHeaderStatus,
  ]);

  const handleCompleteHabit = useCallback(
    async (habit: HabitWithStats) => {
      setPendingHabitActionId(habit._id);
      try {
        const result = await completeHabit({
          habitId: habit._id,
          localDate: getTodayLocalDate(),
          completedAt: Date.now(),
        });
        setTransientHabitStatus(habit._id, {
          success: true,
          message:
            result?.incremented === false
              ? "Target already met"
              : result?.isStreakEligible === false
                ? "Logged (not streak-eligible today)"
                : "Logged completion",
        });
      } catch (error) {
        setTransientHabitStatus(habit._id, {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setPendingHabitActionId(null);
      }
    },
    [completeHabit, setTransientHabitStatus],
  );

  const handleArchiveHabit = useCallback(
    async (habit: HabitWithStats) => {
      if (!window.confirm(`Archive "${habit.name}"?`)) return;
      setPendingHabitActionId(habit._id);
      try {
        await archiveHabit({ habitId: habit._id });
        setTransientHabitStatus(habit._id, {
          success: true,
          message: "Habit archived",
        });
      } catch (error) {
        setTransientHabitStatus(habit._id, {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setPendingHabitActionId(null);
      }
    },
    [archiveHabit, setTransientHabitStatus],
  );

  const handleRestoreHabit = useCallback(
    async (habit: HabitWithStats) => {
      setPendingHabitActionId(habit._id);
      try {
        await restoreHabit({ habitId: habit._id });
        setTransientHabitStatus(habit._id, {
          success: true,
          message: "Habit restored",
        });
      } catch (error) {
        setTransientHabitStatus(habit._id, {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setPendingHabitActionId(null);
      }
    },
    [restoreHabit, setTransientHabitStatus],
  );

  const handleDeleteHabit = useCallback(
    async (habit: HabitWithStats) => {
      if (!window.confirm(`Delete "${habit.name}"? It will no longer appear in the app.`)) {
        return;
      }
      setPendingHabitActionId(habit._id);
      try {
        await deleteHabit({ habitId: habit._id });
        setTransientHabitStatus(habit._id, {
          success: true,
          message: "Habit deleted",
        });
      } catch (error) {
        setTransientHabitStatus(habit._id, {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setPendingHabitActionId(null);
      }
    },
    [deleteHabit, setTransientHabitStatus],
  );

  const sectionTitle = mode === "active" ? "Habits" : "Archived Habits";
  const normalizedCategoryInput = form.categoryInput.trim().toLowerCase();
  const hasExactCategoryMatch = (categories ?? []).some(
    (category) => category.display_name.trim().toLowerCase() === normalizedCategoryInput,
  );
  const showCreateCategoryOption =
    form.categoryInput.trim().length > 0 && !hasExactCategoryMatch;

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title={sectionTitle}
        id={mode === "active" ? "habits" : "archived-habits"}
        action={
          <div className="flex items-center gap-2">
            {headerStatus && (
              <p
                className={`text-xs ${headerStatus.success ? "text-muted-foreground" : "text-destructive"}`}
              >
                {headerStatus.message}
              </p>
            )}
            {mode === "active" && (
              <Button onClick={openCreateSheet} size="sm" data-icon="inline-start">
                <Plus className="size-[1.2em]" />
                New Habit
              </Button>
            )}
          </div>
        }
      />

      {groupedHabits.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {mode === "active"
                ? "No habits yet. Create your first habit to start tracking."
                : "No archived habits."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {groupedHabits.map(([categoryName, categoryHabits]) => (
            <div key={categoryName} className="flex flex-col gap-3">
              <h3 className="text-sm font-medium text-muted-foreground">{categoryName}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {categoryHabits.map((habit) => {
                  const status = habitStatuses.get(habit._id);
                  const actionDisabled = pendingHabitActionId === habit._id;
                  const completeDisabled = actionDisabled || !habit.canCompleteToday;

                  return (
                    <Card key={habit._id} size="sm">
                      <CardHeader>
                        <CardTitle className="truncate">{habit.name}</CardTitle>
                        <CardAction>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button variant="ghost" size="icon-xs" aria-label="Habit actions" />
                              }
                            >
                              <MoreHorizontal className="size-3" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-40">
                              {mode === "active" && (
                                <DropdownMenuItem onClick={() => openEditSheet(habit)}>
                                  <Pencil className="size-4" />
                                  Edit
                                </DropdownMenuItem>
                              )}
                              {mode === "active" ? (
                                <DropdownMenuItem onClick={() => handleArchiveHabit(habit)}>
                                  <Archive className="size-4" />
                                  Archive
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleRestoreHabit(habit)}>
                                  <RotateCcw className="size-4" />
                                  Restore
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                variant="destructive"
                                onClick={() => handleDeleteHabit(habit)}
                              >
                                <Trash2 className="size-4" />
                                Delete
                              </DropdownMenuItem>
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
                            className={`text-xs ${status.success ? "text-muted-foreground" : "text-destructive"}`}
                          >
                            {status.message}
                          </p>
                        )}
                      </CardContent>

                      {mode === "active" && (
                        <CardFooter>
                          <Button
                            onClick={() => handleCompleteHabit(habit)}
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
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === "active" && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetContent side="right" className="w-full sm:max-w-md">
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
                          onClick={() => toggleWeekday(weekday.value)}
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
              <Button variant="outline" onClick={() => setSheetOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmitForm} disabled={submittingForm}>
                {submittingForm ? "Saving..." : editingHabitId ? "Save Changes" : "Create Habit"}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      )}
    </section>
  );
}
