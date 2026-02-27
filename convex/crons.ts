import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Run hourly at minute 0; action gates execution to 00:00 America/New_York.
crons.interval(
  "refresh-all-social-platforms-eastern-midnight",
  { hours: 1 },
  api.socials.refreshAllPlatformsAtEasternMidnight
);

export default crons;
