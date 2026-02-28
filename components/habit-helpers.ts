"use client";

import type { Id } from "@/convex/_generated/dataModel";

export type HabitsMode = "active" | "archived";

export type HabitWithStats = {
  _id: Id<"habits">;
  name: string;
  description?: string;
  start_date: string;
  frequency_type: "daily" | "weekly" | "monthly";
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

export const WEEKDAYS: Array<{ label: string; value: number }> = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 7 },
];

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
