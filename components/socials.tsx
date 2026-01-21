"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "./ui/button";
import { ArrowUpRight, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

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
  const syncAll = useAction(api.socials.syncAllPlatforms);
  const syncPlatform = useAction(api.socials.syncPlatform);

  const [syncingAll, setSyncingAll] = useState(false);
  const [syncingPlatform, setSyncingPlatform] = useState<string | null>(null);
  const [clickedPlatform, setClickedPlatform] = useState<string | null>(null);

  const handleSyncAll = async () => {
    setSyncingAll(true);
    try {
      await syncAll({});
    } catch (error) {
      console.error("Failed to sync all platforms:", error);
    } finally {
      setSyncingAll(false);
    }
  };

  const handleSyncPlatform = async (platform: string) => {
    const platformKey = platform.toLowerCase();
    setClickedPlatform(platformKey);
    setSyncingPlatform(platformKey);
    try {
      await syncPlatform({ platform });
    } catch (error) {
      console.error(`Failed to sync ${platform}:`, error);
    } finally {
      setSyncingPlatform(null);
      setTimeout(() => setClickedPlatform(null), 500);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Social Metrics</h2>
        <Button
          onClick={handleSyncAll}
          disabled={syncingAll || syncingPlatform !== null}
          variant="outline"
          size="sm"
          data-icon="inline-start"
        >
          <RefreshCw
            className={cn("size-[1.2em]", syncingAll && "animate-spin")}
          />
          Refresh All
        </Button>
      </div>
      <div className="flex flex-wrap gap-4">
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
            const isSyncing = syncingPlatform === platformKey;
            const isClicked = clickedPlatform === platformKey;
            const displayUrl = profile_url || url;

            return (
              <div
                key={_id}
                className="flex flex-col gap-4 border rounded-lg w-48 p-4 aspect-square justify-between"
              >
                <div className="flex items-start justify-between">
                  <p className="font-semibold">{platform}</p>
                  <Button
                    onClick={() => handleSyncPlatform(platform)}
                    disabled={isSyncing || syncingAll}
                    variant="ghost"
                    size="icon-xs"
                    title={`Refresh ${platform}`}
                  >
                    <RefreshCw
                      className={cn(
                        "size-3 transition-transform",
                        isClicked && "animate-[spin_0.5s_ease-out]",
                        isSyncing && "animate-spin",
                      )}
                    />
                  </Button>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono tabular-nums text-3xl">
                      {follower_count}
                    </span>
                    <span className="font-mono text-sm text-muted-foreground">
                      followers
                    </span>
                  </div>
                  {subscriber_count !== undefined && subscriber_count > 0 && (
                    <span className="font-mono tabular-nums text-sm text-muted-foreground">
                      {subscriber_count} subscribers
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  {last_updated ? (
                    <p className="text-xs text-muted-foreground">
                      Updated {formatTimestamp(last_updated)}
                    </p>
                  ) : (
                    <p className="text-xs text-destructive">
                      Not updated
                    </p>
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
