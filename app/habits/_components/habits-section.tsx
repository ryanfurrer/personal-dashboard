"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import SectionHeader from "@/components/section-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
// @ts-expect-error - Direct import for performance
import Plus from "lucide-react/dist/esm/icons/plus";
import { HabitCard } from "./habit-card";
import { HabitFormSheet } from "./habit-form-sheet";
import {
  CategoryOption,
  HabitStatusResult,
  HabitWithStats,
  HabitsMode,
  buildHabitMutationPayload,
  defaultHabitFormState,
  getTodayLocalDate,
  groupHabitsByCategory,
  toHabitFormState,
  validateHabitForm,
} from "../_lib/habit-helpers";

export default function HabitsSection({ mode = "active" }: { mode?: HabitsMode }) {
  const localDate = getTodayLocalDate();
  const habits = useQuery(
    mode === "active"
      ? api.habits.listActiveHabitsWithStats
      : api.habits.listArchivedHabitsWithStats,
    { localDate },
  ) as HabitWithStats[] | undefined;
  const categories = useQuery(api.habits.listCategories, {}) as
    | CategoryOption[]
    | undefined;
  const createHabit = useMutation(api.habits.createHabit);
  const updateHabit = useMutation(api.habits.updateHabit);
  const completeHabit = useMutation(api.habits.completeHabit);
  const archiveHabit = useMutation(api.habits.archiveHabit);
  const restoreHabit = useMutation(api.habits.restoreHabit);
  const deleteHabit = useMutation(api.habits.deleteHabit);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingHabitId, setEditingHabitId] = useState<Id<"habits"> | null>(null);
  const [form, setForm] = useState(defaultHabitFormState);
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

  const groupedHabits = useMemo(
    () => groupHabitsByCategory(habits ?? []),
    [habits],
  );

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
    setForm(defaultHabitFormState());
    setFormError(null);
    setSheetOpen(true);
  }, []);

  const openEditSheet = useCallback((habit: HabitWithStats) => {
    setEditingHabitId(habit._id);
    setForm(toHabitFormState(habit));
    setFormError(null);
    setSheetOpen(true);
  }, []);

  const handleSubmitForm = useCallback(async () => {
    setFormError(null);
    const validation = validateHabitForm(form);
    if (!validation.ok) {
      setFormError(validation.error);
      return;
    }

    const payload = buildHabitMutationPayload(form, categories ?? []);
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
      setForm(defaultHabitFormState());
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
    setTransientHeaderStatus,
    updateHabit,
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
  const isLoading = habits === undefined;

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title={sectionTitle}
        id={mode === "active" ? "habits" : "archived-habits"}
        action={
          <div className="flex items-center gap-2">
            {headerStatus && (
              <p
                className={`text-xs ${
                  headerStatus.success ? "text-muted-foreground" : "text-destructive"
                }`}
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

      {isLoading ? (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <Skeleton className="h-4 w-28" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <Card key={`habit-skeleton-${index}`} size="sm">
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-6 w-6 rounded-sm" />
                    </div>
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-8 w-20" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-16" />
                    </div>
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : groupedHabits.length === 0 ? (
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
                {categoryHabits.map((habit) => (
                  <HabitCard
                    key={habit._id}
                    habit={habit}
                    mode={mode}
                    status={habitStatuses.get(habit._id)}
                    pendingActionId={pendingHabitActionId}
                    onEdit={openEditSheet}
                    onComplete={handleCompleteHabit}
                    onArchive={handleArchiveHabit}
                    onRestore={handleRestoreHabit}
                    onDelete={handleDeleteHabit}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {mode === "active" && (
        <HabitFormSheet
          open={sheetOpen}
          onOpenChange={setSheetOpen}
          editingHabitId={editingHabitId}
          form={form}
          setForm={setForm}
          formError={formError}
          categories={categories}
          submitting={submittingForm}
          onSubmit={handleSubmitForm}
        />
      )}
    </section>
  );
}
