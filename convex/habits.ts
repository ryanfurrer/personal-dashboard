import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";

type FrequencyType = "daily" | "weekly" | "monthly";
type HabitStatus = "active" | "archived" | "deleted";

function assertValidLocalDate(localDate: string): void {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) {
    throw new Error("Date must use YYYY-MM-DD format");
  }
}

function parseLocalDate(localDate: string): Date {
  assertValidLocalDate(localDate);
  const [year, month, day] = localDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

function formatLocalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function compareLocalDates(a: string, b: string): number {
  return a.localeCompare(b);
}

function addDays(localDate: string, days: number): string {
  const date = parseLocalDate(localDate);
  date.setUTCDate(date.getUTCDate() + days);
  return formatLocalDate(date);
}

function toMondayBasedWeekday(localDate: string): number {
  const day = parseLocalDate(localDate).getUTCDay(); // 0=Sun
  return day === 0 ? 7 : day; // 1=Mon ... 7=Sun
}

function getIsoWeekParts(localDate: string): { year: number; week: number } {
  const date = parseLocalDate(localDate);
  const weekday = toMondayBasedWeekday(localDate); // Mon=1..Sun=7
  const thursday = new Date(date);
  thursday.setUTCDate(date.getUTCDate() + (4 - weekday));
  const year = thursday.getUTCFullYear();
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Weekday = jan4.getUTCDay() === 0 ? 7 : jan4.getUTCDay();
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Weekday - 1));
  const diffDays = Math.floor(
    (thursday.getTime() - week1Monday.getTime()) / (1000 * 60 * 60 * 24),
  );
  const week = Math.floor(diffDays / 7) + 1;
  return { year, week };
}

function getMondayDateFromIsoWeek(year: number, week: number): string {
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const jan4Weekday = jan4.getUTCDay() === 0 ? 7 : jan4.getUTCDay();
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - (jan4Weekday - 1));
  week1Monday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  return formatLocalDate(week1Monday);
}

function getPeriodKeyForDate(localDate: string, frequency: FrequencyType): string {
  if (frequency === "daily") return `D:${localDate}`;
  if (frequency === "monthly") return `M:${localDate.slice(0, 7)}`;
  const { year, week } = getIsoWeekParts(localDate);
  return `W:${year}-W${String(week).padStart(2, "0")}`;
}

function getPreviousPeriodKey(periodKey: string): string {
  const [prefix, value] = periodKey.split(":");
  if (prefix === "D") {
    return `D:${addDays(value, -1)}`;
  }
  if (prefix === "M") {
    const [year, month] = value.split("-").map(Number);
    if (month === 1) return `M:${year - 1}-12`;
    return `M:${year}-${String(month - 1).padStart(2, "0")}`;
  }
  const [yearPart, weekPart] = value.split("-W");
  const year = Number(yearPart);
  const week = Number(weekPart);
  if (week > 1) {
    return `W:${year}-W${String(week - 1).padStart(2, "0")}`;
  }
  const previousYear = year - 1;
  const lastWeek = getIsoWeekParts(`${previousYear}-12-28`).week;
  return `W:${previousYear}-W${String(lastWeek).padStart(2, "0")}`;
}

function getPeriodEndDate(periodKey: string): string {
  const [prefix, value] = periodKey.split(":");
  if (prefix === "D") return value;
  if (prefix === "M") {
    const [year, month] = value.split("-").map(Number);
    const firstOfNextMonth = new Date(Date.UTC(year, month, 1));
    firstOfNextMonth.setUTCDate(firstOfNextMonth.getUTCDate() - 1);
    return formatLocalDate(firstOfNextMonth);
  }
  const [yearPart, weekPart] = value.split("-W");
  const monday = getMondayDateFromIsoWeek(Number(yearPart), Number(weekPart));
  return addDays(monday, 6);
}

function isCurrentPeriodOpen(periodKey: string, todayLocalDate: string): boolean {
  return compareLocalDates(getPeriodEndDate(periodKey), todayLocalDate) >= 0;
}

function normalizeCategoryName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function validateTargetCount(value: number): void {
  if (!Number.isFinite(value) || value < 1) {
    throw new Error("Target count must be at least 1");
  }
}

