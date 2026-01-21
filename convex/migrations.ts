import { Migrations } from "@convex-dev/migrations";
import { components, internal } from "./_generated/api.js";
import { DataModel } from "./_generated/dataModel.js";

export const migrations = new Migrations<DataModel>(components.migrations);

// Example migration: Add default values for new optional fields
// Uncomment and modify when you need to migrate existing data
// export const addLastUpdatedField = migrations.define({
//   table: "socials",
//   migrateOne: async (ctx, doc) => {
//     if (doc.last_updated === undefined) {
//       await ctx.db.patch(doc._id, {
//         last_updated: Date.now(),
//       });
//     }
//   },
// });

// Run a specific migration (requires {fn: "migrations:name"} parameter)
export const run = migrations.runner();

// Run all migrations serially (add migrations to array as you define them)
export const runAll = migrations.runner([
  // Add migrations here as you define them, e.g.:
  // internal.migrations.addLastUpdatedField,
  // internal.migrations.anotherMigration,
]);
