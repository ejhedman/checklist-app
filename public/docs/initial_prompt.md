# Release Management Checklist App – Requirements Document

## 1. Overview

### 1.1 Purpose

The application helps engineering teams plan, track, and complete software releases by maintaining a structured checklist that captures **who** must do **what** by **when**.  It keeps a continuous timeline of past and future releases, always surfacing the *next* scheduled release so teams know exactly what requires attention.

### 1.2 Scope

* **In scope:** Web application (desktop‑first, responsive), user/team management, release & feature tracking, readiness status, role‑based access, and basic auditing.
* **Out of scope (v1):** Automated CI/CD integrations, notifications/alerts, API rate limiting, mobile‑native clients.

### 1.3 Goals & Success Metrics

| Goal                        | Metric                                                     |
| --------------------------- | ---------------------------------------------------------- |
| Reduce missed release tasks | ≥ 90 % releases reach **ready** ≥ 24 h before release date |
| Single source of truth      | 100 % release artifacts captured in app                    |
| Ease of onboarding          | New user completes profile & joins team in < 5 min         |

---

## 2. Stakeholders & Users

| Role                            | Description                                                      |
| ------------------------------- | ---------------------------------------------------------------- |
| **Release Manager**             | Owns overall release readiness; may create/edit/cancel releases. |
| **Developer / Config Engineer** | DRI for features; checks items as ready.                         |
| **Team Member**                 | Marks personal readiness.                                        |
| **Administrator**               | Manages users, teams, and system settings.                       |

***Assumption:*** All roles authenticate through Supabase Auth and are mapped via RLS (Row‑Level Security) policies.

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization

* Login via **Email + Password** or **GitHub OAuth** (Supabase Auth).
* Session persistence with JWT stored in `localStorage` (fallback: secure cookies).
* RLS policies enforce that users can only read/update:

  * Teams they belong to.
  * Releases that involve their teams.

### 3.2 User Management

* **CRUD** operations for users (admin‑only).
* Fields: `id`, `email` *(PK)*, `full_name`, `nickname`, `created_at`.
* A user may belong to **N** teams (many‑to‑many).

### 3.3 Team Management

* **Create, edit, delete** teams (admins & release managers).
* Fields: `id`, `name`, `description`.
* **Add / remove** users from a team.
* A user may appear in multiple teams.

### 3.4 Release Management

* **Create Release** – Supply: `name`, `target_date`, `platform_update` *(bool)*, `config_update` *(bool)*, assign ≥ 1 teams.
* **Update / cancel** release.
* **State machine** (derived; not editable): `pending`, `ready`, `past_due`, `complete`, `cancelled` (see § 4).
* **Delete** (hard‑delete) allowed only if state ≠ `complete`.

### 3.5 Feature Tracking

* Attach **Key Features** to a release.
* Fields: `id`, `release_id`, `name`, `jira_ticket`, `description`, `dri_user_id`, `is_platform` *(bool)*.
* DRI can toggle **“ready”** flag.

### 3.6 Readiness Tracking

* For each release+user pair store `is_ready` *(bool)*.
* Release enters **ready** state automatically when:

  * Every **Key Feature** is marked ready **AND**
  * Every **assigned user** is marked ready.

### 3.7 Navigation & Layout

* **Header** (sticky): logo left; auth buttons right.
* **Footer** (sticky): version link · copyright · help/feedback.
* **Sidebar** (vertical): icons – Home, Teams, Releases.
* **Main Panel**: routed content.

---

## 4. Business Rules & State Logic

| Release State | Definition                                                                    |
| ------------- | ----------------------------------------------------------------------------- |
| **pending**   | Earliest release with `target_date ≥ today` AND not ready/complete/cancelled. |
| **ready**     | *Pending* release **AND** readiness criteria met.                             |
| **past\_due** | *Pending* release **AND** `target_date < today` **AND** not ready.            |
| **complete**  | Manually set by release manager when deployed.                                |
| **cancelled** | Manually set by release manager.                                              |

Color codes (Tailwind classes suggested):

* `past_due` → `bg-red-500`
* `ready` → `bg-green-500`
* `pending` → `bg-yellow-300`
* `complete` → `bg-blue-500`
* Older/future (non‑next) → `bg-gray-200` / `bg-yellow-100`

“**Next release**” = `MIN(target_date)` where `target_date ≥ today` AND state ≠ `cancelled`.

