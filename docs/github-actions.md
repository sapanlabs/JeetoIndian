# GitHub Actions CI Pipeline — JeetoIndian

## 1. Overview & Architectural Scope

The **JeetoIndian** monorepo utilizes a hardened matrix GitHub Actions Continuous Integration (CI) pipeline defined in [`.github/workflows/ci.yml`](file:///Users/sapansmac/Desktop/JeetoIndian/.github/workflows/ci.yml).

The pipeline enforces lightweight secret scanning, static analysis, strict TypeScript checks, unit test suites, and production build compilations across all four monorepo application targets:
1. **`security-scan`**: Lightweight secret & private key scanner.
2. **`backend`**: NestJS REST API (`apps/api`)
3. **`admin-web`**: Next.js 14 Web Admin Portal (`apps/admin-web`)
4. **`sponsor-web`**: Next.js 14 Web Sponsor Portal (`apps/sponsor-web`)
5. **`flutter`**: Flutter 3.x Cross-Platform Mobile Client (`apps/mobile`)

---

## 2. Validation Scope: What CI Validates vs. Does NOT Validate

### What CI Validates (Code-Level Verification)
- **Secret Hygiene**: Scans repository files for committed credentials, private keys, or passwords.
- **Monorepo Lockfile Integrity**: Enforces `npm ci` against root `package-lock.json`.
- **Backend Code Quality**: `tsc --noEmit` type-checking with strict unused variable detection, Prisma schema generation, 100% Jest unit/integration tests (scoring, business rules, RBAC, anti-tamper), and `nest build`.
- **Web App Quality**: Next.js 14 static generation and `tsc --noEmit` for Admin & Sponsor web portals.
- **Mobile Client Quality**: Flutter code analysis (`flutter analyze --no-fatal-infos`) and state/resilience tests (`flutter test`).

### What CI Does NOT Validate (Unvalidated Cloud & Runtime Systems)
```text
GitHub CI:
Code-level validation

Real Render API / Worker:
NOT VALIDATED by current CI (Deployment not configured)

Real Vercel Portals:
NOT VALIDATED by current CI (Deployment not configured)

Real Production PostgreSQL 16:
NOT VALIDATED by current CI (Local/mock fallback used)

Real Production Redis 7:
NOT VALIDATED by current CI (Local/mock fallback used)

Production SMS Gateway:
NOT VALIDATED by current CI (Development OTP provider used)

Physical Mobile Device / Emulator:
NOT VALIDATED by current CI (Headless Dart VM runner used)

Production Deployment:
NOT CONFIGURED / NOT TESTED
```

---

## 3. Workflow Specifications & Triggers

- **Workflow File**: `.github/workflows/ci.yml`
- **Triggers**:
  ```yaml
  on:
    push:
      branches: [ main, develop ]
    pull_request:
      branches: [ main, develop ]
  ```
- **Concurrency Control**: `group: ${{ github.workflow }}-${{ github.ref }}`, `cancel-in-progress: true`.

---

## 4. Required Runtime & Tooling Versions

| Subsystem | Workspace Path | Runtime / Toolchain Version | Dependency Lockfile |
| :--- | :--- | :--- | :--- |
| **Node Workspaces** | `/` (Monorepo root) | Node.js `20.x` (`engines.node: ">=20.0.0"`) | Root `package-lock.json` (`npm ci`) |
| **Backend API** | `apps/api` | NestJS 10 / Node.js 20 | Monorepo root `package-lock.json` |
| **Admin Web** | `apps/admin-web` | Next.js 14 App Router / Node.js 20 | Monorepo root `package-lock.json` |
| **Sponsor Web** | `apps/sponsor-web` | Next.js 14 App Router / Node.js 20 | Monorepo root `package-lock.json` |
| **Mobile Client** | `apps/mobile` | Flutter `3.47.1` (Dart `3.13.1` SDK) | `apps/mobile/pubspec.lock` |

---

## 5. Job Matrix & Pipeline Steps

### Job 1: `security-scan`
- Scans for hardcoded `BEGIN PRIVATE KEY`, database credentials, or secret API tokens.

### Job 2: `backend` (`apps/api`)
- Runs `npm ci` at monorepo root.
- Runs `npm run prisma:generate --workspace=apps/api`.
- Runs `npm run type-check --workspace=apps/api` (`tsc --noEmit`).
- Runs `npm run test --workspace=apps/api` (`npx jest`).
- Runs `npm run build --workspace=apps/api` (`nest build`).

### Job 3: `admin-web` (`apps/admin-web`)
- Runs `npm ci` at monorepo root.
- Runs `npm run type-check --workspace=apps/admin-web` (`tsc --noEmit`).
- Runs `npm run build --workspace=apps/admin-web` (`next build`).

### Job 4: `sponsor-web` (`apps/sponsor-web`)
- Runs `npm ci` at monorepo root.
- Runs `npm run type-check --workspace=apps/sponsor-web` (`tsc --noEmit`).
- Runs `npm run build --workspace=apps/sponsor-web` (`next build`).

### Job 5: `flutter` (`apps/mobile`)
- Pins Flutter `3.47.1` engine (`subosito/flutter-action@v2`).
- Runs `flutter pub get` in `apps/mobile`.
- Runs `flutter analyze --no-fatal-infos` in `apps/mobile`.
- Runs `flutter test` in `apps/mobile`.

---

## 6. Exact Local Validation Commands

Developers must run these exact commands locally to mirror CI prior to opening a Pull Request:

```bash
# 1. Backend REST API checks (from monorepo root)
npm run type-check --workspace=apps/api
npm run test --workspace=apps/api
npm run build --workspace=apps/api

# 2. Admin Web Portal checks (from monorepo root)
npm run type-check --workspace=apps/admin-web
npm run build --workspace=apps/admin-web

# 3. Sponsor Web Portal checks (from monorepo root)
npm run type-check --workspace=apps/sponsor-web
npm run build --workspace=apps/sponsor-web

# 4. Flutter Mobile Client checks (from apps/mobile directory)
cd apps/mobile
flutter pub get
flutter analyze --no-fatal-infos
flutter test
```

---

## 7. Deployment Status

```text
Vercel deployment: NOT CONFIGURED
Render deployment: NOT CONFIGURED
Production deployment: NOT CONFIGURED
```
*Continuous Integration only. Production and staging cloud deployment workflows will be introduced in subsequent release milestones.*
