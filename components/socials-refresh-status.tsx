"use client";

import { useEffect, useState } from "react";
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

interface SocialsRefreshStatusProps {
  platform: string;
  result?: {
    success: boolean;
    error?: string;
  };
  isRefreshing: boolean;
  isClicked: boolean;
  isDisabled: boolean;
  onRefresh: () => void;
}

export function SocialsRefreshStatus({
  platform,
  result,
  isRefreshing,
  isClicked,
  isDisabled,
  onRefresh,
}: SocialsRefreshStatusProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  const handleCopyError = async () => {
    if (!result?.error) return;
    const isProduction = process.env.NODE_ENV === "production";

    const fallbackCopy = (text: string) => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "absolute";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      const copiedSuccessfully = document.execCommand("copy");
      document.body.removeChild(textarea);
      return copiedSuccessfully;
    };

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        typeof navigator.clipboard.writeText === "function"
      ) {
        await navigator.clipboard.writeText(result.error);
      } else if (!isProduction) {
        const copiedSuccessfully = fallbackCopy(result.error);
        if (!copiedSuccessfully) {
          throw new Error("Clipboard API unavailable and fallback copy failed");
        }
      } else {
        throw new Error(
          "Clipboard API unavailable in production environment"
        );
      }
      setCopied(true);
    } catch (error) {
      console.error("Failed to copy error text:", error);
    }
  };

  // Show status message if there's a result
  if (result) {
    if (result.success) {
      // Success message
      return (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground animate-fade-scale">
          <Check className="size-3 text-green-600 dark:text-green-500" />
          <span>Refreshed</span>
        </div>
      );
    } else {
      // Error message with dialog trigger
      return (
        <AlertDialog>
          <div className="flex items-center gap-1.5 text-xs flex-wrap max-w-full justify-end animate-fade-slide-left">
            <AlertCircle className="size-3 text-destructive shrink-0" />
            <span className="text-destructive shrink-0">Failed</span>
            <AlertDialogTrigger
              render={
                <Button
                  variant="linkInline"
                  size="sm"
                  className="h-auto text-xs shrink-0"
                >
                  Learn more
                </Button>
              }
            />
          </div>
          {result.error && (
            <AlertDialogContent
              size="default"
              className="max-w-lg w-[90vw] sm:w-full"
            >
              <AlertDialogHeader>
                <AlertDialogTitle>Refresh Error</AlertDialogTitle>
                <AlertDialogDescription>
                  Failed to refresh {platform}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="rounded-md bg-muted p-3 max-h-[60vh] overflow-y-auto">
                <pre className="text-sm text-muted-foreground whitespace-pre-wrap wrap-break-words">
                  <code>{result.error}</code>
                </pre>
              </div>
              <AlertDialogFooter>
                <Button
                  onClick={handleCopyError}
                  variant="outline"
                >
                  {copied ? "Copied" : "Copy Error"}
                </Button>
                <AlertDialogCancel>Close</AlertDialogCancel>
                <Button onClick={onRefresh} variant="default">
                  Try Again
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          )}
        </AlertDialog>
      );
    }
  }

  // Show button if no result (normal state or refreshing)
  return (
    <Button
      onClick={onRefresh}
      disabled={isDisabled}
      variant="ghost"
      size="icon-xs"
      title={`Refresh ${platform}`}
      className="transition-opacity duration-200 ease-out-cubic"
    >
      <RefreshCw
        className={cn(
          "size-3 transition-transform",
          isClicked && "animate-[spin_0.5s_ease-out]",
          isRefreshing && "animate-spin",
        )}
      />
    </Button>
  );
}
