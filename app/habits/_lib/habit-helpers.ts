import type { Id } from "@/convex/_generated/dataModel";

export type HabitsMode = "active" | "archived";
export type FrequencyType = "daily" | "weekly" | "monthly";

export type CategoryOption = {
  _id: Id<"habitCategories">;
  display_name: string;
};

export type HabitWithStats = {
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

export type HabitStatusResult = {
  success: boolean;
  message: string;
};

export type HabitFormState = {
  name: string;
  description: string;
  startDate: string;
  frequencyType: FrequencyType;
  targetCount: string;
  selectedWeekdays: number[];
  categoryInput: string;
};

export type HabitFormValidationResult =
  | { ok: true; targetCount: number }
  | { ok: false; error: string };

export type HabitMutationPayload = {
  name: string;
  description?: string;
  startDate: string;
  frequencyType: FrequencyType;
  targetCount: number;
  selectedWeekdays?: number[];
  categoryId?: Id<"habitCategories">;
  categoryName?: string;
};

export const WEEKDAYS: Array<{ label: string; value: number }> = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

export function getTodayLocalDate(): string {
  return new Date().toLocaleDateString("en-CA");
}

export function defaultHabitFormState(): HabitFormState {
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

export function toHabitFormState(habit: HabitWithStats): HabitFormState {
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

export function toggleWeekdaySelection(
  selectedWeekdays: number[],
  weekday: number,
): number[] {
  const exists = selectedWeekdays.includes(weekday);
  if (exists) {
    return selectedWeekdays.filter((day) => day !== weekday);
  }
  return [...selectedWeekdays, weekday].sort((a, b) => a - b);
}

export function validateHabitForm(form: HabitFormState): HabitFormValidationResult {
  if (!form.name.trim()) {
    return { ok: false, error: "Habit name is required." };
  }

  const targetCount = Number(form.targetCount);
  if (!Number.isFinite(targetCount) || targetCount < 1) {
    return { ok: false, error: "Target count must be at least 1." };
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(form.startDate)) {
    return { ok: false, error: "Start date must be in YYYY-MM-DD format." };
  }

  return { ok: true, targetCount };
}

export function findMatchingCategory(
  categories: CategoryOption[],
  input: string,
): CategoryOption | undefined {
  const normalizedInput = input.trim().toLowerCase();
  if (!normalizedInput) return undefined;
  return categories.find(
    (category) =>
      category.display_name.trim().toLowerCase() === normalizedInput,
  );
}

export function buildHabitMutationPayload(
  form: HabitFormState,
  categories: CategoryOption[],
): HabitMutationPayload {
  const targetCount = Number(form.targetCount);
  const matchedCategory = findMatchingCategory(categories, form.categoryInput);
  const trimmedCategory = form.categoryInput.trim();

  return {
    name: form.name.trim(),
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
}

function getFrequencySortRank(habit: HabitWithStats): number {
  if (habit.frequency_type === "daily") {
    return habit.selected_weekdays && habit.selected_weekdays.length > 0 ? 1 : 0;
  }
  if (habit.frequency_type === "weekly") {
    return 2;
  }
  return 3;
}

export function sortHabits(habits: HabitWithStats[]): HabitWithStats[] {
  return habits.toSorted((a, b) => {
    const nameComparison = a.name.localeCompare(b.name, undefined, {
      sensitivity: "base",
    });
    if (nameComparison !== 0) return nameComparison;

    const frequencyComparison = getFrequencySortRank(a) - getFrequencySortRank(b);
    if (frequencyComparison !== 0) return frequencyComparison;

    return String(a._id).localeCompare(String(b._id));
  });
}

export function frequencySummary(habit: HabitWithStats): string {
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

export function progressLabel(habit: HabitWithStats): string {
  if (habit.frequency_type === "daily") {
    return `Today ${habit.currentPeriodProgress}/${habit.target_count}`;
  }
  if (habit.frequency_type === "weekly") {
    return `This week ${habit.currentPeriodProgress}/${habit.target_count}`;
  }
  return `This month ${habit.currentPeriodProgress}/${habit.target_count}`;
}

export function streakLabel(habit: HabitWithStats): string {
  if (habit.frequency_type === "daily") {
    return `${habit.streak} day streak`;
  }
  if (habit.frequency_type === "weekly") {
    return `${habit.streak} week streak`;
  }
  return `${habit.streak} month streak`;
}
