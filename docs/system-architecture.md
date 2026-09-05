# System Architecture Document — JeetoIndian

## 1. High-Level Architecture Overview

**JeetoIndian** is designed as a high-performance, modular monolith backend serving three distinct client surfaces: Flutter Mobile App, Next.js Admin Portal, and Next.js Sponsor Portal.

```
                                  +---------------------------------------+
                                  |         CDN / WAF (CloudFront)        |
                                  +-------------------+-------------------+
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |        Application Load Balancer      |
                                  +-------------------+-------------------+
                                                      |
                    +---------------------------------+---------------------------------+
                    |                                 |                                 |
                    v                                 v                                 v
        +-----------------------+         +-----------------------+         +-----------------------+
        |   Flutter Mobile App  |         |   Next.js Admin Web   |         |  Next.js Sponsor Web  |
        |   (iOS & Android)     |         |   (Internal Ops)      |         |  (Brands & Sponsors)  |
        +-----------+-----------+         +-----------+-----------+         +-----------+-----------+
                    |                                 |                                 |
                    +---------------------------------+---------------------------------+
                                                      | REST API (JSON / HTTPS)
                                                      v
                                  +---------------------------------------+
                                  |     NestJS Modular Monolith API       |
                                  |     (ECS Fargate Container Cluster)   |
                                  +---------+-------------------+---------+
                                            |                   |
                     +----------------------+                   +----------------------+
                     | PostgreSQL (Primary DB)                  | Redis Cluster (Cache & Lock)
                     v                                          v
        +-----------------------+                          +-----------------------+
        |  PostgreSQL 16 (RDS)  |                          | ElastiCache Redis 7   |
        |  - Users & Profiles   |                          | - Live Leaderboards   |
        |  - Competitions       |                          | - Session & OTP Lock  |
        |  - Questions & Version|                          | - BullMQ Queue Jobs   |
        |  - Attempts & Answers |                          | - Idempotency Keys    |
        |  - Winners & Audit    |                          +-----------+-----------+
        +-----------------------+                                      |
                                                                       v
                                                           +-----------------------+
                                                           | BullMQ Async Workers  |
                                                           | - Scoring & Ranking   |
                                                           | - Fraud Risk Analysis |
                                                           | - Push Notifications  |
                                                           +-----------------------+
```

---

## 2. Repository Layout & Boundaries

```
JeetoIndian/
├── apps/
│   ├── api/             # NestJS Modular Monolith API
│   ├── admin-web/       # Next.js Admin Portal
│   ├── sponsor-web/     # Next.js Sponsor Portal
│   └── mobile/          # Flutter Mobile Application (iOS/Android)
├── packages/
│   ├── shared-types/    # Shared TypeScript interfaces & DTO definitions
│   ├── validation/      # Shared Zod/class-validator schemas
│   ├── config/          # Centralized configuration & environment constants
│   └── design-system/   # Shared UI components & design tokens for web
├── infrastructure/
│   ├── aws/             # CloudFormation / Terraform / CDK manifests
│   ├── docker/          # Dockerfiles & docker-compose configurations
│   └── ci/              # GitHub Actions workflows & scripts
└── docs/                # Architectural & operational documentation
```

---

## 3. NestJS Backend Modules Architecture

The NestJS backend (`/apps/api`) strictly enforces encapsulation. Modules communicate via explicit service interfaces or domain events, allowing future microservice extraction if needed.

```
apps/api/src/
├── modules/
│   ├── auth/            # Phone OTP, JWT issue/refresh, Admin 2FA
│   ├── user/            # User profile, roles, permissions, DPDP privacy
│   ├── competition/     # Competition creation, rules, lifecycle state machine
│   ├── question/        # Question bank, draft/review, versioning
│   ├── quiz-attempt/    # Attempt session, question fetch, answer recording
│   ├── scoring/         # Server-authoritative scoring & tie-breaker engine
│   ├── leaderboard/     # Redis ZSET acceleration & PostgreSQL sync
│   ├── prize/           # Prize catalog, inventory, fulfillment pipeline
│   ├── sponsor/         # Sponsor profiles, contacts, credentials
│   ├── campaign/        # Sponsor campaign setup, asset links, analytics
│   ├── winner/          # Result freeze, provisional winner gen, confirmation
│   ├── fraud/           # Risk signal detection, FraudFlag, FraudReview
│   ├── notification/    # FCM Push notifications, SMS/Email service
│   ├── analytics/       # Event ingestion, campaign ROI metrics
│   ├── admin/           # Admin dashboard stats, system health
│   ├── support/         # Support tickets, user queries
│   └── audit/           # Append-only immutable admin audit logger
```

---

## 4. Key Data Flows & Architectural Decisions

### 4.1 Server-Authoritative Quiz Attempt & Submission
1. **Attempt Initiation**: `POST /api/v1/competitions/:id/attempts/start`
   - Validates competition state (`LIVE`), eligibility, and single-attempt constraint via Redis Lock (`SETNX`).
   - Creates `QuizAttempt` in DB (`status = IN_PROGRESS`, `started_at = NOW()`).
   - Returns question set **WITHOUT correct answers**.
2. **Answer Submission**: `POST /api/v1/attempts/:id/submit` (with Idempotency Key header)
   - Checks if attempt exists and is `IN_PROGRESS`.
   - Computes elapsed time: `submitted_at - started_at`.
   - Calculates score: Correct (+100), Wrong (0), Unanswered (0).
   - Validates client timing signals against threshold limits.
   - Saves `QuizAnswer` records and updates `QuizAttempt` (`status = COMPLETED`).
   - Enqueues BullMQ background job for async leaderboard update and risk scoring.

### 4.2 Async Winner Processing & Anti-Cheat Pipeline
```
[Competition End Event]
         │
         ▼
[1. State Transition: ENDED -> RESULT_PROCESSING]
         │
         ▼
[2. Freeze Submissions & Flush Redis Leaderboard Buffer]
         │
         ▼
[3. Run Fraud Analysis Job] ──(Flagged)──► [Create FraudFlag / FraudReview]
         │                                         │
         ▼ (Clean)                                 ▼ (Admin Review)
[4. Generate Provisional Winner List] ◄───[Admin Approves/Disqualifies]
         │
         ▼
[5. State Transition: WINNER_VERIFICATION]
         │
         ▼
[6. Admin Final Confirmation] ──► [Generate PrizeFulfillment Records]
         │
         ▼
[7. State Transition: COMPLETED & Dispatch FCM Winner Push Notifications]
```

---

## 5. Architectural Tradeoffs & Rationales

| Decision | Selected Option | Alternative Considered | Tradeoff & Justification |
| :--- | :--- | :--- | :--- |
| **Monolith vs Microservices** | Modular Monolith | Microservices Architecture | **Monolith chosen for MVP**: Simplifies transactions, deployment, and developer velocity. Clear module boundaries ensure future extraction if required. |
| **Database** | PostgreSQL | MongoDB | **PostgreSQL chosen**: Core business entities (competitions, attempts, ranks, prizes) are strictly relational and require ACID compliance. |
| **Leaderboard Engine** | Redis Sorted Sets + PostgreSQL fallback | Pure SQL / Elasticsearch | **Redis ZSET chosen**: Delivers sub-10ms response times for active leaderboards while PostgreSQL serves as the persistent truth. |
| **Mobile Framework** | Flutter | React Native | **Flutter chosen**: High visual fidelity, consistent 60/120fps UI rendering across diverse low-end to high-end Android devices in India. |
