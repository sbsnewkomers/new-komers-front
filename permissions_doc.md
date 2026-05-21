🔐 In front‑end development, managing permissions is key to ensuring users can access only the features they are allowed to.

This project exposes **three main tools**:

- **`withAuth` HOC** – require a logged-in session (authentication)
- **`withPermissions` HOC** – require specific grants (authorization)
- **`usePermissions` hook** – to check permissions **inside components**

Everything lives under:

- `src/permissions/`
  - `actions.ts` – enums and helpers
  - `types.ts` – shared types
  - `evaluator.ts` – logic for `and / or / not`
  - `PermissionsProvider.tsx` – React context (already wired in `_app.tsx`)
  - `usePermissions.ts` – React hook
  - `withAuth.tsx` – authentication HOC
  - `withPermissions.tsx` – authorization HOC

The provider is already registered globally in `src/pages/_app.tsx`, so you can use the hook/HOC directly.

---

## 1. Concepts

- **Entity / node type**
  - We work with backend node types: `GROUP`, `COMPANY`, `BUSINESS_UNIT`.
  - In the front you can pass strings like `"groups"` / `"companies"` / `"business-units"` and they will be mapped.

- **Actions**
  - **UI‑level** (`CRUD_ACTION` enum):
    - `CREATE`, `READ`, `UPDATE`, `DELETE`
  - **Backend‑level** (`PermissionAction` enum – mirrors Nest backend):
    - `READONE`, `READALL`, `CREATE`, `UPDATE`, `DELETE`
  - When you use `CRUD_ACTION.READ`, the system accepts either `READALL` or `READONE`.

- **Grants**
  - A **grant** describes what the current user can do on which node:
    - `{ nodeType: 'COMPANY', action: PermissionAction.CREATE, nodeId?: string }`
  - These are stored in memory by the `PermissionsProvider`.
  - You will typically fill them after calling your backend (see section 4).

- **Logical operations**
  - `and`: all conditions must be true
  - `or`: at least one condition must be true
  - `not`: inverts the result of a condition

---

## 2. `withAuth` HOC (authentication)

**What it does**

- Wraps a page and ensures the user is **logged in** (`user` from `/auth/me` after bootstrap).
- If not authenticated, redirects to **login** (default `/login`) and saves the current path for post-login redirect (`nk-return-to` in `localStorage` + `returnTo` query param).
- Optional **`guestOnly`** mode for public auth pages (login, forgot-password): redirects authenticated users away (default `/dashboard`).

**Difference vs `withPermissions`**

| | `withAuth` | `withPermissions` |
| --- | --- | --- |
| Question | Is the user logged in? | Does the user have the required grants? |
| Denied redirect | `/login?returnTo=...` | `/403` |

Use **both** on sensitive pages: wrap `withAuth` **outside** `withPermissions` so anonymous users go to login, not 403.

**Signature**

```ts
withAuth(Page, {
  redirectUrl?: string;              // default: "/login"
  saveReturnTo?: boolean;            // default: true
  guestOnly?: boolean;               // default: false
  redirectIfAuthenticated?: string;  // default: "/dashboard" (when guestOnly)
});
```

**Protected page example**

```tsx
import { withAuth } from "@/permissions/withAuth";

function DashboardPage() {
  return <div>Dashboard</div>;
}

export default withAuth(DashboardPage);
```

**Stacked with `withPermissions`**

```tsx
import { withAuth } from "@/permissions/withAuth";
import { withPermissions } from "@/permissions/withPermissions";
import { PermissionAction as PermissionActionEnum } from "@/permissions/actions";
import { Entity } from "@/permissions/types";

function UsersPage() {
  return <div>Users</div>;
}

export default withAuth(
  withPermissions(UsersPage, {
    requiredPermissions: {
      entity: Entity.USERS,
      action: PermissionActionEnum.READ_ALL,
    },
    redirectUrl: "/403",
  }),
);
```

Or with `composePageGuards` (same order: auth first, then permissions):