---

## 5. Data Model (Supabase/PostgreSQL)

```
users              (id uuid PK, email text, full_name text, nickname text, created_at timestamptz)
teams              (id uuid PK, name text, description text)
team_users         (team_id FK→teams.id, user_id FK→users.id, PRIMARY KEY(team_id,user_id))
releases           (id uuid PK, name text, target_date date, platform_update bool, config_update bool, state text CHECK)
release_teams      (release_id FK→releases.id, team_id FK→teams.id, PRIMARY KEY(release_id,team_id))
features           (id uuid PK, release_id FK→releases.id, name text, jira_ticket text, description text, dri_user_id FK→users.id, is_platform bool, is_ready bool DEFAULT false)
user_release_state (release_id FK→releases.id, user_id FK→users.id, is_ready bool DEFAULT false, PRIMARY KEY(release_id,user_id))
```

All tables include `created_at`, `updated_at` for auditing.  RLS policies sample:

```sql
-- users can see releases if they belong to any assigned team
CREATE POLICY select_releases ON releases
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM release_teams rt
    JOIN team_users tu ON tu.team_id = rt.team_id
    WHERE rt.release_id = id AND tu.user_id = auth.uid()
  )
);
```

---

## 6. Non‑Functional Requirements

| Category          | Requirement                                                                      |
| ----------------- | -------------------------------------------------------------------------------- |
| **Tech Stack**    | Next.js 14 (App Router), Tailwind CSS, shadcn/ui components, Supabase client v2. |
| **Hosting**       | Supabase project (DB + Auth + Edge), Vercel (frontend).                          |
| **Performance**   | < 200 ms *TTFB* for authenticated pages.                                         |
| **Scalability**   | Designed for 100 teams, 10 000 users, 1 000 releases/year.                       |
| **Security**      | HTTPS enforced; OWASP Top‑10 mitigations; JWT expiry 1 h.                        |
| **Accessibility** | WCAG 2.1 AA color contrast; keyboard‑navigable sidebar.                          |
| **Testing**       | Vitest (unit), Playwright (e2e).                                                 |
| **CI/CD**         | GitHub Actions → Vercel Preview / Prod.                                          |

---

## 7. UI/UX Specifications

1. **Teams View**

   * Tree‑view list; icons: ➕ add, ✏️ edit, 🗑️ delete.
   * Add Team Modal → fields name, description.
2. **Releases View**

   * List ordered by `target_date` asc; color‑coded rows.
   * Click row → Release Detail Card.
3. **Release Detail Card**

   * Header shows name, date, checkboxes (platform/config).
   * Tabs: *Overview*, *Features*, *Team Readiness*.
   * Feature tab → table with DRI, ready checkbox.
   * Team tab → list all users with readiness checkbox.

---

## 8. API Endpoints (Next.js Route Handlers)

| Method   | Path                                 | Auth    | Purpose                       |
| -------- | ------------------------------------ | ------- | ----------------------------- |
| `GET`    | `/api/releases`                      | user    | List releases visible to user |
| `POST`   | `/api/releases`                      | manager | Create release                |
| `PATCH`  | `/api/releases/:id`                  | manager | Update release                |
| `DELETE` | `/api/releases/:id`                  | manager | Cancel/delete release         |
| `PATCH`  | `/api/features/:id/ready`            | dri     | Toggle feature ready          |
| `PATCH`  | `/api/user-release/:releaseId/ready` | user    | Toggle user ready             |

Supabase client queries may replace explicit APIs where RLS suffices.

---

## 9. Open Questions & Assumptions

1. **Notifications** – Email or Slack alerts when release turns `past_due`?  *Not in v1.*
2. **Historical Audit** – Do we need full audit trail of checkbox changes?  *Assume yes, via `updated_at` + logs table.*
3. **Custom Roles** – Are roles fixed or configurable?  *Assume fixed for v1.*
4. **Time Zones** – Use project‑level default (UTC) with client‑side display in local TZ.
5. **Import/Export** – CSV export of releases?  *Backlog item.*

---

## 10. Roadmap (Proposed)

| Phase    | Scope                                                |
| -------- | ---------------------------------------------------- |
| **MVP**  | Auth, Teams, Releases, Features, Readiness, Color UI |
| **v1.1** | Notifications, search/filter, pagination             |
| **v1.2** | CI/CD integration hooks, API keys                    |

---

**End of Document**
