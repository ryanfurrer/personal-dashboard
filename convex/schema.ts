import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Other tables here...

  habitCategories: defineTable({
    name: v.string(),
    display_name: v.string(),
    created_at: v.number(),
    updated_at: v.number(),
  }).index("by_name", ["name"]),

  habits: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    start_date: v.string(), // YYYY-MM-DD local date
    frequency_type: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
    ),
    target_count: v.float64(),
    selected_weekdays: v.optional(v.array(v.float64())), // Monday=1 ... Sunday=7
    category_id: v.optional(v.id("habitCategories")),
    status: v.union(
      v.literal("active"),
      v.literal("archived"),
      v.literal("deleted"),
    ),
    created_at: v.number(),
    updated_at: v.number(),
    archived_at: v.optional(v.number()),
    deleted_at: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category_id"])
    .index("by_start_date", ["start_date"])
    .index("by_status_category", ["status", "category_id"]),

  habitCompletions: defineTable({
    habit_id: v.id("habits"),
    completed_at: v.number(),
    local_date: v.string(), // YYYY-MM-DD local date
    period_key: v.string(), // D:YYYY-MM-DD, W:YYYY-Www, M:YYYY-MM
    count: v.float64(),
    is_streak_eligible: v.boolean(),
    created_at: v.number(),
  })
    .index("by_habit", ["habit_id"])
    .index("by_habit_local_date", ["habit_id", "local_date"])
    .index("by_habit_period", ["habit_id", "period_key"]),

  tasks: defineTable({
    title: v.string(),
    notes: v.optional(v.string()),
    due_date: v.optional(v.string()), // YYYY-MM-DD local date
    is_completed: v.boolean(),
    status: v.union(v.literal("active"), v.literal("deleted")),
    created_at: v.number(),
    updated_at: v.number(),
    deleted_at: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_status_completed", ["status", "is_completed"])
    .index("by_due_date", ["due_date"]),

  socials: defineTable({
    follower_count: v.float64(), // Free tier metric (all platforms)
    platform: v.string(),
    url: v.string(),
    // New optional fields:
    subscriber_count: v.optional(v.float64()), // Paid tier metric (Twitch only)
    profile_url: v.optional(v.string()), // Explicit profile URL
    last_updated: v.optional(v.number()), // Unix timestamp
  }).index("by_platform", ["platform"]),

  twitchOAuth: defineTable({
    access_token: v.string(),
    refresh_token: v.string(),
    expires_at: v.number(), // Unix timestamp
    scope: v.string(), // Space-delimited scopes
    token_type: v.string(), // "bearer"
  }),

  twitchOAuthState: defineTable({
    state: v.string(), // The state string
    expires_at: v.number(), // Unix timestamp when state expires
  }),
});