function validateSelectedWeekdays(
  frequency: FrequencyType,
  selectedWeekdays?: number[],
): number[] | undefined {
  if (frequency !== "daily" && selectedWeekdays && selectedWeekdays.length > 0) {
    throw new Error("Selected weekdays are only allowed for daily habits");
  }
  if (!selectedWeekdays || selectedWeekdays.length === 0) {
    return undefined;
  }
  const unique = [...new Set(selectedWeekdays)];
  const invalid = unique.some((day) => !Number.isInteger(day) || day < 1 || day > 7);
  if (invalid) {
    throw new Error("Selected weekdays must be integers from 1 (Mon) to 7 (Sun)");
  }
  return unique.sort((a, b) => a - b);
}

function isRequiredDay(habit: Doc<"habits">, localDate: string): boolean {
  if (habit.frequency_type !== "daily") return true;
  if (!habit.selected_weekdays || habit.selected_weekdays.length === 0) return true;
  const weekday = toMondayBasedWeekday(localDate);
  return habit.selected_weekdays.includes(weekday);
}

function getCurrentProgress(
  habit: Doc<"habits">,
  localDate: string,
  completions: Doc<"habitCompletions">[],
): number {
  if (habit.frequency_type === "daily") {
    return completions
      .filter((completion) => completion.local_date === localDate)
      .reduce((sum, completion) => sum + completion.count, 0);
  }
  const currentPeriodKey = getPeriodKeyForDate(localDate, habit.frequency_type);
  return completions
    .filter((completion) => completion.period_key === currentPeriodKey)
    .reduce((sum, completion) => sum + completion.count, 0);
}

