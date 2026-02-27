import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BlueskyProfileResponse = {
  handle?: string;
  followersCount?: number;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const actor = searchParams.get("actor")?.trim();

  if (!actor) {
    return NextResponse.json(
      { error: "Missing required query parameter: actor" },
      { status: 400 }
    );
  }

  const profileUrl = new URL(
    "https://public.api.bsky.app/xrpc/app.bsky.actor.getProfile"
  );
  profileUrl.searchParams.set("actor", actor);

  let lastError = "Unknown Bluesky error";

  for (let attempt = 0; attempt < 3; attempt++) {
    const response = await fetch(profileUrl.toString(), { cache: "no-store" });
    if (response.ok) {
      const data = (await response.json()) as BlueskyProfileResponse;
      return NextResponse.json(
        {
          follower_count: data.followersCount ?? 0,
          profile_url: `https://bsky.app/profile/${data.handle ?? actor}`,
        },
        { status: 200 }
      );
    }

    const errorText = await response.text();
    lastError = `${response.status} ${response.statusText} - ${errorText}`;
    const isRetryable =
      (response.status === 400 &&
        errorText.includes("A request body was provided when none was expected")) ||
      (response.status === 401 && errorText.includes("AuthMissing")) ||
      response.status >= 500;

    if (!isRetryable) {
      break;
    }
  }

  return NextResponse.json(
    { error: `Bluesky API error: ${lastError}` },
    { status: 502 }
  );
}
