import { query, action } from "./_generated/server";

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