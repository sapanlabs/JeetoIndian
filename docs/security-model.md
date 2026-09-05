# Security Model & Compliance Specification — JeetoIndian

## 1. Compliance Guardrails & Legal Principles (India)

### 1.1 Non-Gambling & Free-to-Play Statutory Alignment
Under Indian jurisprudence (Public Gambling Act 1867 & state specific online gaming acts):
- **JeetoIndian** is strictly a **Skill-Based Knowledge Platform**.
- **Zero Financial Consideration**: No user pays an entry fee, stake, wager, registration fee, or deposit to participate.
- **Sponsor-Funded Rewards**: Prizes are non-monetary items (vouchers, products) funded 100% by B2B corporate sponsors as promotional advertising campaigns.

### 1.2 Digital Personal Data Protection (DPDP) Act Compliance
- **Data Minimization**: Collect only essential fields (Phone number, display name, state/city for prize shipment).
- **Explicit Consent**: Granular opt-in checkboxes for Terms of Service, Privacy Policy, and promotional SMS/Push communications.
- **Data Encryption**: All PII (phone numbers, delivery addresses) are encrypted at rest using AES-256 in RDS PostgreSQL and in transit using TLS 1.3.
- **Account Deletion Flow**: Self-serve request for permanent deletion (`DELETED` status, anonymization of quiz attempts after audit retention period).

---

## 2. Role-Based Access Control (RBAC) Matrix

| Role | Description | Key Permissions |
| :--- | :--- | :--- |
| `SUPER_ADMIN` | Platform Owners | All permissions, System Config, Role Assignment |
| `ADMIN` | Senior Ops Managers | Competition Publish, Winner Confirmation, Refund/Cancel |
| `CONTENT_MANAGER` | Question Bank Leads | Create/Review/Publish Questions & Competitions |
| `MODERATOR` | Risk & Safety Team | Review Fraud Flags, Suspend Suspicious Accounts |
| `SPONSOR_MANAGER` | B2B Partnership Team | Onboard Sponsors, Create Campaigns, Attach Prizes |
| `SUPPORT_AGENT` | Customer Service | View User Profiles, Resolve Support Tickets (No PII Export) |
| `ANALYST` | Business Intelligence | View Anonymous Campaign Metrics & Performance Reports |
| `SPONSOR` | External Brand Client | View Owned Campaign Metrics & Upload Brand Assets |
| `PARTICIPANT` | End-User (Mobile App) | Join Free Competitions, Take Quizzes, View Leaderboards |

---

## 3. Anti-Cheat & Risk Assessment Engine

### 3.1 Risk Signal Ingestion
The mobile app collects telemetry during active quiz attempts:
1. **Background/Foreground Events**: User swiping away from app or opening split-screen.
2. **Speed Threshold Check**: Answers logged in under 300ms (indicative of automated scripts/bots).
3. **Session & Device Fingerprinting**: Multiple accounts playing sequentially on the same `device_id` or MAC address.
4. **Time Skew Anomaly**: Client submission time differs significantly from server authoritative clock (`NOW() - started_at`).

### 3.2 Automated Risk Calculation Pipeline
```
Total Risk Score = Σ (Signal Score * Weight)

- Background Event: +25 points
- Impossible Answering Speed (< 300ms): +40 points
- Device Multi-Account Binding (> 3 accounts): +50 points
- Clock Manipulation Detected: +100 points
```

### 3.3 Risk Thresholds & System Actions
- **0 - 29 (NORMAL)**: Auto-approved for provisional leaderboard ranking.
- **30 - 60 (SUSPICIOUS)**: Flags attempt for post-competition batch manual review (`FraudFlag` created).
- **61 - 99 (HIGH_RISK)**: Requires mandatory double-blind Admin confirmation before winner confirmation.
- **100+ (DISQUALIFIED)**: Attempt automatically invalidated (`status = DISQUALIFIED`).

---

## 4. Append-Only Audit Logging

Every mutation on Admin/Sponsor web portals generates an immutable `AuditLog` entry in PostgreSQL:
```json
{
  "actor_id": "usr_9981a3d2",
  "role": "ADMIN",
  "action": "CONFIRM_COMPETITION_WINNERS",
  "resource": "Competition",
  "resource_id": "cmp_7718b9c1",
  "ip_address": "103.21.124.5",
  "before_state": { "status": "WINNER_VERIFICATION" },
  "after_state": { "status": "COMPLETED" },
  "timestamp": "2026-09-06T00:02:16Z"
}
```
 Audit logs are append-only. UPDATE and DELETE triggers are disabled at the PostgreSQL database level for `audit_logs`.
