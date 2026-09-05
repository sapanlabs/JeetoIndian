# MVP Implementation Roadmap — JeetoIndian

## 1. Roadmap Overview & Timeline

The implementation of **JeetoIndian** follows a strict, incremental phase structure. Each phase builds a testable foundation before moving to the next.

```
[Phase 1: Foundation & Monorepo Setup]
                   │
                   ▼
[Phase 2: Auth & Role-Based Access Control]
                   │
                   ▼
[Phase 3: Question Bank & Versioning Engine]
                   │
                   ▼
[Phase 4: Competition Engine & Quiz State Machine]
                   │
                   ▼
[Phase 5: Prize Catalogue & Anti-Cheat Winner Pipeline]
                   │
                   ▼
[Phase 6: Flutter Mobile Application (Participant UX)]
                   │
                   ▼
[Phase 7: Next.js Admin Web Portal (Ops Control)]
                   │
                   ▼
[Phase 8: Next.js Sponsor Web Portal (Brand Campaigns)]
                   │
                   ▼
[Phase 9: Push Notifications & Async Workers]
                   │
                   ▼
[Phase 10: Production Readiness, Security & CI/CD Pipeline]
```

---

## 2. Phase Breakdown & Acceptance Criteria

### Phase 1: Monorepo Foundation & Tooling Setup
- **Tasks**:
  1. Initialize monorepo workspace structure (`/apps/api`, `/apps/admin-web`, `/apps/sponsor-web`, `/apps/mobile`, `/packages/*`, `/infrastructure`, `/docs`).
  2. Configure root TypeScript `tsconfig.base.json`, ESLint, Prettier, and workspace dependencies.
  3. Set up Docker Compose local development environment (PostgreSQL 16, Redis 7).
- **Acceptance Criteria**:
  - Monorepo builds cleanly with `npm run build`.
  - Local PostgreSQL and Redis containers start up via `docker-compose up -d` with healthy status.

### Phase 2: Authentication & User Management
- **Tasks**:
  1. Implement `AuthModule` in NestJS: SMS OTP request/verify with Redis rate-limiting (Participant).
  2. Implement Admin/Sponsor Email + Password login with TOTP 2FA.
  3. Implement RBAC authorization guards and JWT Access/Refresh token rotation.
- **Acceptance Criteria**:
  - Integration tests pass for OTP throttle, JWT issuance, and RBAC permission checks.

### Phase 3: Question Bank & Versioning System
- **Tasks**:
  1. Implement `QuestionModule` with PostgreSQL tables (`questions`, `question_versions`, `question_options`).
  2. Implement question lifecycle state machine (`DRAFT` → `REVIEW` → `APPROVED` → `PUBLISHED` → `ARCHIVED`).
  3. Immutable versioning mechanism when editing published questions.
- **Acceptance Criteria**:
  - Editing an approved/published question creates a new `QuestionVersion` without mutating historical versions.

### Phase 4: Competition Engine & Server-Authoritative Quiz Engine
- **Tasks**:
  1. Implement `CompetitionModule` lifecycle (`DRAFT` → `SCHEDULED` → `LIVE` → `ENDED` → `COMPLETED`).
  2. Implement `QuizAttemptModule` & `ScoringModule`: Server-authoritative timer, scoring (+100/0), tie-breaker engine, and idempotency handling.
  3. Implement `LeaderboardModule`: Accelerated live reads via Redis Sorted Sets (`ZSET`).
- **Acceptance Criteria**:
  - Quiz submission calculates scores strictly server-side.
  - Submissions outside competition duration are rejected with clear error codes.
  - Leaderboard sorts by Score (Desc), Time Taken (Asc), Submission Timestamp (Asc).

### Phase 5: Anti-Cheat Engine, Winners & Prize Fulfillment
- **Tasks**:
  1. Implement `FraudModule`: Client signal collection, automated risk scoring, `FraudFlag` generation.
  2. Implement `WinnerModule`: Result freezing, provisional winner generation, Admin confirmation pipeline.
  3. Implement `PrizeModule`: Prize catalog and `PrizeFulfillment` status state machine.
- **Acceptance Criteria**:
  - Suspicious attempts enter `FraudReview` before provisional winners can be confirmed by Admin.

### Phase 6: Flutter Mobile Application (Participant Surface)
- **Tasks**:
  1. Implement Flutter App clean architecture (Presentation → Application → Domain → Data).
  2. Screens: Splash, Onboarding, OTP Login, Home, Competition Details, Rules, Quiz View, Score/Result, Leaderboard, Rewards, Profile.
- **Acceptance Criteria**:
  - 100% Free-to-Play messaging is prominent. Zero cash wallet or betting UI.

### Phase 7: Next.js Admin Web Portal
- **Tasks**:
  1. Dashboard UI: Overview metrics, active competitions, pending winner approvals, fraud flag queue.
  2. Question Bank Manager, Competition Lifecycle Control, User Management, Audit Logs viewer.
- **Acceptance Criteria**:
  - Admins can manage questions, schedule competitions, review fraud flags, and verify winners cleanly.

### Phase 8: Next.js Sponsor Web Portal
- **Tasks**:
  1. Sponsor Brand Profile setup and campaign creation.
  2. Campaign Performance Analytics: Impressions, participants, completions, CTA clicks.
- **Acceptance Criteria**:
  - Sponsors can view their active campaign engagement metrics without seeing sensitive participant PII.

### Phase 9: Notifications & Async Workers
- **Tasks**:
  1. BullMQ worker setup for background result processing and fraud review indexing.
  2. FCM Push Notification integration for competition start alerts and winner declarations.
- **Acceptance Criteria**:
  - Asynchronous jobs process off the main HTTP API thread cleanly without blocking.

### Phase 10: Production DevOps, Security Audit & Release
- **Tasks**:
  1. Dockerize applications and configure GitHub Actions CI/CD.
  2. Write AWS Terraform / ECS Fargate infrastructure manifests.
  3. Perform final security audit, rate limit verification, and test coverage validation.
- **Acceptance Criteria**:
  - All unit, integration, and API tests pass cleanly across all modules.
