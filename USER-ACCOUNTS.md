# User Accounts & Role-Based Access

Sip Station POS & IBMS uses **Supabase Auth** for authentication. There is no
self-registration — accounts are created by the administrator only.

## Default Accounts

Created by `server/scripts/create-users.js` (or the equivalent SQL script).

| Username  | Email                   | Password      | Role      |
|-----------|-------------------------|---------------|-----------|
| `admin`   | admin@sipstation.com    | `Admin@2026`  | `owner`   |
| `manager` | manager@sipstation.com  | `Manager@2026`| `manager` |

> **Change these passwords immediately after first login.** They are only
> intended for initial setup.

### Logging in

- The login form accepts either the **username** (`admin`, `manager`) or the
  full **email**. Usernames are resolved to the `@sipstation.com` domain.
- Authentication is handled by `supabase.auth.signInWithPassword()` — sessions
  persist across reloads and refresh automatically.

## Roles

### `owner` — CEO / Administrator

Full, unrestricted access to every module. Only the owner can:

- Create, edit, deactivate, or delete user accounts
- Change roles (`app_metadata.role` — set server-side only, never by the client)
- Access **Payroll** and **Staff** management
- Use admin endpoints on the backend (e.g. `GET /admin/users` on Render)

### `manager` — Store Manager

Covers the combined **barista + cashier** duties common in POS/inventory
systems — all day-to-day operations:

| Module | Access |
|---|---|
| Dashboard | ✅ Full |
| POS (cashier) | ✅ Full |
| Products / Recipes | ✅ Full |
| Inventory / Ingredients / Stock Transactions | ✅ Full (barista duties) |
| Suppliers | ✅ Full |
| Sales & Reports | ✅ View & operate |
| Attendance / Schedule | ✅ Full (approve, manage shifts) |
| Expenses | ✅ Full |
| Payroll | ✅ Full |
| Staff / User management | ❌ Owner only |

**Rule of thumb:** the manager runs daily operations; money-out and
people-control stay with the CEO.

## How enforcement works

| Layer | Mechanism |
|---|---|
| Login | `signIn()` in `sipss-react/src/utils/auth.ts` — verifies credentials via Supabase, rejects accounts with no role or `is_active = false` |
| Role source | `app_metadata.role` JWT claim (tamper-proof, set only via the Admin API) |
| Navigation | `canAccess()` / `allowedViews()` in `auth.ts`; `OWNER_ONLY_VIEWS = ['payroll', 'staff']` filters sidebar items and guards routes in `App.tsx` |
| Database | Row Level Security policies in `server/schema.sql` check `auth.jwt() -> 'app_metadata' ->> 'role'` |
| Backend | `ownerOnly` middleware in `server/index.js` for privileged routes |

## Key files

- `server/scripts/create-users.js` — creates the two accounts via the Admin API
- `server/schema.sql` — `profiles` table + RLS policies
- `sipss-react/src/utils/auth.ts` — sign-in, session, role helpers, access matrix
- `sipss-react/src/App.tsx` — `handleLogin`, session restore, role-guarded views