```tsx
import { withAuth, composePageGuards } from "@/permissions/withAuth";
import { withPermissions } from "@/permissions/withPermissions";
import { PermissionAction as PermissionActionEnum } from "@/permissions/actions";
import { Entity } from "@/permissions/types";

export default composePageGuards(
  UsersPage,
  (page) => withAuth(page),
  (page) =>
    withPermissions(page, {
      requiredPermissions: { entity: Entity.USERS, action: PermissionActionEnum.READ_ALL },
    }),
);
```

**Guest-only pages (login, forgot-password)**

```tsx
import { withAuth } from "@/permissions/withAuth";

function LoginPage() {
  return <div>Login form</div>;
}

export default withAuth(LoginPage, { guestOnly: true });
```

**Queries inside authenticated pages**

Use `useAuthEnabled()` from `src/queries/useAuthEnabled.ts` so React Query only runs when `isAuthReady && accessToken`:

```tsx
const enabled = useAuthEnabled();
const { data } = useQuery({ queryKey: ["x"], queryFn: fetchX, enabled });
```

> Pages that use **only** `withPermissions` should also add `withAuth` outside, or unauthenticated visitors may be sent to `/403` instead of `/login`.

### Impersonation (“login as”)

`withAuth` checks `!!user` from `PermissionsProvider`. Impersonation swaps tokens and reloads `/auth/me`, so `user` is the **target** account (with `impersonatorId` when applicable).

- Impersonated sessions are **authenticated** → `withAuth` pages render normally.
- Stacked `withPermissions` evaluates the **target** grants and role (admin bypass applies only if the target is `SUPER_ADMIN` / `ADMIN`).
- After `impersonate()`, always `await` it before navigation so grants match the new session.

---

## 3. `withPermissions` HOC (protecting pages/components)

**What it does**

- Wraps a page or component.
- Evaluates a **permission requirement** (`and / or / not` supported).
- If the user is **not allowed**, it redirects to a **403 page** (by default `/403`).

**Signature**

```ts
withPermissions(Page, {
  requiredPermissions: PermissionRequirement;
  redirectUrl?: string; // default: "/403"
});
```

**Simple example (single permission)**

```tsx
// src/pages/companies/index.tsx
import { withPermissions } from "@/permissions/withPermissions";
import { CRUD_ACTION } from "@/permissions/actions";

function CompaniesPage() {
  return <div>Companies list</div>;
}

export default withPermissions(CompaniesPage, {
  requiredPermissions: {
    entity: "companies",
    action: CRUD_ACTION.READ,
  },
  // redirectUrl: "/403", // optional, default is /403
});
```

Here:

- `entity: "companies"` → maps to backend node type `COMPANY`.
- `CRUD_ACTION.READ` → maps to backend actions `READALL` or `READONE`.

**Example with logical operations (`and` / `or` / `not`)**

```tsx
import { withPermissions } from "@/permissions/withPermissions";
import { CRUD_ACTION } from "@/permissions/actions";

function UsersPage() {
  return <div>Users</div>;
}

export default withPermissions(UsersPage, {
  requiredPermissions: {
    or: [
      {
        and: [
          { entity: "companies", action: CRUD_ACTION.READ },
          { entity: "companies", action: CRUD_ACTION.CREATE },
        ],
      },
      { entity: "companies", action: CRUD_ACTION.UPDATE },
      {
        not: { entity: "companies", action: CRUD_ACTION.DELETE },
      },
    ],
  },
  redirectUrl: "/403",
});
```

Interpretation:

- User must:
  - either **READ and CREATE** on `companies` (both),
  - or **UPDATE** on `companies`,
  - or **not have DELETE** on `companies`.

> ℹ️ **Role shortcut**: `SUPER_ADMIN` and `ADMIN` are always allowed (shortcut in the permissions logic).

---

## 4. `usePermissions` hook (inside components)

**What it does**

