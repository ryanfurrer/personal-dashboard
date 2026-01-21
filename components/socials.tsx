"use client";

import { useState } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "./ui/button";
import { ArrowUpRight, RefreshCw, Loader2 } from "lucide-react";

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
    setSyncingPlatform(platform);
    try {
      await syncPlatform({ platform });
    } catch (error) {
      console.error(`Failed to sync ${platform}:`, error);
    } finally {
      setSyncingPlatform(null);
    }
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Social Metrics</h2>
        <Button
          onClick={handleSyncAll}
          disabled={syncingAll}
          variant="outline"
          size="sm"
          data-icon="inline-start"
        >
          {syncingAll ? (
            <Loader2 className="size-[1.2em] animate-spin" />
          ) : (
            <RefreshCw className="size-[1.2em]" />
          )}
          Sync All
        </Button>
      </div>
      <div className="flex flex-wrap gap-4">
        {socials?.map(({ _id, follower_count, subscriber_count, platform, url, profile_url, last_updated }) => {
          const isSyncing = syncingPlatform === platform.toLowerCase();
          const displayUrl = profile_url || url;

          return (
            <div key={_id} className="flex flex-col gap-2 border rounded-lg h-full w-fit aspect-square p-4 justify-between">
              <div className="flex items-start justify-between">
                <p className="font-semibold">{platform}</p>
                <Button
                  onClick={() => handleSyncPlatform(platform)}
                  disabled={isSyncing || syncingAll}
                  variant="ghost"
                  size="icon-xs"
                  title={`Sync ${platform}`}
                >
                  {isSyncing ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3" />
                  )}
                </Button>
              </div>
              <div className="flex flex-col gap-1">
                <span className="font-mono tabular-nums text-3xl">{follower_count}</span>
                {subscriber_count !== undefined && subscriber_count > 0 && (
                  <span className="font-mono tabular-nums text-lg text-muted-foreground">
                    {subscriber_count} subscribers
                  </span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {last_updated && (
                  <p className="text-xs text-muted-foreground">
                    Updated {formatTimestamp(last_updated)}
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
                  variant="secondary" 
                  size="sm" 
                  data-icon="inline-end"
                >
                  View Profile
                  <ArrowUpRight className="size-[1.2em]" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}