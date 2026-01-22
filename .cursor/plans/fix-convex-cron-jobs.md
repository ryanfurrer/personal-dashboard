---
name: Fix Convex Cron Jobs Not Firing + Rename Sync to Refresh
overview: Rename convex/cron.ts to convex/crons.ts and rename all "sync" references to "refresh" throughout the codebase
todos:
  - id: rename-cron-file
    content: Rename convex/cron.ts to convex/crons.ts to match Convex naming requirements
    status: pending
  - id: rename-sync-functions
    content: Rename syncPlatform → refreshPlatform and syncAllPlatforms → refreshAllPlatforms in convex/socials.ts
    status: pending
  - id: rename-sync-variables
    content: Rename all sync-related variables and state in components/socials.tsx (syncAll, syncingAll, syncAllResult, handleSyncAll, handleSyncPlatform, etc.)
    status: pending
  - id: rename-http-routes
    content: Rename /api/socials/sync → /api/socials/refresh in convex/http.ts
    status: pending
  - id: rename-cron-job-name
    content: Update cron job name from "sync-all-social-platforms" to "refresh-all-social-platforms" in crons.ts
    status: pending
  - id: rename-ui-text
    content: Update UI text from "Sync" to "Refresh" in components/socials.tsx (button labels, error messages, etc.)
    status: pending
  - id: rename-comments
    content: Update all comments mentioning "sync" to "refresh" across all files
    status: pending
---

## Problem

1. The scheduled cron job configured to run `syncAllPlatforms` at 00:00 UTC daily is not firing because Convex requires cron jobs to be defined in a file named `convex/crons.ts` (plural), but the current file is named `convex/cron.ts` (singular).

2. User requested renaming all "sync" terminology to "refresh" for consistency.

## Solution

### 1. Fix Cron File Naming

Rename the cron file to match Convex's expected naming convention:
- `convex/cron.ts` → `convex/crons.ts`
- Update cron job name: `"sync-all-social-platforms"` → `"refresh-all-social-platforms"`
- Update comment: "Daily sync" → "Daily refresh"

### 2. Rename Functions and Actions

**File: `convex/socials.ts`**
- `syncPlatform` → `refreshPlatform`
- `syncAllPlatforms` → `refreshAllPlatforms`
- Update comment: `// Sync Actions` → `// Refresh Actions`

### 3. Rename HTTP Routes

**File: `convex/http.ts`**
- Route path: `/api/socials/sync` → `/api/socials/refresh` (both POST and OPTIONS routes)
- Update comments: "Manual sync trigger" → "Manual refresh trigger"
- Update response message: "Sync initiated" → "Refresh initiated"
- Update platform exclusion check: `platform === "sync"` → `platform === "refresh"`

### 4. Rename Variables and State

**File: `components/socials.tsx`**
- `syncAll` → `refreshAll`
- `syncPlatform` → `refreshPlatform` (variable)
- `syncingAll` → `refreshingAll`
- `syncingPlatform` → `refreshingPlatform`
- `syncAllResult` → `refreshAllResult`
- `handleSyncAll` → `handleRefreshAll`
- `handleSyncPlatform` → `handleRefreshPlatform`
- `isSyncing` → `isRefreshing`

### 5. Rename UI Text

**File: `components/socials.tsx`**
- Button text: "Refresh All" (already correct, but ensure handler name matches)
- Success message: "Synced" → "Refreshed"
- Error dialog title: "Sync Errors" → "Refresh Errors"
- Error dialog description: "failed to sync" → "failed to refresh"
- Error dialog title: "Sync Error" → "Refresh Error"
- Console logs: "Failed to sync" → "Failed to refresh"

### 6. Update Cron Job Reference

**File: `convex/crons.ts` (after rename)**
- Update action reference: `api.socials.syncAllPlatforms` → `api.socials.refreshAllPlatforms`
- Update comment: "Daily sync" → "Daily refresh"

## Files to Modify

1. **Rename**: `convex/cron.ts` → `convex/crons.ts`
2. **Update**: `convex/crons.ts` - Update job name, comment, and action reference
3. **Update**: `convex/socials.ts` - Rename functions and update comments
4. **Update**: `convex/http.ts` - Rename route paths and update comments/messages
5. **Update**: `components/socials.tsx` - Rename all variables, functions, and UI text

## Verification

After changes:
- Cron job should appear in Convex dashboard with name "refresh-all-social-platforms"
- Scheduled job will execute daily at 00:00 UTC calling `refreshAllPlatforms`
- HTTP endpoint `/api/socials/refresh` should work for manual triggers
- UI buttons and messages should say "Refresh" instead of "Sync"
- All function calls and references should use "refresh" terminology
