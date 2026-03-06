"use client";

// @ts-expect-error - Direct import for performance
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
// @ts-expect-error - Direct import for performance
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
import { AreaChart, Area, ResponsiveContainer, Tooltip } from "recharts";
import { cn } from "@/lib/utils";
import { formatTimestamp } from "@/lib/format-timestamp";
import { SocialsRefreshStatus } from "./socials-refresh-status";

const PLATFORM_COLORS: Record<string, string> = {
  twitter: "#1d9bf0",
  x: "#1d9bf0",
  bluesky: "#0085ff",
  github: "#3fb950",
  youtube: "#ef4444",
  twitch: "#9146ff",
};

type HistoryEntry = { count: number; timestamp: number };
type DualHistoryEntry = { timestamp: number; followers: number; subscribers: number };

interface SocialPlatformCardProps {
  platform: string;
  follower_count: number;
  subscriber_count?: number;
  follower_history?: HistoryEntry[];
  subscriber_history?: HistoryEntry[];
  url?: string;
  profile_url?: string;
  last_updated?: number;
  isClicked: boolean;
  result?: { success: boolean; error?: string };
  isRefreshing: boolean;
  isDisabled: boolean;
  isAnimatingTimestamp: boolean;
  onRefresh: () => void;
}

function TrendIndicator({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined) return null;
  const diff = current - previous;
  if (diff === 0) return null;
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
        <TrendingUp className="size-2.5" />
        +{diff.toLocaleString()}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full bg-rose-500/15 px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-rose-600 dark:text-rose-400">
      <TrendingDown className="size-2.5" />
      {diff.toLocaleString()}
    </span>
  );
}