- Lets you check permissions **inside a component**.
- Exposes:
  - `can(entityOrNodeType, action, nodeId?)`
  - `cannot(entityOrNodeType, action, nodeId?)`
  - `has(requiredRequirement)` – uses full `and / or / not` tree
  - plus helpers/state: `user`, `role`, `grants`, `setGrants`, `refreshMe`, `isLoading`.

**Basic usage**

```tsx
import { usePermissions } from "@/permissions/usePermissions";
import { CRUD_ACTION } from "@/permissions/actions";

const CompanyActions = () => {
  const { can } = usePermissions();

  const canCreateCompany = can("companies", CRUD_ACTION.CREATE);

  return (
    <div>
      {canCreateCompany && <button>Create company</button>}
    </div>
  );
};
```

**Using `cannot`**

```tsx
const { cannot } = usePermissions();

if (cannot("companies", CRUD_ACTION.DELETE)) {
  // Hide dangerous buttons or show a warning
}
```

**Using a complex requirement with `has`**

```tsx
import { usePermissions } from "@/permissions/usePermissions";
import { CRUD_ACTION } from "@/permissions/actions";

const SensitivePanel = () => {
  const { has } = usePermissions();

  const allowed = has({
    and: [
      { entity: "companies", action: CRUD_ACTION.READ },
      {
        or: [
          { entity: "companies", action: CRUD_ACTION.UPDATE },
          { entity: "companies", action: CRUD_ACTION.CREATE },
        ],
      },
    ],
  });

  if (!allowed) return null;

  return <div>Very sensitive data here</div>;
};
```

---

## 5. Where do permissions (`grants`) come from?

Right now, the frontend **does not automatically fetch** all node permissions. Instead:

- It knows how to **evaluate** permissions (using the enums and logic).
- It expects you to **fill `grants`** (list of `PermissionGrant`) from your backend responses.

You have two common options:

1. **Dedicated endpoint** (recommended later)
   - Create a backend endpoint like `/permissions/me` that returns:
     ```json
     [
       { "nodeType": "COMPANY", "action": "READALL", "nodeId": "..." },
       { "nodeType": "COMPANY", "action": "CREATE" }
     ]
     ```
   - In the frontend, call it once (e.g. in a layout) and then:
     ```ts
     const { setGrants } = usePermissions();
     setGrants(responseFromApi);
     ```

2. **Include permissions in existing endpoints**
   - For example, when calling `/companies`, backend can return each company plus the current user’s allowed actions.
   - You can then **derive** `PermissionGrant[]` from that payload and call `setGrants`.

> ✅ Already available: `PermissionsProvider` exposes `setGrants` and `refreshMe` (which calls `/auth/me` to refresh user info).

---

## 6. Environment / API base URL

- API calls from the permissions layer use `src/lib/apiClient.ts`.
- It reads an **optional** `NEXT_PUBLIC_API_BASE_URL` environment variable for the backend base URL.
- Example value (you must set this yourself in `.env` files if needed):
  - `NEXT_PUBLIC_API_BASE_URL=http://localhost:3001`

> ⚠️ As per project rules, environment files (`.env`) are **not edited by this doc**.  
> If it is missing, ask a maintainer where the backend is hosted and set `NEXT_PUBLIC_API_BASE_URL` accordingly.

---

## 7. Quick recipe for beginners

1. **Require login on a page**
   - Import `withAuth` and wrap the page export.

2. **Require specific permissions**
   - Stack `withAuth(withPermissions(Page, { requiredPermissions: ... }))`.
   - Describe requirements with `entity` + `CRUD_ACTION` (or backend `PermissionAction`).

3. **Show/hide UI pieces**
   - Use `usePermissions()` inside components.
   - Check `can()` / `cannot()` before rendering sensitive actions (buttons, links, sections).

4. **Hook up real data later**
   - Once the backend returns actual permissions, map them into `PermissionGrant[]`.
   - Call `setGrants()` once (e.g. in a layout or after login) so everything uses real data.