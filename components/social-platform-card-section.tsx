"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useAction } from "convex/react";
import { api } from "../convex/_generated/api";
import { SocialsRefreshAllButton } from "./socials-refresh-all-button";
import { SocialPlatformCard } from "./socials-platform-card";
import SectionHeader from "./section-header";

export default function SocialPlatformCardSection() {
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
      <SectionHeader title="Social Metrics" description="Update all social metrics at once" action={
        <SocialsRefreshAllButton
          refreshingAll={refreshingAll}
          refreshingPlatform={refreshingPlatform}
          refreshAllResult={refreshAllResult}
          onRefreshAll={handleRefreshAll}
        />
      } />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
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
            const result = platformResults.get(platformKey);
            const isRefreshing = refreshingPlatform === platformKey;

            return (
              <SocialPlatformCard
                key={_id}
                platform={platform}
                follower_count={follower_count}
                subscriber_count={subscriber_count}
                url={url}
                profile_url={profile_url}
                last_updated={last_updated}
                platformKey={platformKey}
                isClicked={isClicked}
                result={result}
                isRefreshing={isRefreshing}
                isDisabled={isRefreshing || refreshingAll}
                isAnimatingTimestamp={animatingTimestamps.has(_id)}
                onRefresh={() => handleRefreshPlatform(platform)}
              />
            );
          },
        )}
      </div>
    </section>
  );
}
