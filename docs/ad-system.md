# Decoupled Ad System Architecture — JeetoIndian

## 1. Overview & Provider-Neutral Principles

The **Ad System** in JeetoIndian is designed as a fully decoupled, provider-neutral abstraction layer. Business logic and competition eligibility are completely isolated from specific ad SDKs (Google AdMob, Unity Ads, AppLovin, or custom sponsor video ad servers).

### Core Architectural Guarantee
> **The Ad System is strictly non-blocking.** Competition enrollment logic does not depend on ad network response codes, loading states, or completion events.

---

## 2. Server-Authoritative Ad Tracking (`AdModule` in NestJS)

### 2.1 Backend Responsibilities
1. **Idempotency & One-Ad-Per-Join Tracking**: Redis-backed state machine tracking `ad_opportunity:<competitionId>:<userId>` with a 24-hour TTL to prevent duplicate ad prompts on retry attempts.
2. **Impression & Analytics Recording**: Log ad impression events (`recordImpression`, `recordCompletion`, `recordFailure`) asynchronously for revenue reporting without blocking the HTTP request thread.

### 2.2 API Endpoints (`/api/v1/ads`)
- `POST /api/v1/ads/opportunity` — Check if an ad opportunity is permitted for the current user and competition.
- `POST /api/v1/ads/event` — Log ad telemetry events (`IMPRESSION`, `COMPLETED`, `SKIPPED`, `FAILED`).

---

## 3. Flutter Mobile App Ad Abstraction (`AdService` in Dart)

### 3.1 Interface Abstraction (`ad_provider.dart`)
```dart
abstract class AdProvider {
  Future<void> initialize();
  Future<bool> isAdAvailable(String placementId);
  Future<AdResult> showAd(String placementId);
}

enum AdStatus { COMPLETED, SKIPPED, FAILED, UNAVAILABLE }

class AdResult {
  final AdStatus status;
  final String? errorMessage;
  AdResult(this.status, {this.errorMessage});
}
```

### 3.2 Non-Blocking Join Flow Sequence
```
[User Taps JOIN FREE]
        │
        ▼
[1. Backend Validates User Eligibility (/competitions/:id/join)]
        │
        ▼
[2. Client Queries Ad Availability (AdProvider.isAdAvailable)]
        │
        ├── (Ad Available) ────► [Show Ad Overlay] ─── (Ad Closed/Completed/Failed)
        └── (Ad Unavailable) ──► [Skip Ad Overlay]           │
                                                             ▼
                                             [3. Start Quiz Session (/attempts/start)]
```
