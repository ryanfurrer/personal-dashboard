import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api } from "./_generated/api";

const http = httpRouter();

// CORS headers helper
function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

// Generate random state string for CSRF protection
function generateState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// GET /api/twitch/auth - Initiate OAuth flow
http.route({
  path: "/api/twitch/auth",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const clientId = process.env.TWITCH_CLIENT_ID;
    if (!clientId) {
      return new Response("TWITCH_CLIENT_ID not configured", { status: 500 });
    }

    const state = generateState();
    const redirectUri = "https://aware-chihuahua-335.convex.site/api/twitch/callback";
    
    // Store state with timestamp (expires in 10 minutes) in database
    const expiresAt = Date.now() + 10 * 60 * 1000;
    await ctx.runMutation(api.socials.storeTwitchOAuthState, {
      state,
      expires_at: expiresAt,
    });

    const authUrl = new URL("https://id.twitch.tv/oauth2/authorize");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "channel:read:subscriptions");
    authUrl.searchParams.set("state", state);

    return Response.redirect(authUrl.toString(), 302);
  }),
});

// GET /api/twitch/callback - Handle OAuth callback
http.route({
  path: "/api/twitch/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const clientId = process.env.TWITCH_CLIENT_ID;
    const clientSecret = process.env.TWITCH_CLIENT_SECRET;
    if (!clientId || !clientSecret) {
      return new Response("Twitch OAuth not configured", { status: 500 });
    }

    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");

    if (error) {
      return new Response(
        `OAuth error: ${error}`,
        { status: 400 }
      );
    }

    if (!code || !state) {
      return new Response("Missing code or state parameter", { status: 400 });
    }

    // Validate state (CSRF protection) from database
    const stateRecord = await ctx.runQuery(api.socials.getTwitchOAuthState, { state });
    if (!stateRecord || stateRecord.expires_at < Date.now()) {
      // Clean up expired/invalid state
      if (stateRecord) {
        await ctx.runMutation(api.socials.deleteTwitchOAuthState, { state });
      }
      return new Response("Invalid or expired state parameter", { status: 400 });
    }
    
    // Delete state after validation (one-time use)
    await ctx.runMutation(api.socials.deleteTwitchOAuthState, { state });

    // Exchange authorization code for tokens
    const tokenResponse = await fetch("https://id.twitch.tv/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: "authorization_code",
        redirect_uri: "https://aware-chihuahua-335.convex.site/api/twitch/callback",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return new Response(
        `Token exchange failed: ${tokenResponse.status} ${errorText}`,
        { status: 500 }
      );
    }

    const tokenData = await tokenResponse.json();
    const expiresAt = Date.now() + tokenData.expires_in * 1000;

    // Store tokens in database
    await ctx.runMutation(api.socials.storeTwitchTokens, {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_at: expiresAt,
      scope: Array.isArray(tokenData.scope)
        ? tokenData.scope.join(" ")
        : (tokenData.scope || "channel:read:subscriptions"),
      token_type: tokenData.token_type || "bearer",
    });

    // Redirect to success page
    return Response.redirect("https://ryanfurrer.com/?twitch_auth=success", 302);
  }),
});

// GET /api/socials - Return all social metrics as JSON
http.route({
  path: "/api/socials",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const socials = await ctx.runQuery(api.socials.listSocials);
    
    return new Response(JSON.stringify(socials), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(),
      },
    });
  }),
});

// OPTIONS /api/socials - CORS preflight
http.route({
  path: "/api/socials",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }),
});

// POST /api/socials/refresh - Manual refresh trigger
// Register before prefix route to avoid matching /api/socials/refresh as a platform
http.route({
  path: "/api/socials/refresh",
  method: "POST",
  handler: httpAction(async (ctx) => {
    try {
      await ctx.runAction(api.socials.refreshAllPlatforms);
      
      return new Response(JSON.stringify({ success: true, message: "Refresh initiated" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(),
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      return new Response(JSON.stringify({ success: false, error: errorMessage }), {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(),
        },
      });
    }
  }),
});

// OPTIONS /api/socials/refresh - CORS preflight
http.route({
  path: "/api/socials/refresh",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }),
});

// GET /api/socials/:platform - Get specific platform metrics
// Using pathPrefix to match dynamic platform names
http.route({
  pathPrefix: "/api/socials/",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    // Extract platform from path: /api/socials/twitter -> "twitter"
    const platform = url.pathname.replace("/api/socials/", "").toLowerCase();
    
    // Exclude "refresh" from platform matching (handled by exact route above)
    if (!platform || platform === "refresh") {
      return new Response(JSON.stringify({ error: "Platform parameter required" }), {
        status: 400,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(),
        },
      });
    }

    const socials = await ctx.runQuery(api.socials.listSocials);
    const platformData = socials.find((s) => s.platform.toLowerCase() === platform);
    
    if (!platformData) {
      return new Response(JSON.stringify({ error: `Platform '${platform}' not found` }), {
        status: 404,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(),
        },
      });
    }
    
    return new Response(JSON.stringify(platformData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders(),
      },
    });
  }),
});

// OPTIONS /api/socials/:platform - CORS preflight
http.route({
  pathPrefix: "/api/socials/",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }),
});

export default http;
