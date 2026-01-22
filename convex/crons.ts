import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Daily refresh at 00:00 UTC (midnight)
crons.daily(
  "refresh-all-social-platforms",
  {
    hourUTC: 0, // Midnight UTC
    minuteUTC: 0,
  },
  api.socials.refreshAllPlatforms
);

export default crons;
