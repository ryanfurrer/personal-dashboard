"use client";

import { Button } from "./ui/button";
// @ts-expect-error - Direct import for performance (avoids loading 1,583 modules from barrel)
import ArrowUpRight from "lucide-react/dist/esm/icons/arrow-up-right";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/format-timestamp";
import { SocialsRefreshStatus } from "./socials-refresh-status";

interface SocialPlatformCardProps {
  platform: string;
  follower_count: number;
  subscriber_count?: number;
  url?: string;
  profile_url?: string;
  last_updated?: number;
  isClicked: boolean;
  result?: {
    success: boolean;
    error?: string;
  };
  isRefreshing: boolean;
  isDisabled: boolean;
  isAnimatingTimestamp: boolean;
  onRefresh: () => void;
}

export function SocialPlatformCard({
  platform,
  follower_count,
  subscriber_count,
  url,
  profile_url,
  last_updated,
  isClicked,
  result,
  isRefreshing,
  isDisabled,
  isAnimatingTimestamp,
  onRefresh,
}: SocialPlatformCardProps) {
  const displayUrl = profile_url || url;

  return (
    <div className="flex flex-col gap-3 border rounded-lg p-3 min-w-0">
      <div className="flex items-start justify-between min-w-0">
        <p className="font-semibold truncate">{platform}</p>
        <SocialsRefreshStatus
          platform={platform}
          result={result}
          isRefreshing={isRefreshing}
          isClicked={isClicked}
          isDisabled={isDisabled}
          onRefresh={onRefresh}
        />
      </div>
      <div className="flex flex-col gap-1.5 overflow-hidden">
        <div className="flex items-baseline gap-2 min-w-0">
          <span className="font-mono tabular-nums text-2xl truncate">
            {follower_count}
          </span>
          <span className="font-mono text-xs text-muted-foreground shrink-0">
            followers
          </span>
        </div>
        {subscriber_count !== undefined && subscriber_count > 0 && (
          <span className="font-mono tabular-nums text-xs text-muted-foreground truncate">
            {subscriber_count} subscribers
          </span>
        )}
      </div>
      <div className="flex flex-col gap-1.5 overflow-hidden">
        {last_updated ? (
          <p
            className={cn(
              "text-xs text-muted-foreground",
              isAnimatingTimestamp && "animate-green-fade",
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
}
