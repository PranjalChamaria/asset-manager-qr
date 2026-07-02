# Migration Plan: Supabase to SQLite

## 1. Current architecture

The project is a TypeScript web application built with React, Vite, TanStack Start, TanStack Router, React Query, Tailwind CSS, and shadcn/ui components.

### High-level structure

- Frontend UI: React components under `src/components/`
- Routing: TanStack Router with generated route tree in `src/routeTree.gen.ts`
- Data layer: direct Supabase client calls from React components and routes
- Server layer: TanStack Start server entry plus middleware in `src/start.ts` and `src/server.ts`
- Styling: Tailwind-based design system with reusable UI primitives under `src/components/ui/`

### Main application flow

- The home route renders the assets list page.
- Users can add, edit, soft-delete, restore, and permanently delete assets.
- Selecting an asset opens a label sheet with a generated QR code and barcode for printing.
- Scanning or visiting the asset detail route shows a read-only view of the stored record.

## 2. Entry points

### Application startup

- `package.json` defines the Vite/TanStack Start scripts for dev, build, preview, and lint.
- `src/start.ts` initializes TanStack Start and registers middleware.
- `src/server.ts` provides the server entry for SSR and error handling.
- `src/router.tsx` creates the router and provides the React Query client context.

### Route entry points

- `src/routes/index.tsx` renders the main assets page.
- `src/routes/asset.$code.tsx` renders the public asset-detail page for a given asset code.
- `src/components/AssetsPage.tsx` is the primary UI entry point for CRUD operations.

## 3. All Supabase dependencies

### Browser/client-side integration

- `src/integrations/supabase/client.ts`
  - Creates the browser-side Supabase client.
  - Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
  - Configures persistence and token refresh.

### Server-side integration

- `src/integrations/supabase/client.server.ts`
  - Creates a server-side Supabase client using the service-role key.
  - Intended for trusted backend operations.

### Authentication middleware

- `src/integrations/supabase/auth-attacher.ts`
  - Attaches the current Supabase access token to request headers for server function calls.
- `src/integrations/supabase/auth-middleware.ts`
  - Validates bearer tokens and extracts claims from Supabase auth.

### Generated types and schema

- `src/integrations/supabase/types.ts`
  - Contains generated TypeScript types for the `public.assets` table.
- `supabase/migrations/`
  - Holds the SQL schema used by Supabase for the `assets` table and its triggers/policies.

### Direct app usage of Supabase

- `src/components/AssetsPage.tsx`
  - Uses Supabase to list, insert, update, soft-delete, restore, and permanently delete assets.
- `src/routes/asset.$code.tsx`
  - Uses Supabase to fetch one asset by `asset_code`.

### Not currently used

- No Supabase Storage bucket usage was found.
- No Supabase Realtime or RPC usage was found.

## 4. Authentication flow

The application does not currently use a real Supabase-authenticated user flow in the UI.

### Current behavior

- The browser client initializes Supabase auth state through `supabase.auth.getSession()`.
- The TanStack Start middleware attaches the access token as an `Authorization` header for server-side calls.
- Server middleware validates the token using `supabase.auth.getClaims(token)`.
- The app’s actual edit/delete protection is not Supabase-based; it uses a local hard-coded password prompt in `src/components/AssetsPage.tsx`.

### Implication for SQLite migration

- Supabase auth middleware can be removed or replaced with a local/session-based auth layer.
- The simple admin password gate should be replaced with a proper app-level auth strategy if required.

## 5. Database calls

The current database layer is centered on the `public.assets` table.

### Table shape used by the app

The app expects the following asset fields:

- `id`
- `asset_code`
- `company`
- `asset_name`
- `category`
- `brand`
- `model_number`
- `serial_number`
- `purchase_date`
- `purchase_price`
- `purchase_fund`
- `vendor`
- `department`
- `user_branch`
- `warranty_months`
- `warranty_expiry`
- `status`
- `remarks`
- `created_at`
- `updated_at`
- `deleted_at`

### Calls made from the UI

- List assets:
  - `db.from("assets").select("*").order("created_at", { ascending: false })`
- Create asset:
  - `db.from("assets").insert(payload)`
- Update asset:
  - `db.from("assets").update(payload).eq("id", editing.id)`
- Soft delete asset:
  - `db.from("assets").update({ deleted_at: new Date().toISOString() }).eq("id", id)`
- Restore asset:
  - `db.from("assets").update({ deleted_at: null }).eq("id", id)`
- Permanently delete asset:
  - `db.from("assets").delete().eq("id", id)`
- Load a single asset by code:
  - `db.from("assets").select("*").eq("asset_code", code).maybeSingle()`

### Supabase schema notes

The Supabase migrations define:

- A table named `public.assets`
- Row-level security policies for `SELECT`, `INSERT`, `UPDATE`, and `DELETE`
- A trigger to auto-update `updated_at`
- A trigger to auto-generate `asset_code` when missing

## 6. Storage usage

No storage usage is currently implemented.

### Findings

