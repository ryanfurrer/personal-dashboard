"use client";

import dynamic from "next/dynamic";

// Lazy-load socials section to reduce initial bundle size (recharts is heavy).
// Must be in a Client Component to use ssr: false.
const SocialPlatformCardSection = dynamic(
  () => import("./social-platform-card-section"),
  { ssr: false }
);

export default function SocialPlatformCardSectionDynamic() {
  return <SocialPlatformCardSection />;
}
