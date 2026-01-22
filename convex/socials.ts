import { query, action, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import type { Doc } from "./_generated/dataModel";

export const listSocials = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("socials").collect();
  },
});

export const fetchTwitterMetrics = action({
  args: {},
  handler: async () => {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN;
    if (!bearerToken) {
      throw new Error("TWITTER_BEARER_TOKEN environment variable is not set");
    }

    try {
      const response = await fetch(
        "https://api.twitter.com/2/users/by/username/ryandotfurrer?user.fields=public_metrics,username",
        {
          headers: {
            Authorization: `Bearer ${bearerToken}`,
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Twitter API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      const user = data.data;

      if (!user) {
        throw new Error("Twitter API returned no user data");
      }

      const follower_count =
        user.public_metrics?.followers_count ?? 0;
      const username = user.username;
      const profile_url = `https://twitter.com/${username}`;

      return {
        follower_count,
        profile_url,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch Twitter metrics: ${error.message}`);
      }
      throw new Error("Failed to fetch Twitter metrics: Unknown error");
    }
  },
});

export const fetchBlueskyMetrics = action({
  args: {},
  handler: async () => {
    const handle = process.env.BLUESKY_HANDLE;
    if (!handle) {
      throw new Error("BLUESKY_HANDLE environment variable is not set");
    }

    // Format handle: append .bsky.social if not already present and not a DID
    const formattedHandle =
      handle.includes(".") || handle.startsWith("did:")
        ? handle
        : `${handle}.bsky.social`;

    try {
      const response = await fetch(
        `https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile?actor=${formattedHandle}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Bluesky API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      if (!data) {
        throw new Error("Bluesky API returned no data");
      }

      const follower_count = data.followersCount ?? 0;
      const profile_url = `https://bsky.app/profile/${formattedHandle}`;

      return {
        follower_count,
        profile_url,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch Bluesky metrics: ${error.message}`);
      }
      throw new Error("Failed to fetch Bluesky metrics: Unknown error");
    }
  },
});

export const fetchLinkedInMetrics = action({
  args: {},
  handler: async () => {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN;
    if (!accessToken) {
      throw new Error("LINKEDIN_ACCESS_TOKEN environment variable is not set");
    }

    try {
      // LinkedIn API v2 - Use /me endpoint to get profile URL
      // Follower count is not available via API for personal profiles
      const response = await fetch(
        `https://api.linkedin.com/v2/me?projection=(id,vanityName)`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "X-Restli-Protocol-Version": "2.0.0",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `LinkedIn API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();
      
      // Extract numeric ID from response (format: urn:li:person:123456)
      const personId = data.id || "";
      const numericId = personId.replace("urn:li:person:", "") || "";
      
      // Use vanityName if available, otherwise use numeric ID
      const profileSlug = data.vanityName ?? numericId;
      const profile_url = `https://www.linkedin.com/in/${profileSlug}`;

      return {
        follower_count: 0, // Not available via API for personal profiles
        profile_url,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch LinkedIn metrics: ${error.message}`);
      }
      throw new Error("Failed to fetch LinkedIn metrics: Unknown error");
    }
  },
});

export const fetchTwitchMetrics = action({
  args: {},
  handler: async (ctx) => {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    const username = process.env.TWITCH_USERNAME;
    if (!clientId || !clientSecret || !username) {
      throw new Error(
        "TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, and TWITCH_USERNAME environment variables are required"
      );
    }

    try {
      // Step 1: Get OAuth token using Client Credentials flow
      const tokenResponse = await fetch(
        `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
        {
          method: "POST",
        }
      );

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(
          `Twitch OAuth error: ${tokenResponse.status} ${tokenResponse.statusText} - ${errorText}`
        );
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      // Step 2: Get user ID from username
      const userResponse = await fetch(
        `https://api.twitch.tv/helix/users?login=${username}`,
        {
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!userResponse.ok) {
        const errorText = await userResponse.text();
        throw new Error(
          `Twitch API error (users): ${userResponse.status} ${userResponse.statusText} - ${errorText}`
        );
      }

      const userData = await userResponse.json();
      const user = userData.data?.[0];
      if (!user) {
        throw new Error("Twitch API returned no user data");
      }

      const userId = user.id;

      // Step 3: Get follower count using /helix/channels/followers
      // This endpoint provides total follower count directly in the response
      const followersResponse = await fetch(
        `https://api.twitch.tv/helix/channels/followers?broadcaster_id=${userId}`,
        {
          headers: {
            "Client-ID": clientId,
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!followersResponse.ok) {
        const errorText = await followersResponse.text();
        throw new Error(
          `Twitch API error (followers): ${followersResponse.status} ${followersResponse.statusText} - ${errorText}`
        );
      }

      const followersData: { total?: number } = await followersResponse.json();
      const follower_count = followersData.total ?? 0;

      // Step 4: Get subscriber count using User Access Token
      let subscriber_count = 0;
      try {
        const userAccessToken = await ctx.runAction(api.socials.getValidTwitchUserToken);
        if (userAccessToken) {
          // Fetch subscriber count using pagination
          let totalSubscribers = 0;
          let cursor: string | undefined = undefined;
          
          do {
            const subscriptionsUrl = new URL("https://api.twitch.tv/helix/subscriptions");
            subscriptionsUrl.searchParams.set("broadcaster_id", userId);
            if (cursor) {
              subscriptionsUrl.searchParams.set("after", cursor);
            }
            subscriptionsUrl.searchParams.set("first", "100"); // Max per page

            const subscriptionsResponse = await fetch(subscriptionsUrl.toString(), {
              headers: {
                "Client-ID": clientId,
                Authorization: `Bearer ${userAccessToken}`,
              },
            });

            if (subscriptionsResponse.ok) {
              const subscriptionsData = await subscriptionsResponse.json();
              totalSubscribers += subscriptionsData.data?.length || 0;
              cursor = subscriptionsData.pagination?.cursor;
            } else {
              // If unauthorized or other error, break and use 0
              console.warn(
                `Twitch subscriptions API error: ${subscriptionsResponse.status}`
              );
              break;
            }
          } while (cursor);

          subscriber_count = totalSubscribers;
        } else {
          console.warn("No valid Twitch user access token available for subscriber count");
        }
      } catch (error) {
        console.error("Failed to fetch subscriber count:", error);
        // Continue with subscriber_count = 0
      }

      const profile_url = `https://twitch.tv/${username}`;

      return {
        follower_count,
        subscriber_count,
        profile_url,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch Twitch metrics: ${error.message}`);
      }
      throw new Error("Failed to fetch Twitch metrics: Unknown error");
    }
  },
});

export const fetchYouTubeMetrics = action({
  args: {},
  handler: async () => {
    const apiKey = process.env.YOUTUBE_API_KEY;
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!apiKey) {
      throw new Error("YOUTUBE_API_KEY environment variable is not set");
    }
    if (!channelId) {
      throw new Error("YOUTUBE_CHANNEL_ID environment variable is not set");
    }

    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${channelId}&key=${apiKey}`,
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `YouTube API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      if (!data.items || data.items.length === 0) {
        throw new Error("YouTube API returned no channel data");
      }

      const channel = data.items[0];
      const follower_count = parseInt(
        channel.statistics?.subscriberCount ?? "0",
        10
      );
      const customUrl = channel.snippet?.customUrl;
      const profile_url = customUrl
        ? `https://youtube.com/${customUrl}`
        : `https://youtube.com/channel/${channelId}`;

      return {
        follower_count,
        profile_url,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch YouTube metrics: ${error.message}`);
      }
      throw new Error("Failed to fetch YouTube metrics: Unknown error");
    }
  },
});

export const fetchGitHubMetrics = action({
  args: {},
  handler: async () => {
    const username = process.env.GITHUB_USERNAME;
    const token = process.env.GITHUB_TOKEN;
    if (!username) {
      throw new Error("GITHUB_USERNAME environment variable is not set");
    }

    try {
      const headers: HeadersInit = {
        Accept: "application/vnd.github.v3+json",
      };

      // Add token if available for higher rate limits
      if (token) {
        headers.Authorization = `token ${token}`;
      }

      const response = await fetch(
        `https://api.github.com/users/${username}`,
        {
          headers,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `GitHub API error: ${response.status} ${response.statusText} - ${errorText}`
        );
      }

      const data = await response.json();

      if (!data) {
        throw new Error("GitHub API returned no data");
      }

      const follower_count = data.followers ?? 0;
      const profile_url = data.html_url ?? `https://github.com/${username}`;

      return {
        follower_count,
        profile_url,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to fetch GitHub metrics: ${error.message}`);
      }
      throw new Error("Failed to fetch GitHub metrics: Unknown error");
    }
  },
});

// Database Mutations

function normalizePlatformName(platform: string): string {
  const normalized = platform.toLowerCase().trim();

  // Handle Twitter/X aliases
  if (
    normalized === "x" ||
    normalized === "x/twitter" ||
    normalized.includes("twitter")
  ) {
    return "Twitter";
  }

  // Map to proper capitalization
  const platformMap: Record<string, string> = {
    bluesky: "Bluesky",
    github: "GitHub",
    twitch: "Twitch",
    youtube: "YouTube",
    linkedin: "LinkedIn",
  };

  return platformMap[normalized] || normalized;
}

export const updateSocialMetrics = mutation({
  args: {
    platform: v.string(),
    follower_count: v.float64(),
    subscriber_count: v.optional(v.float64()),
    profile_url: v.optional(v.string()),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Normalize platform name with proper capitalization and alias handling
    const normalizedPlatform = normalizePlatformName(args.platform);

    // Find existing record by platform using indexed query
    const existing = await ctx.db
      .query("socials")
      .withIndex("by_platform", (q) => q.eq("platform", normalizedPlatform))
      .first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        platform: normalizedPlatform, // Normalize with proper capitalization
        follower_count: args.follower_count,
        subscriber_count: args.subscriber_count,
        profile_url: args.profile_url ?? existing.profile_url,
        url: args.url ?? existing.url,
        last_updated: now,
      });
      return existing._id;
    } else {
      // Insert new record
      const id = await ctx.db.insert("socials", {
        platform: normalizedPlatform, // Normalize with proper capitalization
        follower_count: args.follower_count,
        subscriber_count: args.subscriber_count,
        profile_url: args.profile_url,
        url: args.url ?? args.profile_url ?? "",
        last_updated: now,
      });
      return id;
    }
  },
});

export const deleteSocial = mutation({
  args: {
    id: v.id("socials"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// Refresh Actions

export const refreshPlatform = action({
  args: {
    platform: v.string(),
  },
  handler: async (ctx, args) => {
    const { platform } = args;

    // Map platform name to fetch function
    let metrics: {
      follower_count: number;
      subscriber_count?: number;
      profile_url?: string;
    };

    switch (platform.toLowerCase()) {
      case "twitter":
      case "x":
        metrics = await ctx.runAction(api.socials.fetchTwitterMetrics);
        break;
      case "bluesky":
        metrics = await ctx.runAction(api.socials.fetchBlueskyMetrics);
        break;
      case "linkedin":
        metrics = await ctx.runAction(api.socials.fetchLinkedInMetrics);
        break;
      case "twitch":
        metrics = await ctx.runAction(api.socials.fetchTwitchMetrics);
        break;
      case "youtube":
        metrics = await ctx.runAction(api.socials.fetchYouTubeMetrics);
        break;
      case "github":
        metrics = await ctx.runAction(api.socials.fetchGitHubMetrics);
        break;
      default:
        throw new Error(`Unknown platform: ${platform}`);
    }

    // Update database
    await ctx.runMutation(api.socials.updateSocialMetrics, {
      platform: platform.toLowerCase(),
      follower_count: metrics.follower_count,
      subscriber_count: metrics.subscriber_count,
      profile_url: metrics.profile_url,
    });

    return {
      platform,
      ...metrics,
    };
  },
});

export const refreshAllPlatforms = action({
  args: {},
  handler: async (ctx) => {
    const platforms = [
      "twitter",
      "bluesky",
      "linkedin",
      "twitch",
      "youtube",
      "github",
    ];

    const results = await Promise.allSettled(
      platforms.map((platform) =>
        ctx.runAction(api.socials.refreshPlatform, { platform })
      )
    );

    const successful: string[] = [];
    const failed: Array<{ platform: string; error: string }> = [];

    results.forEach((result, index) => {
      const platform = platforms[index];
      if (result.status === "fulfilled") {
        successful.push(platform);
      } else {
        failed.push({
          platform,
          error:
            result.reason instanceof Error
              ? result.reason.message
              : String(result.reason),
        });
      }
    });

    return {
      successful,
      failed,
      total: platforms.length,
    };
  },
});

export const cleanupDuplicateSocials = action({
  args: {},
  handler: async (ctx): Promise<{ deleted: number; kept: number; total: number }> => {
    // Query all socials records
    const allSocials = await ctx.runQuery(api.socials.listSocials) as Doc<"socials">[];

    // Group by normalized platform name
    const groups = new Map<string, typeof allSocials>();
    for (const social of allSocials) {
      const normalized = normalizePlatformName(social.platform);
      if (!groups.has(normalized)) {
        groups.set(normalized, []);
      }
      groups.get(normalized)!.push(social);
    }

    let deleted = 0;
    let kept = 0;

    // Process each group
    for (const [normalizedPlatform, records] of groups.entries()) {
      if (records.length <= 1) {
        // No duplicates, just update platform name if needed
        const record = records[0];
        if (record && record.platform !== normalizedPlatform) {
          await ctx.runMutation(api.socials.updateSocialMetrics, {
            platform: normalizedPlatform,
            follower_count: record.follower_count,
            subscriber_count: record.subscriber_count,
            profile_url: record.profile_url,
            url: record.url,
          });
        }
        kept += records.length;
        continue;
      }

      // Find the record to keep (most recent last_updated, or highest _id if no timestamp)
      const recordToKeep = records.reduce((prev: Doc<"socials">, current: Doc<"socials">) => {
        const prevTime = prev.last_updated ?? 0;
        const currentTime = current.last_updated ?? 0;
        if (currentTime > prevTime) {
          return current;
        }
        if (currentTime === prevTime && current._id > prev._id) {
          return current;
        }
        return prev;
      });

      // Update the kept record with normalized platform name
      if (recordToKeep.platform !== normalizedPlatform) {
        await ctx.runMutation(api.socials.updateSocialMetrics, {
          platform: normalizedPlatform,
          follower_count: recordToKeep.follower_count,
          subscriber_count: recordToKeep.subscriber_count,
          profile_url: recordToKeep.profile_url,
          url: recordToKeep.url,
        });
      }

      // Delete all other duplicate records
      for (const record of records) {
        if (record._id !== recordToKeep._id) {
          await ctx.runMutation(api.socials.deleteSocial, { id: record._id });
          deleted++;
        }
      }

      kept++;
    }

    return {
      deleted,
      kept,
      total: allSocials.length,
    };
  },
});

// Twitch OAuth Token Management

export const storeTwitchTokens = mutation({
  args: {
    access_token: v.string(),
    refresh_token: v.string(),
    expires_at: v.number(),
    scope: v.string(),
    token_type: v.string(),
  },
  handler: async (ctx, args) => {
    // Find existing record (should only be one)
    const existing = await ctx.db.query("twitchOAuth").first();

    if (existing) {
      // Update existing record
      await ctx.db.patch(existing._id, {
        access_token: args.access_token,
        refresh_token: args.refresh_token,
        expires_at: args.expires_at,
        scope: args.scope,
        token_type: args.token_type,
      });
      return existing._id;
    } else {
      // Insert new record
      const id = await ctx.db.insert("twitchOAuth", {
        access_token: args.access_token,
        refresh_token: args.refresh_token,
        expires_at: args.expires_at,
        scope: args.scope,
        token_type: args.token_type,
      });
      return id;
    }
  },
});

export const getTwitchUserToken = query({
  args: {},
  handler: async (ctx) => {
    const token = await ctx.db.query("twitchOAuth").first();
    return token;
  },
});

export const refreshTwitchToken = action({
  args: {},
  handler: async (ctx): Promise<{ access_token: string; expires_at: number }> => {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      throw new Error(
        "TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET environment variables are required"
      );
    }

    // Get current token from database
    const currentToken = await ctx.runQuery(api.socials.getTwitchUserToken) as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      scope: string;
      token_type: string;
    } | null;
    if (!currentToken) {
      throw new Error("No Twitch token found in database");
    }

    // Refresh token
    const response = await fetch(
      "https://id.twitch.tv/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: currentToken.refresh_token,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Twitch token refresh error: ${response.status} ${response.statusText} - ${errorText}`
      );
    }

    const tokenData = await response.json() as {
      access_token: string;
      refresh_token?: string;
      expires_in: number;
      scope?: string;
      token_type?: string;
    };
    const expiresAt = Date.now() + tokenData.expires_in * 1000;

    // Store new tokens
    await ctx.runMutation(api.socials.storeTwitchTokens, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || currentToken.refresh_token,
      expires_at: expiresAt,
      scope: Array.isArray(tokenData.scope)
        ? tokenData.scope.join(" ")
        : (tokenData.scope || currentToken.scope),
      token_type: tokenData.token_type || "bearer",
    });

    return {
      access_token: tokenData.access_token,
      expires_at: expiresAt,
    };
  },
});

export const getValidTwitchUserToken = action({
  args: {},
  handler: async (ctx): Promise<string | null> => {
    const token = await ctx.runQuery(api.socials.getTwitchUserToken) as {
      access_token: string;
      refresh_token: string;
      expires_at: number;
      scope: string;
      token_type: string;
    } | null;
    if (!token) {
      return null;
    }

    // Check if token is expired or expiring soon (< 5 minutes)
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    if (token.expires_at < now + fiveMinutes) {
      // Token expired or expiring soon, refresh it
      try {
        const refreshed = await ctx.runAction(api.socials.refreshTwitchToken) as {
          access_token: string;
          expires_at: number;
        };
        return refreshed.access_token;
      } catch (error) {
        // If refresh fails, return null (user needs to re-authorize)
        console.error("Failed to refresh Twitch token:", error);
        return null;
      }
    }

    return token.access_token;
  },
});

// Twitch OAuth State Management

export const storeTwitchOAuthState = mutation({
  args: {
    state: v.string(),
    expires_at: v.number(),
  },
  handler: async (ctx, args) => {
    // Insert new state record
    const id = await ctx.db.insert("twitchOAuthState", {
      state: args.state,
      expires_at: args.expires_at,
    });
    return id;
  },
});

export const getTwitchOAuthState = query({
  args: {
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const stateRecord = await ctx.db
      .query("twitchOAuthState")
      .filter((q) => q.eq(q.field("state"), args.state))
      .first();
    return stateRecord;
  },
});

export const deleteTwitchOAuthState = mutation({
  args: {
    state: v.string(),
  },
  handler: async (ctx, args) => {
    const stateRecord = await ctx.db
      .query("twitchOAuthState")
      .filter((q) => q.eq(q.field("state"), args.state))
      .first();
    if (stateRecord) {
      await ctx.db.delete(stateRecord._id);
    }
  },
});