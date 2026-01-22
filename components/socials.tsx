"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "./ui/button";
// @ts-expect-error - Direct import for performance (avoids loading 1,583 modules from barrel)
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
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

function formatTimestamp(timestamp?: number): string {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function Socials() {
  const socials = useQuery(api.socials.listSocials);
  const refreshAll = useAction(api.socials.refreshAllPlatforms);
  const refreshPlatform = useAction(api.socials.refreshPlatform);

  const [refreshingAll, setRefreshingAll] = useState(false);
  const [refreshingPlatform, setRefreshingPlatform] = useState<string | null>(null);
  const [clickedPlatform, setClickedPlatform] = useState<string | null>(null);
  const clickedPlatformTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [refreshAllResult, setRefreshAllResult] = useState<{
    successful: string[];
    failed: Array<{ platform: string; error: string }>;
    total: number;
  } | null>(null);
  const [platformResults, setPlatformResults] = useState<
    Map<
      string,
      {
        success: boolean;
        error?: string;
      }
    >
  >(new Map());
  const platformSuccessTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(
    new Map(),
  );
  const previousTimestampsRef = useRef<Map<string, number>>(new Map());
  const [animatingTimestamps, setAnimatingTimestamps] = useState<Set<string>>(
    new Set(),
  );
  const timestampAnimationTimeoutRef = useRef<Map<string, NodeJS.Timeout>>(
    new Map(),
  );

  // Cleanup timeouts on unmount
  useEffect(() => {
    const timeoutMap = platformSuccessTimeoutRef.current;
    const timestampTimeoutMap = timestampAnimationTimeoutRef.current;
    return () => {
      // Cleanup all timeouts on unmount
      timeoutMap.forEach((timeout) => clearTimeout(timeout));
      timeoutMap.clear();
      timestampTimeoutMap.forEach((timeout) => clearTimeout(timeout));
      timestampTimeoutMap.clear();
    };
  }, []);

  // Track timestamp updates and trigger animations
  useEffect(() => {
    if (!socials) return;

    socials.forEach((social) => {
      const id = social._id;
      const currentTimestamp = social.last_updated ?? 0;
      const previousTimestamp = previousTimestampsRef.current.get(id) ?? 0;

      // If timestamp increased, trigger animation
      if (currentTimestamp > previousTimestamp && previousTimestamp > 0) {
        setAnimatingTimestamps((prev) => {
          const next = new Set(prev);
          next.add(id);
          return next;
        });

        // Clear any existing timeout for this platform
        const existingTimeout = timestampAnimationTimeoutRef.current.get(id);
        if (existingTimeout) {
          clearTimeout(existingTimeout);
        }

        // Clear animation state after animation completes (2.5s)
        const timeout = setTimeout(() => {
          setAnimatingTimestamps((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
          });
          timestampAnimationTimeoutRef.current.delete(id);
        }, 2500);

        timestampAnimationTimeoutRef.current.set(id, timeout);
      }

      // Update previous timestamp
      previousTimestampsRef.current.set(id, currentTimestamp);
    });
  }, [socials]);

  const handleRefreshAll = async () => {
    setRefreshingAll(true);
    setRefreshAllResult(null);
    try {
      const result = await refreshAll({});
      setRefreshAllResult(result);
    } catch (error) {
      console.error("Failed to refresh all platforms:", error);
      setRefreshAllResult({
        successful: [],
        failed: [
          {
            platform: "All",
            error: error instanceof Error ? error.message : String(error),
          },
        ],
        total: 0,
      });
    } finally {
      setRefreshingAll(false);
    }
  };

  const handleRefreshPlatform = async (platform: string) => {
    const platformKey = platform.toLowerCase();

    // Clear any existing timeouts for this platform
    const existingTimeout = platformSuccessTimeoutRef.current.get(platformKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      platformSuccessTimeoutRef.current.delete(platformKey);
    }

    // Clear any existing timeout to prevent race conditions
    if (clickedPlatformTimeoutRef.current) {
      clearTimeout(clickedPlatformTimeoutRef.current);
      clickedPlatformTimeoutRef.current = null;
    }

    // Clear previous result
    setPlatformResults((prev) => {
      const next = new Map(prev);
      next.delete(platformKey);
      return next;
    });

    setClickedPlatform(platformKey);
    setRefreshingPlatform(platformKey);

    try {
      await refreshPlatform({ platform });
      // Success - show message then revert
      setPlatformResults((prev) => {
        const next = new Map(prev);
        next.set(platformKey, { success: true });
        return next;
      });

      // Auto-revert after 3 seconds
      const timeout = setTimeout(() => {
        setPlatformResults((prev) => {
          const next = new Map(prev);
          next.delete(platformKey);
          return next;
        });
        platformSuccessTimeoutRef.current.delete(platformKey);
      }, 3000);
      platformSuccessTimeoutRef.current.set(platformKey, timeout);
    } catch (error) {
      // Failure - show error message with dialog trigger
      setPlatformResults((prev) => {
        const next = new Map(prev);
        next.set(platformKey, {
          success: false,
          error: error instanceof Error ? error.message : String(error),
        });
        return next;
      });
      console.error(`Failed to refresh ${platform}:`, error);
    } finally {
      setRefreshingPlatform(null);
      // Keep clickedPlatform for animation, clear after animation
      clickedPlatformTimeoutRef.current = setTimeout(() => {
        setClickedPlatform(null);
        clickedPlatformTimeoutRef.current = null;
      }, 500);
    }
  };

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Social Metrics</h2>
        <div className="flex items-center gap-2">
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
                  <Button variant="link" size="sm" className="h-auto p-0">
                    learn more
                  </Button>
                }
              />
            )}

            {/* Refresh All Button */}
            <Button
              onClick={handleRefreshAll}
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
                    "size-[1.2em] animate-spin transition-opacity duration-200"
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
                    <div key={index} className="rounded-md bg-muted p-3">
                      <p className="font-medium capitalize">
                        {failure.platform}
                      </p>
                      <p className="text-sm text-muted-foreground wrap-break-word whitespace-pre-wrap">
                        {failure.error}
                      </p>
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
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
        {socials?.map(
          ({
            _id,
            follower_count,
            subscriber_count,
            platform,
            url,
            profile_url,
            last_updated,
          }) => {
            const platformKey = platform.toLowerCase();
            const isClicked = clickedPlatform === platformKey;
            const displayUrl = profile_url || url;

            return (
              <div
                key={_id}
                className="flex flex-col gap-3 border rounded-lg p-3 min-w-0"
              >
                <div className="flex items-start justify-between">
                  <p className="font-semibold">{platform}</p>
                  {(() => {
                    const result = platformResults.get(platformKey);
                    const isRefreshing = refreshingPlatform === platformKey;

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
                              <span className="text-destructive shrink-0">
                                Failed
                              </span>
                              <AlertDialogTrigger
                                render={
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs shrink-0"
                                  >
                                    learn more
                                  </Button>
                                }
                              />
                            </div>
                            {result.error && (
                              <AlertDialogContent size="default" className="max-w-lg w-[90vw] sm:w-full">
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Refresh Error
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Failed to refresh {platform}.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <div className="rounded-md bg-muted p-3 max-h-[60vh] overflow-y-auto">
                                  <p className="text-sm text-muted-foreground wrap-break-word whitespace-pre-wrap">
                                    {result.error}
                                  </p>
                                </div>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Close</AlertDialogCancel>
                                  <Button
                                    onClick={() => {
                                      handleRefreshPlatform(platform);
                                    }}
                                    variant="default"
                                  >
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
                        onClick={() => handleRefreshPlatform(platform)}
                        disabled={isRefreshing || refreshingAll}
                        variant="ghost"
                        size="icon-xs"
                        title={`Refresh ${platform}`}
                        className="transition-opacity duration-200 ease-out-cubic"
                      >
                        <RefreshCw
                          className={cn(
                            "size-3 transition-transform",
                            isClicked && "animate-[spin_0.5s_ease-out]",
                            (isRefreshing || refreshingAll) && "animate-spin",
                          )}
                        />
                      </Button>
                    );
                  })()}
                </div>
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono tabular-nums text-2xl">
                      {follower_count}
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">
                      followers
                    </span>
                  </div>
                  {subscriber_count !== undefined && subscriber_count > 0 && (
                    <span className="font-mono tabular-nums text-xs text-muted-foreground">
                      {subscriber_count} subscribers
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5">
                  {last_updated ? (
                    <p
                      className={cn(
                        "text-xs text-muted-foreground",
                        animatingTimestamps.has(_id) && "animate-green-fade"
                      )}
                    >
                      Updated {formatTimestamp(last_updated)}
                    </p>
                  ) : (
                    <p className="text-xs text-destructive">Not updated</p>
                  )}
                  <Button
                    nativeButton={false}
                    render={
                      <a
                        href={displayUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      />
                    }
                    variant="linkInline"
                    size="sm"
                    data-icon="inline-end"
                  >
                    View Profile
                    <ArrowUpRight className="size-[1.2em]" />
                  </Button>
                </div>
              </div>
            );
          },
        )}
      </div>
    </section>
  );
}
