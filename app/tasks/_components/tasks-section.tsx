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
import { TaskCard } from "./task-card";
import { TaskFormSheet } from "./task-form-sheet";
import {
  TaskItem,
  TaskStatusResult,
  buildTaskMutationPayload,
  defaultTaskFormState,
  sortTasks,
  toTaskFormState,
  validateTaskForm,
} from "../_lib/task-helpers";

export default function TasksSection() {
  const tasks = useQuery(api.tasks.listTasks, {}) as TaskItem[] | undefined;
  const createTask = useMutation(api.tasks.createTask);
  const updateTask = useMutation(api.tasks.updateTask);
  const toggleTaskComplete = useMutation(api.tasks.toggleTaskComplete);
  const deleteTask = useMutation(api.tasks.deleteTask);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<Id<"tasks"> | null>(null);
  const [form, setForm] = useState(defaultTaskFormState);
  const [formError, setFormError] = useState<string | null>(null);
  const [headerStatus, setHeaderStatus] = useState<TaskStatusResult | null>(null);
  const [submittingForm, setSubmittingForm] = useState(false);
  const [pendingTaskActionId, setPendingTaskActionId] = useState<Id<"tasks"> | null>(
    null,
  );
  const [taskStatuses, setTaskStatuses] = useState<Map<string, TaskStatusResult>>(
    new Map(),
  );
  const headerStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const taskStatusTimeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

  useEffect(() => {
    const timeouts = taskStatusTimeoutsRef.current;
    return () => {
      if (headerStatusTimeoutRef.current) {
        clearTimeout(headerStatusTimeoutRef.current);
      }
      timeouts.forEach((timeout) => clearTimeout(timeout));
      timeouts.clear();
    };
  }, []);

  const sortedTasks = useMemo(() => sortTasks(tasks ?? []), [tasks]);
  const isLoading = tasks === undefined;

  const setTransientHeaderStatus = useCallback((status: TaskStatusResult | null) => {
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

  const setTransientTaskStatus = useCallback((taskId: string, status: TaskStatusResult) => {
    setTaskStatuses((prev) => {
      const next = new Map(prev);
      next.set(taskId, status);
      return next;
    });

    const existing = taskStatusTimeoutsRef.current.get(taskId);
    if (existing) clearTimeout(existing);

    const timeout = setTimeout(() => {
      setTaskStatuses((prev) => {
        const next = new Map(prev);
        next.delete(taskId);
        return next;
      });
      taskStatusTimeoutsRef.current.delete(taskId);
    }, 4000);

    taskStatusTimeoutsRef.current.set(taskId, timeout);
  }, []);

  const openCreateSheet = useCallback(() => {
    setEditingTaskId(null);
    setForm(defaultTaskFormState());
    setFormError(null);
    setSheetOpen(true);
  }, []);

  const openEditSheet = useCallback((task: TaskItem) => {
    setEditingTaskId(task._id);
    setForm(toTaskFormState(task));
    setFormError(null);
    setSheetOpen(true);
  }, []);

  const handleSubmitForm = useCallback(async () => {
    setFormError(null);
    const validation = validateTaskForm(form);
    if (!validation.ok) {
      setFormError(validation.error);
      return;
    }

    const payload = buildTaskMutationPayload(form);
    setSubmittingForm(true);
    try {
      if (editingTaskId) {
        await updateTask({
          taskId: editingTaskId,
          ...payload,
        });
        setTransientHeaderStatus({
          success: true,
          message: "Task updated",
        });
      } else {
        await createTask({
          title: payload.title,
          notes: payload.notes,
          dueDate: payload.dueDate,
        });
        setTransientHeaderStatus({
          success: true,
          message: "Task created",
        });
      }

      setSheetOpen(false);
      setEditingTaskId(null);
      setForm(defaultTaskFormState());
    } catch (error) {
      setFormError(error instanceof Error ? error.message : String(error));
    } finally {
      setSubmittingForm(false);
    }
  }, [
    createTask,
    editingTaskId,
    form,
    setTransientHeaderStatus,
    updateTask,
  ]);

  const handleToggleComplete = useCallback(
    async (task: TaskItem) => {
      setPendingTaskActionId(task._id);
      try {
        const result = await toggleTaskComplete({ taskId: task._id });
        setTransientTaskStatus(task._id, {
          success: true,
          message: result.isCompleted ? "Task completed" : "Task reopened",
        });
      } catch (error) {
        setTransientTaskStatus(task._id, {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setPendingTaskActionId(null);
      }
    },
    [setTransientTaskStatus, toggleTaskComplete],
  );

  const handleDeleteTask = useCallback(
    async (task: TaskItem) => {
      if (!window.confirm(`Delete "${task.title}"? It will no longer appear in the app.`)) {
        return;
      }
      setPendingTaskActionId(task._id);
      try {
        await deleteTask({ taskId: task._id });
        setTransientTaskStatus(task._id, {
          success: true,
          message: "Task deleted",
        });
      } catch (error) {
        setTransientTaskStatus(task._id, {
          success: false,
          message: error instanceof Error ? error.message : String(error),
        });
      } finally {
        setPendingTaskActionId(null);
      }
    },
    [deleteTask, setTransientTaskStatus],
  );

  return (
    <section className="flex flex-col gap-6">
      <SectionHeader
        title="Tasks"
        id="tasks"
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
            <Button onClick={openCreateSheet} size="sm" data-icon="inline-start">
              <Plus className="size-[1.2em]" />
              New Task
            </Button>
          </div>
        }
      />

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={`task-skeleton-${index}`} size="sm">
              <CardContent className="flex flex-col gap-3">
                <div className="flex items-start justify-between">
                  <Skeleton className="h-5 w-28" />
                  <Skeleton className="h-6 w-6 rounded-sm" />
                </div>
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-24" />
                </div>
                <Skeleton className="h-8 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : sortedTasks.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No tasks yet. Create your first task to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sortedTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              status={taskStatuses.get(task._id)}
              pendingActionId={pendingTaskActionId}
              onToggleComplete={handleToggleComplete}
              onEdit={openEditSheet}
              onDelete={handleDeleteTask}
            />
          ))}
        </div>
      )}

      <TaskFormSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editingTaskId={editingTaskId}
        form={form}
        setForm={setForm}
        formError={formError}
        submitting={submittingForm}
        onSubmit={handleSubmitForm}
      />
    </section>
  );
}