function computeDailyStreak(
  habit: Doc<"habits">,
  localDate: string,
  eligibleDailyCounts: Map<string, number>,
): number {
  if (compareLocalDates(localDate, habit.start_date) < 0) return 0;
  let cursor = localDate;
  const todayCount = eligibleDailyCounts.get(localDate) ?? 0;
  if (isRequiredDay(habit, localDate) && todayCount < habit.target_count) {
    cursor = addDays(localDate, -1);
  }

  let streak = 0;
  while (compareLocalDates(cursor, habit.start_date) >= 0) {
    if (!isRequiredDay(habit, cursor)) {
      cursor = addDays(cursor, -1);
      continue;
    }
    const count = eligibleDailyCounts.get(cursor) ?? 0;
    if (count < habit.target_count) break;
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

function computePeriodStreak(
  habit: Doc<"habits">,
  localDate: string,
  periodCounts: Map<string, number>,
): number {
  const currentPeriodKey = getPeriodKeyForDate(localDate, habit.frequency_type);
  const isCurrentComplete =
    (periodCounts.get(currentPeriodKey) ?? 0) >= habit.target_count;

  if (!isCurrentComplete && !isCurrentPeriodOpen(currentPeriodKey, localDate)) {
    return 0;
  }

  let cursor = isCurrentComplete
    ? currentPeriodKey
    : getPreviousPeriodKey(currentPeriodKey);

  let streak = 0;
  while (true) {
    const periodEnd = getPeriodEndDate(cursor);
    if (compareLocalDates(periodEnd, habit.start_date) < 0) break;

    const count = periodCounts.get(cursor) ?? 0;
    if (count < habit.target_count) break;
    streak += 1;
    cursor = getPreviousPeriodKey(cursor);
  }
  return streak;
}

async function resolveCategoryId(
  ctx: MutationCtx,
  categoryId?: Id<"habitCategories">,
  categoryName?: string,
): Promise<Id<"habitCategories"> | undefined> {
  if (categoryId) {
    const category = await ctx.db.get(categoryId);
    if (!category) throw new Error("Category not found");
    return categoryId;
  }
  if (!categoryName || categoryName.trim().length === 0) {
    return undefined;
  }
  const normalized = normalizeCategoryName(categoryName);
  const existing = await ctx.db
    .query("habitCategories")
    .withIndex("by_name", (q) => q.eq("name", normalized))
    .first();
  if (existing) return existing._id;
  const now = Date.now();
  return await ctx.db.insert("habitCategories", {
    name: normalized,
    display_name: categoryName.trim(),
    created_at: now,
    updated_at: now,
  });
}

async function listHabitsWithStats(
  ctx: QueryCtx,
  status: HabitStatus,
  localDate: string,
) {
  const habits = (await ctx.db
    .query("habits")
    .withIndex("by_status", (q) => q.eq("status", status))
    .collect()) as Doc<"habits">[];

  const habitsWithStats = await Promise.all(
    habits.map(async (habit) => {
      const category = habit.category_id ? await ctx.db.get(habit.category_id) : null;
      const completions = (await ctx.db
        .query("habitCompletions")
        .withIndex("by_habit", (q) => q.eq("habit_id", habit._id))
        .collect()) as Doc<"habitCompletions">[];

      const currentProgress = getCurrentProgress(habit, localDate, completions);
      const eligibleDailyCounts = new Map<string, number>();
      const eligiblePeriodCounts = new Map<string, number>();
      for (const completion of completions) {
        if (!completion.is_streak_eligible) continue;
        eligibleDailyCounts.set(
          completion.local_date,
          (eligibleDailyCounts.get(completion.local_date) ?? 0) + completion.count,
        );
        eligiblePeriodCounts.set(
          completion.period_key,
          (eligiblePeriodCounts.get(completion.period_key) ?? 0) + completion.count,
        );
      }

      const streak =
        habit.frequency_type === "daily"
          ? computeDailyStreak(habit, localDate, eligibleDailyCounts)
          : computePeriodStreak(habit, localDate, eligiblePeriodCounts);

      const isStarted = compareLocalDates(localDate, habit.start_date) >= 0;
      const isCompletedForCurrentPeriod = currentProgress >= habit.target_count;
      const canCompleteToday = isStarted && status === "active" && !isCompletedForCurrentPeriod;

      return {
        ...habit,
        category: category
          ? { _id: category._id, name: category.display_name }
          : null,
        currentPeriodProgress: currentProgress,
        streak,
        isStarted,
        canCompleteToday,
        isCompletedForCurrentPeriod,
      };
    }),
  );

  habitsWithStats.sort((a, b) => a.name.localeCompare(b.name));
  return habitsWithStats;
}

export const listCategories = query({
  args: {},
  handler: async (ctx) => {
    const categories = (await ctx.db.query("habitCategories").collect()) as Doc<"habitCategories">[];
    return categories.sort((a, b) => a.display_name.localeCompare(b.display_name));
  },
});

export const listActiveHabitsWithStats = query({
  args: {
    localDate: v.string(),
  },
  handler: async (ctx, args) => {
    assertValidLocalDate(args.localDate);
    return await listHabitsWithStats(ctx, "active", args.localDate);
  },
});

export const listArchivedHabitsWithStats = query({
  args: {
    localDate: v.string(),
  },
  handler: async (ctx, args) => {
    assertValidLocalDate(args.localDate);
    return await listHabitsWithStats(ctx, "archived", args.localDate);
  },
});

export const getArchivedHabitsCount = query({
  args: {},
  handler: async (ctx) => {
    const archivedHabits = await ctx.db
      .query("habits")
      .withIndex("by_status", (q) => q.eq("status", "archived"))
      .collect();
    return archivedHabits.length;
  },
});

export const getHabitById = query({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.status === "deleted") {
      return null;
    }
    return habit;
  },
});

export const createHabit = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    frequencyType: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
    ),
    targetCount: v.float64(),
    selectedWeekdays: v.optional(v.array(v.float64())),
    categoryId: v.optional(v.id("habitCategories")),
    categoryName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const name = args.name.trim();
    if (!name) throw new Error("Habit name is required");
    assertValidLocalDate(args.startDate);
    validateTargetCount(args.targetCount);
    const selectedWeekdays = validateSelectedWeekdays(
      args.frequencyType,
      args.selectedWeekdays as number[] | undefined,
    );
    const categoryId = await resolveCategoryId(
      ctx,
      args.categoryId,
      args.categoryName,
    );
    const now = Date.now();
    return await ctx.db.insert("habits", {
      name,
      description: args.description?.trim() || undefined,
      start_date: args.startDate,
      frequency_type: args.frequencyType,
      target_count: args.targetCount,
      selected_weekdays: selectedWeekdays,
      category_id: categoryId,
      status: "active",
      created_at: now,
      updated_at: now,
    });
  },
});

