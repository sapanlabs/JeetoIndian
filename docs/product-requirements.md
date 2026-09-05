# Product Requirements Document (PRD) — JeetoIndian

## 1. Product Vision & Positioning

**JeetoIndian** is "India's Competitive Knowledge Platform" — a mobile-first, production-oriented platform where users across India participate in **100% FREE** competitive quizzes to test their knowledge, climb real-time leaderboards, and win sponsor-funded physical or non-cash rewards.

### Core Value Proposition
- **For Participants**: Exciting, fast, skill-based, 100% free-to-play knowledge competitions with zero financial risk and real tangible rewards.
- **For Brands & Sponsors**: High-intent consumer engagement, brand recall, targeted campaigns, native reward integrations, and deep performance analytics.

### Non-Negotiable Business & Legal Model
1. **100% Free to Play**: Participants NEVER pay an entry fee, registration fee, deposit, stake, or wager to enter any competition or win any prize.
2. **Sponsor-Funded Rewards**: All prizes, vouchers, physical rewards, and platform operations are strictly funded by B2B brand sponsorships and campaign fees.
3. **No Financial Instruments**: The platform explicitly DOES NOT feature cash wallets, cash-out mechanisms, participant-funded prize pools, paid re-attempts, or money transactions for users.
4. **Legitimate Skill & Knowledge**: Competitions are purely knowledge/skill-based with server-authoritative scoring, tie-breaking, and anti-cheat validation.

---

## 2. Key Personas & Core Products

| Product | Target Audience | Primary Goals | Key Capabilities |
| :--- | :--- | :--- | :--- |
| **Mobile App (Flutter)** | End-Users / Participants (iOS & Android) | Discover competitions, test knowledge, win sponsor rewards | OTP login, live competitions, server-timed quizzes, leaderboards, reward claim tracking, profile & stats |
| **Admin Portal (Next.js)** | Platform Operators, Content Managers, Admins | Operations, moderation, question bank, risk/fraud audit, winner approval | RBAC management, question versioning, competition lifecycle control, anti-cheat flag reviews, prize fulfillment |
| **Sponsor Portal (Next.js)** | Brands & Campaign Sponsors | Run sponsored competitions, track brand engagement, review campaign ROI | Campaign management, asset upload, participant engagement analytics, CTA click tracking, ROI reporting |

---

## 3. Product Features & Requirements

### 3.1 Authentication & User Management
- **Participant Auth**: Phone Number + SMS OTP with Redis rate-limiting and brute-force protection. JWT Access/Refresh tokens with secure rotation.
- **Admin/Sponsor Auth**: Email + Password + Mandatory 2FA (TOTP/OTP).
- **Profile Management**: Display name, avatar, state/city (for localized brand campaigns), demographic preference, communication preferences.

### 3.2 Competition Engine
- **Lifecycle**: `DRAFT` → `REVIEW` → `SCHEDULED` → `LIVE` → `ENDED` → `RESULT_PROCESSING` → `WINNER_VERIFICATION` → `COMPLETED` (or `CANCELLED`).
- **Types**: Daily Knowledge Challenge, Mega Sponsored Cup, Category Sprint (Tech, Cinema, Cricket, UPSC/General Studies, Business).
- **Rules**: Explicit rules visible before joining (number of questions, duration, scoring breakdown, tie-breaking criteria, prize details).

### 3.3 Question Bank System
- **Single-Answer Multiple Choice Questions (MCQ)** with 4 choices.
- **Versioning**: Mutable draft state; once published in a live competition, questions are immutable. Modifications spawn a new version (`QuestionVersion`).
- **Metadata**: Category, difficulty (Easy, Medium, Hard), tags, explanation text, reference source, creator/reviewer audit fields.

### 3.4 Quiz Flow & Server-Authoritative Timing
- **Flow**: Home → Competition Details → Rules Confirmation → Start Quiz → Sequential/Grid Question Answering → Final Idempotent Submission → Result Summary → Leaderboard.
- **Server Timer**: Client timer is purely visual. Quiz duration is calculated server-side based on `attempt_start_time` vs `submission_received_time`.
- **Scoring System**:
  - Correct Answer = +100 points
  - Wrong Answer = 0 points
  - Unanswered = 0 points
- **Tie-Breaker Hierarchy**:
  1. Higher total score
  2. Lower total valid answer time (milliseconds)
  3. Earlier valid final submission timestamp (`submitted_at`)

### 3.5 Anti-Cheat & Risk Assessment Engine
- Real-time client signal collection: app background/foreground switches, tab focus loss, device fingerprinting, suspicious timing (e.g., answering in < 300ms consistently), IP duplication across accounts.
- Risk Levels: `NORMAL`, `SUSPICIOUS`, `HIGH_RISK`, `DISQUALIFIED`.
- Fraud Management: Flagged attempts enter `FraudReview` queue for manual Admin decision before final winner declaration.

### 3.6 Leaderboards & Winner Verification
- **Real-Time Leaderboard**: Accelerated by Redis Sorted Sets (`ZADD`/`ZREVRANGE`) with PostgreSQL as the persistent source of truth.
- **Winner Determination Workflow**:
  `Freeze Submissions` → `Batch Score Calculation` → `Risk Analysis Pipeline` → `Provisional Rankings` → `Admin Audit` → `Winner Confirmation` → `Fulfillment Ticket`.
- **Provisional Status**: Results are explicitly marked "Provisional" until Admin verification is completed.

### 3.7 Prize System & Fulfillment
- **Prizes**: Physical products (gadgets, merch), brand discount vouchers, digital gift codes, sponsor product hampers. **NO CASH.**
- **Fulfillment Lifecycle**: `PENDING` → `VERIFICATION_REQUIRED` → `VERIFIED` → `PROCESSING` → `SHIPPED` → `DELIVERED` (or `FAILED`/`CANCELLED`).
- **Privacy First**: Winner delivery addresses and phone numbers are encrypted and accessible only to authorized fulfillment staff.

### 3.8 Sponsor & Campaign Portal
- **Campaign Dashboard**: Total impressions, unique participants, quiz completion rate, average score, brand CTA clicks, geographic distribution.
- **Sponsor Assets**: Banner logos, sponsored question themes, post-quiz brand offers/coupons.

---

## 4. Compliance, Security & Data Privacy (India)

- **DPDP Act Compliance**: Explicit user consent for data collection, minimal personal data request, localized server storage (AWS ap-south-1 Mumbai), clear account deletion request flow.
- **Legal Non-Gambling Certification Guardrails**: Free entry, no stakes, skill-based quizzes, B2B sponsorship funding.
