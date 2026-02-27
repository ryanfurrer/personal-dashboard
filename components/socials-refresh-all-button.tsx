"use client";

import { Button } from "./ui/button";
// @ts-expect-error - Direct import for performance (avoids loading 1,583 modules from barrel)
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
// @ts-expect-error - Direct import for performance (avoids loading 1,583 modules from barrel)
import Check from "lucide-react/dist/esm/icons/check";
// @ts-expect-error - Direct import for performance (avoids loading 1,583 modules from barrel)
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";

interface SocialsRefreshAllButtonProps {
  refreshingAll: boolean;
  refreshingPlatform: string | null;
  refreshAllResult: {
    successful: string[];
    failed: Array<{ platform: string; error: string }>;
    total: number;
  } | null;
  onRefreshAll: () => void;
}

export function SocialsRefreshAllButton({
  refreshingAll,
  refreshingPlatform,
  refreshAllResult,
  onRefreshAll,
}: SocialsRefreshAllButtonProps) {
  return (
    <div className="flex items-center gap-4">
      {/* Success/Error Message */}
      {refreshAllResult && (
        <div className="flex items-center gap-1.5 text-sm animate-fade-slide-up">
          {refreshAllResult.failed.length > 0 ? (
            <>
              <AlertCircle className="size-4 text-destructive" />
              <span className="text-muted-foreground">
                {refreshAllResult.failed.length} failed
              </span>
            </>
          ) : refreshAllResult.successful.length > 0 ? (
            <>
              <Check className="size-4 text-green-600 dark:text-green-500" />
              <span className="text-muted-foreground">
                All {refreshAllResult.successful.length} refreshed
              </span>
            </>
          ) : null}
        </div>
      )}

      {/* Alert Dialog with trigger and content */}
      <AlertDialog>
        {refreshAllResult && refreshAllResult.failed.length > 0 && (
          <AlertDialogTrigger
            render={
              <Button variant="linkInline" size="sm" className="h-auto">
                Learn more
              </Button>
            }
          />
        )}

        {/* Refresh All Button */}
        <Button
          onClick={onRefreshAll}
          disabled={refreshingAll || refreshingPlatform !== null}
          variant={
            refreshAllResult && refreshAllResult.failed.length > 0
              ? "destructive"
              : refreshAllResult &&
                  refreshAllResult.failed.length === 0 &&
                  refreshAllResult.successful.length > 0
                ? "default"
                : "outline"
          }
          size="sm"
          data-icon="inline-start"
        >
          {refreshingAll ? (
            <RefreshCw
              className={cn(
                "size-[1.2em] animate-spin transition-opacity duration-200",
              )}
              style={{ transitionTimingFunction: "var(--ease-out-cubic)" }}
            />
          ) : refreshAllResult && refreshAllResult.failed.length > 0 ? (
            <AlertCircle
              className={cn("size-[1.2em] transition-opacity duration-200")}
              style={{ transitionTimingFunction: "var(--ease-out-cubic)" }}
            />
          ) : refreshAllResult &&
              refreshAllResult.failed.length === 0 &&
              refreshAllResult.successful.length > 0 ? (
            <Check
              className={cn("size-[1.2em] transition-opacity duration-200")}
              style={{ transitionTimingFunction: "var(--ease-out-cubic)" }}
            />
          ) : (
            <RefreshCw
              className={cn("size-[1.2em] transition-opacity duration-200")}
              style={{ transitionTimingFunction: "var(--ease-out-cubic)" }}
            />
          )}
          Refresh All
        </Button>

        {/* Dialog Content */}
        {refreshAllResult && refreshAllResult.failed.length > 0 && (
          <AlertDialogContent size="default">
            <AlertDialogHeader>
              <AlertDialogTitle>Refresh Errors</AlertDialogTitle>
              <AlertDialogDescription>
                {refreshAllResult.failed.length} of {refreshAllResult.total}{" "}
                platforms failed to refresh.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {refreshAllResult.failed.map((failure, index) => (
                <div key={`${failure.platform}-${index}`} className="rounded-md bg-muted p-3">
                  <p className="font-medium capitalize">{failure.platform}</p>
                  <pre className="text-sm text-muted-foreground whitespace-pre-wrap wrap-break-words">
                    <code>{failure.error}</code>
                  </pre>
                </div>
              ))}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Close</AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        )}
      </AlertDialog>
    </div>
  );
}