export const updateHabit = mutation({
  args: {
    habitId: v.id("habits"),
    name: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    frequencyType: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
    ),
    targetCount: v.float64(),
    selectedWeekdays: v.optional(v.array(v.float64())),
    categoryId: v.optional(v.id("habitCategories")),
    categoryName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.habitId);
    if (!existing || existing.status === "deleted") {
      throw new Error("Habit not found");
    }
    const name = args.name.trim();
    if (!name) throw new Error("Habit name is required");
    assertValidLocalDate(args.startDate);
    validateTargetCount(args.targetCount);
    const selectedWeekdays = validateSelectedWeekdays(
      args.frequencyType,
      args.selectedWeekdays as number[] | undefined,
    );
    const categoryId = await resolveCategoryId(
      ctx,
      args.categoryId,
      args.categoryName,
    );
    await ctx.db.patch(args.habitId, {
      name,
      description: args.description?.trim() || undefined,
      start_date: args.startDate,
      frequency_type: args.frequencyType,
      target_count: args.targetCount,
      selected_weekdays: selectedWeekdays,
      category_id: categoryId,
      updated_at: Date.now(),
    });
  },
});

export const archiveHabit = mutation({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.status === "deleted") throw new Error("Habit not found");
    await ctx.db.patch(args.habitId, {
      status: "archived",
      archived_at: Date.now(),
      updated_at: Date.now(),
    });
  },
});

export const restoreHabit = mutation({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.status !== "archived") throw new Error("Archived habit not found");
    await ctx.db.patch(args.habitId, {
      status: "active",
      archived_at: undefined,
      updated_at: Date.now(),
    });
  },
});

export const deleteHabit = mutation({
  args: {
    habitId: v.id("habits"),
  },
  handler: async (ctx, args) => {
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.status === "deleted") throw new Error("Habit not found");
    await ctx.db.patch(args.habitId, {
      status: "deleted",
      deleted_at: Date.now(),
      updated_at: Date.now(),
    });
  },
});

export const completeHabit = mutation({
  args: {
    habitId: v.id("habits"),
    localDate: v.string(),
    completedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    assertValidLocalDate(args.localDate);
    const habit = await ctx.db.get(args.habitId);
    if (!habit || habit.status !== "active") {
      throw new Error("Active habit not found");
    }
    if (compareLocalDates(args.localDate, habit.start_date) < 0) {
      throw new Error("Habit has not started yet");
    }

    const periodKey = getPeriodKeyForDate(args.localDate, habit.frequency_type);
    const completions = (await ctx.db
      .query("habitCompletions")
      .withIndex("by_habit", (q) => q.eq("habit_id", args.habitId))
      .collect()) as Doc<"habitCompletions">[];

    const currentPeriodCount =
      habit.frequency_type === "daily"
        ? completions
            .filter((completion) => completion.local_date === args.localDate)
            .reduce((sum, completion) => sum + completion.count, 0)
        : completions
            .filter((completion) => completion.period_key === periodKey)
            .reduce((sum, completion) => sum + completion.count, 0);

    if (currentPeriodCount >= habit.target_count) {
      return {
        incremented: false,
        currentPeriodCount,
        targetCount: habit.target_count,
      };
    }

    const isStreakEligible =
      habit.frequency_type !== "daily"
        ? true
        : isRequiredDay(habit, args.localDate);

    await ctx.db.insert("habitCompletions", {
      habit_id: args.habitId,
      completed_at: args.completedAt ?? Date.now(),
      local_date: args.localDate,
      period_key: periodKey,
      count: 1,
      is_streak_eligible: isStreakEligible,
      created_at: Date.now(),
    });

    return {
      incremented: true,
      currentPeriodCount: currentPeriodCount + 1,
      targetCount: habit.target_count,
      isStreakEligible,
    };
  },
});