function SparklineTooltip({
  active,
  payload,
  dual,
}: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string; payload: { timestamp: number } }>;
  dual?: boolean;
}) {
  if (!active || !payload?.length) return null;
  const date = new Date(payload[0].payload.timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
  return (
    <div className="rounded-lg border border-border/60 bg-popover/90 px-2.5 py-1.5 text-[10px] shadow-lg backdrop-blur-sm space-y-0.5">
      {dual
        ? payload.map((p) => (
            <p key={p.name} className="font-semibold tabular-nums" style={{ color: p.color }}>
              {p.name}: {p.value.toLocaleString()}
            </p>
          ))
        : <p className="font-semibold tabular-nums">{payload[0].value.toLocaleString()}</p>}
      <p className="text-muted-foreground">{date}</p>
    </div>
  );
}

function SocialSparkline({
  history,
  color,
  subscriberHistory,
  subscriberColor,
  fullBleed = false,
}: {
  history?: HistoryEntry[];
  color?: string;
  subscriberHistory?: HistoryEntry[];
  subscriberColor?: string;
  fullBleed?: boolean;
}) {
  if (!history || history.length < 2) return null;

  const strokeColor = color ?? "#6366f1";
  const dual = !!subscriberHistory && subscriberHistory.length >= 2;
  const margin = fullBleed
    ? { top: 0, right: 0, left: 0, bottom: 0 }
    : { top: 2, right: 2, left: 2, bottom: 2 };

  if (dual) {
    const mergedData: DualHistoryEntry[] = history.map((entry, i) => ({
      timestamp: entry.timestamp,
      followers: entry.count,
      subscribers: subscriberHistory![i]?.count ?? 0,
    }));
    const subColor = subscriberColor ?? "#a78bfa";

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={mergedData} margin={margin}>
          <defs>
            <linearGradient id="bg-fill-followers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity={fullBleed ? 0.5 : 0.2} />
              <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bg-fill-subscribers" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={subColor} stopOpacity={fullBleed ? 0.4 : 0.15} />
              <stop offset="100%" stopColor={subColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {!fullBleed && <Tooltip content={<SparklineTooltip dual />} />}
          <Area
            type="monotone"
            dataKey="followers"
            name="Followers"
            stroke={strokeColor}
            strokeWidth={fullBleed ? 2 : 1.5}
            fill="url(#bg-fill-followers)"
            dot={false}
            activeDot={fullBleed ? false : { r: 2, fill: strokeColor }}
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="subscribers"
            name="Subs"
            stroke={subColor}
            strokeWidth={fullBleed ? 2 : 1.5}
            fill="url(#bg-fill-subscribers)"
            dot={false}
            activeDot={fullBleed ? false : { r: 2, fill: subColor }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={history} margin={margin}>
        <defs>
          <linearGradient id={`bg-fill-${strokeColor.replace(/[^a-zA-Z0-9]/g, "")}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity={fullBleed ? 0.55 : 0.2} />
            <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
          </linearGradient>
        </defs>
        {!fullBleed && <Tooltip content={<SparklineTooltip />} />}
        <Area
          type="monotone"
          dataKey="count"
          stroke={strokeColor}
          strokeWidth={fullBleed ? 2 : 1.5}
          fill={`url(#bg-fill-${strokeColor.replace(/[^a-zA-Z0-9]/g, "")})`}
          dot={false}
          activeDot={fullBleed ? false : { r: 2, fill: strokeColor }}
          isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SocialPlatformCard({
  platform,
  follower_count,
  subscriber_count,
  follower_history,
  subscriber_history,
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
  const accentColor = PLATFORM_COLORS[platform.toLowerCase()];
  const hasTwoMetrics = subscriber_count !== undefined && subscriber_count > 0;
  const hasChart = (follower_history?.length ?? 0) >= 2;
  const previousFollowerCount = follower_history?.[follower_history.length - 1]?.count;
  const previousSubscriberCount = subscriber_history?.[subscriber_history.length - 1]?.count;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl bg-card text-card-foreground ring-1 ring-foreground/10 shadow-xs min-h-[148px]">

      {/* Platform color top accent bar */}
      {accentColor && (
        <div
          className="absolute inset-x-0 top-0 h-px"
          style={{ backgroundColor: accentColor }}
        />
      )}

      {/* Full-bleed background chart */}
      {hasChart && (
        <div className="absolute inset-x-0 bottom-0 top-[30%] opacity-50 dark:opacity-40">
          <SocialSparkline
            history={follower_history}
            color={accentColor}
            subscriberHistory={hasTwoMetrics ? subscriber_history : undefined}
            subscriberColor="#a78bfa"
            fullBleed
          />
        </div>
      )}

      {/* Top gradient: protects header + numbers from the chart behind */}
      <div className="absolute inset-x-0 top-0 h-[65%] bg-gradient-to-b from-card via-card/95 to-transparent pointer-events-none" />

      {/* Bottom platform glow */}
      {accentColor && (
        <div
          className="absolute inset-x-0 bottom-0 h-14 pointer-events-none"
          style={{ background: `linear-gradient(to top, ${accentColor}20, transparent)` }}
        />
      )}

      {/* Content */}
      <div className="relative flex flex-1 flex-col p-4">

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {displayUrl ? (
              <a
                href={displayUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors duration-150 hover:text-foreground focus-visible:outline-none focus-visible:underline"
              >
                {platform}
              </a>
            ) : (
              platform
            )}
          </span>
          <div className={cn(
            "shrink-0 transition-opacity duration-200",
            !isRefreshing && !result ? "opacity-0 group-hover:opacity-100" : "opacity-100",
          )}>
            <SocialsRefreshStatus
              platform={platform}
              result={result}
              isRefreshing={isRefreshing}
              isClicked={isClicked}
              isDisabled={isDisabled}
              onRefresh={onRefresh}
            />
          </div>
        </div>

        {/* Metrics */}
        <div className="mt-2.5">
          {hasTwoMetrics ? (
            <div className="flex gap-4">
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-mono tabular-nums text-2xl font-bold leading-none tracking-tight">
                    {follower_count.toLocaleString()}
                  </span>
                  <TrendIndicator current={follower_count} previous={previousFollowerCount} />
                </div>
                <span className="text-[11px] text-muted-foreground">followers</span>
              </div>
              <div className="w-px self-stretch bg-border/50 shrink-0" />
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="font-mono tabular-nums text-2xl font-bold leading-none tracking-tight">
                    {subscriber_count!.toLocaleString()}
                  </span>
                  <TrendIndicator current={subscriber_count!} previous={previousSubscriberCount} />
                </div>
                <span className="text-[11px] text-muted-foreground">subs</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-0.5">
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className="font-mono tabular-nums text-3xl font-bold leading-none tracking-tight">
                  {follower_count.toLocaleString()}
                </span>
                <TrendIndicator current={follower_count} previous={previousFollowerCount} />
              </div>
              <span className="text-[11px] text-muted-foreground">
                {platform.toLowerCase() === "youtube" ? "subscribers" : "followers"}
              </span>
            </div>
          )}
        </div>

        {/* Timestamp */}
        <div className="mt-auto pt-6">
          {last_updated ? (
            <p className={cn(
              "text-[10px] text-muted-foreground/50",
              isAnimatingTimestamp && "animate-green-fade",
            )}>
              {formatTimestamp(last_updated)}
            </p>
          ) : (
            <p className="text-[10px] text-destructive/60">Not updated</p>
          )}
        </div>
      </div>
    </div>
  );
}
