import { cronJobs } from "convex/server";
import { api } from "./_generated/api";

const crons = cronJobs();

// Daily refresh at 00:00 EDT / 01:00 EST (04:00 / 05:00 UTC)
crons.daily(
  "refresh-all-social-platforms",
  {
    hourUTC: 5,
    minuteUTC: 0,
  },
  api.socials.refreshAllPlatforms,
);

export default crons;
