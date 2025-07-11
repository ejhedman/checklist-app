# Dynamic Release State Management

This document describes how the **dynamic state** of a release is determined, displayed, managed, and what it means in the context of the application. The dynamic state is not stored in the database, but is computed in real time based on other fields.

---

## 1. **What is the Dynamic State?**

The **dynamic state** of a release is a computed value that represents the current lifecycle status of a release. It is used throughout the UI to drive badges, icons, available actions, and filtering. The state is not persisted in the database, but is derived from other release fields such as `target_date`, `is_cancelled`, and `is_deployed`.

### **Possible States**
- `pending`: The release is scheduled for a future date, is not the next upcoming release, and is neither cancelled nor deployed.
- `next`: The release is the next upcoming release (by target date), is not cancelled or deployed, and its target date is today or in the future.
- `past_due`: The release's target date is in the past, and it is not cancelled or deployed.
- `cancelled`: The release has been cancelled (`is_cancelled = true`).
- `deployed`: The release has been deployed (`is_deployed = true`).

---

## 2. **How is Dynamic State Determined?**

The dynamic state is computed using the following logic (in order):

1. **Cancelled:**
   - If `is_cancelled` is `true`, state is `cancelled`.
2. **Deployed:**
   - If `is_deployed` is `true`, state is `deployed`.
3. **Past Due:**
   - If the release's `target_date` is before today, state is `past_due`.
4. **Next:**
   - Among all releases that are not cancelled or deployed, the one with the earliest `target_date` that is today or in the future is `next`.
5. **Pending:**
   - All other releases are `pending`.

This logic is implemented in utility functions and hooks throughout the codebase, and is used consistently for all state-dependent UI and logic.

---

## 3. **Where is Dynamic State Used?**

- **Badges:**
  - The state is shown as a colored badge on release cards and detail views.
- **Icons & Actions:**
  - The availability and enabled/disabled state of action icons (edit, deploy, archive, etc.) depend on the dynamic state.
- **Filtering & Sorting:**
  - Release lists and dashboards use the dynamic state to group, filter, and sort releases.
- **Calendar:**
  - The calendar view uses dynamic state to highlight and style releases.

---

## 4. **How is Dynamic State Managed?**

- **No Database Field:**
  - The state is never written to or read from the database. It is always computed on the fly.
- **Centralized Calculation:**
  - Calculation logic is centralized in utility functions (e.g., `calculateDynamicState`) and hooks, ensuring consistency across the app.
- **Automatic Updates:**
  - Any change to `target_date`, `is_cancelled`, or `is_deployed` will automatically update the computed state everywhere it is used.

---

## 5. **Why Use a Dynamic State?**

- **Single Source of Truth:**
  - Avoids desynchronization between stored and computed state.
- **Simplicity:**
  - Reduces the need for extra database writes and migration logic.
- **Flexibility:**
  - Allows the state logic to evolve without requiring schema changes or data migrations.

---

## 6. **Example Calculation**

Suppose today is 2024-12-20:

| Release Name | Target Date | is_cancelled | is_deployed | Dynamic State |
|--------------|-------------|--------------|-------------|---------------|
| Alpha        | 2024-12-19  | false        | false       | past_due      |
| Beta         | 2024-12-20  | false        | false       | next          |
| Gamma        | 2024-12-21  | false        | false       | pending       |
| Delta        | 2024-12-22  | true         | false       | cancelled     |
| Epsilon      | 2024-12-23  | false        | true        | deployed      |

---

## 7. **Code Reference**

- **Dynamic State Calculation:**
  - See `calculateDynamicState` in `src/app/calendar/page.tsx` and similar logic in `src/hooks/useReleases.ts`.
- **Badge Display:**
  - See `getStateBadgeConfig` and `getStateDisplayText` in `src/lib/state-colors.ts`.
- **ReleaseSummaryCard:**
  - See `src/components/releases/ReleaseSummaryCard.tsx` for how state is used to control UI.

---

## 8. **Summary**

The dynamic state is a core concept for release lifecycle management in the app. It is always up-to-date, never stale, and drives all state-dependent UI and logic. Any changes to the underlying fields are immediately reflected in the computed state throughout the application. 