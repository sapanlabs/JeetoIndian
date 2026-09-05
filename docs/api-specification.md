# API Specification Document — JeetoIndian

## 1. Core API Conventions

- **Base URL**: `https://api.jeetoindian.in/api/v1`
- **Protocol**: HTTPS / JSON format
- **Standard Header**:
  ```http
  Authorization: Bearer <JWT_ACCESS_TOKEN>
  X-Idempotency-Key: <UUIDv4> (Mandatory for attempt submissions & prize claims)
  Content-Type: application/json
  ```

---

## 2. Standard Envelope & Error Structure

### 2.1 Success Response Envelope
```json
{
  "success": true,
  "statusCode": 200,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "timestamp": "2026-09-06T00:00:00.000Z"
  }
}
```

### 2.2 Error Response Envelope
```json
{
  "success": false,
  "statusCode": 400,
  "error": {
    "code": "EXPIRED_QUIZ_ATTEMPT",
    "message": "The quiz submission exceeded the allowed time limit.",
    "details": [
      {
        "field": "time_taken_ms",
        "issue": "Submission received 14,000ms after attempt expiry"
      }
    ]
  },
  "timestamp": "2026-09-06T00:00:00.000Z"
}
```

---

## 3. Detailed Endpoint Catalogue

### 3.1 Auth Module (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/participant/send-otp` | Request 6-digit SMS OTP | None (Throttled 1/min) |
| `POST` | `/auth/participant/verify-otp` | Verify OTP & return Access/Refresh JWT | None |
| `POST` | `/auth/admin/login` | Email + Password login for Admin/Sponsor | None |
| `POST` | `/auth/admin/verify-2fa` | Complete 2FA TOTP verification | Pre-Auth Token |
| `POST` | `/auth/refresh` | Exchange Refresh Token for new Access Token | Refresh Token |

### 3.2 Competitions Module (`/api/v1/competitions`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/competitions` | List active/upcoming free competitions | Public / Participant |
| `GET` | `/competitions/:id` | Get competition details & rules | Public / Participant |
| `POST` | `/competitions/:id/join` | Register for competition (100% Free) | Participant |
| `POST` | `/competitions` | Create new competition draft | Admin (`COMPETITION_CREATE`) |
| `PATCH` | `/competitions/:id/status` | Advance competition state (Publish/Schedule) | Admin (`COMPETITION_PUBLISH`) |

### 3.3 Quiz Attempt Module (`/api/v1/attempts`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/competitions/:id/attempts/start` | Start quiz attempt & receive questions | Participant |
| `POST` | `/attempts/:id/submit` | Idempotent final submission & answer payload | Participant |
| `GET` | `/attempts/:id/summary` | Retrieve attempt score summary | Participant |

### 3.4 Leaderboard & Winners (`/api/v1/leaderboards` & `/api/v1/winners`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/competitions/:id/leaderboard` | Get Redis-accelerated live leaderboard | Public / Participant |
| `GET` | `/competitions/:id/winners` | Get official verified winners list | Public / Participant |
| `POST` | `/competitions/:id/winners/verify` | Review & confirm provisional winners | Admin (`WINNER_VERIFY`) |

### 3.5 Sponsor Portal (`/api/v1/sponsors` & `/api/v1/campaigns`)
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `GET` | `/sponsors/campaigns` | List active brand campaigns | Sponsor |
| `POST` | `/sponsors/campaigns` | Create sponsored competition campaign | Sponsor / Admin |
| `GET` | `/sponsors/campaigns/:id/analytics` | Fetch engagement, impressions & CTA ROI | Sponsor / Admin |

---

## 4. Rate Limiting & Throttling Matrix

| Endpoint Route | Rate Limit Target | Limit Window |
| :--- | :--- | :--- |
| `/auth/participant/send-otp` | Per Phone / IP | 1 request per 60 seconds (Max 5/day) |
| `/attempts/:id/submit` | Per User / Attempt ID | 1 submission per attempt ID (Idempotent) |
| `/competitions` (List) | Per Client IP | 60 requests per minute |
| Admin APIs | Per Admin User ID | 120 requests per minute |