- No `@supabase/storage-js` dependency or storage API calls were found.
- QR codes and barcodes are rendered locally in the browser and are not uploaded to storage.
- There is no file upload or document attachment workflow in the current app.

### Migration implication

- SQLite migration does not need a storage-bucket migration.
- Any future file-attachment feature would need a separate storage strategy.

## 7. QR generation flow

QR generation is handled entirely in the client.

### Flow

- `src/components/LabelSheet.tsx` receives an asset and builds a public URL of the form `/asset/{asset_code}`.
- The `qrcode` library renders a QR code into a canvas element.
- The `jsbarcode` library renders a CODE128 barcode into an SVG element.
- The UI exposes a print button that calls `window.print()`.

### Important detail

- The QR content points to the application’s public detail route rather than to a backend endpoint.
- The detail route itself fetches the asset from the database when opened.

## 8. Asset CRUD flow

### Read flow

1. `src/components/AssetsPage.tsx` loads assets from the database on page render.
2. The list supports search and active/trash filtering in memory.
3. The detail route `src/routes/asset.$code.tsx` fetches a single asset by `asset_code`.

### Create/update flow

1. The user opens the modal form from `src/components/AssetsPage.tsx`.
2. `src/components/AssetForm.tsx` collects the asset fields and builds a payload.
3. The payload is submitted through the React Query mutation layer.
4. The mutation either inserts or updates the asset via Supabase.

### Delete/restore flow

1. Deleting an asset sets `deleted_at` rather than removing the row immediately.
2. The list view can switch between active assets and the recycle bin.
3. Restoring an asset clears `deleted_at`.
4. Permanently deleting an asset removes the row from the table.

## 9. Printing flow

The printing flow is UI-only and does not rely on a backend service.

### Process

- `src/components/LabelSheet.tsx` renders two label cards for the selected asset.
- The user clicks the print button.
- The browser’s `window.print()` action is triggered.
- CSS inside the component uses `@media print` to hide the surrounding UI and print only the label area.

### Migration implication

- Printing logic can remain mostly unchanged if the asset data still resolves the same way.
- Only the data-fetching layer behind the asset record needs to change.

## 10. Files that will require modification to migrate to SQLite

### Files with direct Supabase dependency that must change

- `src/integrations/supabase/client.ts`
  - Replace with a SQLite-backed data-access layer or repository.
- `src/integrations/supabase/client.server.ts`
  - Replace or remove the server-side Supabase client pattern.
- `src/integrations/supabase/auth-attacher.ts`
  - Remove or replace token attachment logic tied to Supabase auth.
- `src/integrations/supabase/auth-middleware.ts`
  - Replace with local auth or middleware that does not depend on Supabase claims.
- `src/integrations/supabase/types.ts`
  - Replace generated Supabase types with SQLite schema types.
- `src/components/AssetsPage.tsx`
  - Replace Supabase table calls with repository/service functions for SQLite.
- `src/routes/asset.$code.tsx`
  - Replace the asset lookup query with a SQLite-backed lookup.

### Schema and migration files that must change

- `supabase/migrations/20260629133833_98d92faf-fd8e-4095-aa6d-b84ca34d8754.sql`
- `supabase/migrations/20260701072520_64175560-df2f-4440-bde6-ce377fb0f3ae.sql`
- `supabase/migrations/20260701073011_58dd7e2b-314a-428d-b879-9d5cbd5a1d7e.sql`
- `supabase/migrations/20260701075039_fb35f7aa-e80f-4520-a7f1-223f8e07ed3f.sql`
  - These should be replaced with SQLite schema definitions and migration logic.

### Files likely to need review or minor adaptation

- `src/components/AssetForm.tsx`
  - The payload structure is already generic and should work with a repository layer, but it may need adjustment if the DB layer enforces a different field mapping.
- `src/lib/asset-types.ts`
  - Likely remains the main domain model, but it may need to align with the SQLite schema and serialization rules.
- `package.json`
  - Remove or replace the Supabase runtime dependency and add the SQLite driver and ORM or query layer you choose.
- `src/start.ts`
  - Remove or update any middleware that depends on Supabase auth.

### Files that likely do not need direct changes

- `src/components/LabelSheet.tsx`
  - QR/barcode generation and printing are not tied to Supabase.
- `src/routes/index.tsx`
  - The route wiring can remain the same if the data layer behind the page is changed.
- `src/components/ui/*`
  - UI primitives are independent of the database layer.

## Recommended migration approach

1. Introduce a repository layer such as `src/lib/db.ts` or `src/lib/assets-repository.ts`.
2. Replace direct Supabase calls in the page and detail route with repository methods.
3. Replace Supabase auth middleware with a local auth/session approach if authentication is still required.
4. Create an SQLite schema that mirrors the current asset model and preserve the existing soft-delete behavior.
5. Retain the current UI and route structure so the migration is mostly backend/data-layer focused.

## Summary

The project is currently tightly coupled to Supabase for both data access and auth plumbing. The main migration work is to replace the Supabase client integration, swap the data access calls in the asset list/detail screens, and remove the Supabase-auth middleware while keeping the existing UI behavior intact.
