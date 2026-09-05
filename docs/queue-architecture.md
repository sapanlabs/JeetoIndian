# Async Queue & Background Worker Architecture — JeetoIndian

## 1. Overview & Strategy

To guarantee sub-100ms HTTP API response times and protect database performance during peak competition wrap-ups (e.g. 50,000+ simultaneous quiz submissions ending), **JeetoIndian** utilizes a Redis-backed **BullMQ Background Job Architecture**.

---

## 2. Competition Size Strategy & Processing Thresholds

```
                       [Competition Ends Event]
                                  │
                                  ▼
                Is Participant Count > Configurable Threshold?
                (Default Threshold: 5,000 Attempts)
                                  │
                 ┌────────────────┴────────────────┐
                 │ YES                             │ NO
                 ▼                                 ▼
   [Enqueue BullMQ Job]             [Direct Synchronous Execution]
   - Task: PROCESS_COMPETITION      - Immediate Batch Scoring & Ranks
   - Queue: result-processing       - Immediate Provisional Winners
   - Job State: PENDING -> PROCESSING -> COMPLETED / FAILED
```

### Configurable Threshold Rationale
- **Small Competitions (< 5,000 Participants)**: Synchronous execution completes in under 250ms, allowing immediate winner feedback without queue overhead.
- **Large Competitions (≥ 5,000 Participants)**: Offloaded to BullMQ worker cluster to prevent HTTP API thread starvation and database connection pool exhaustion.

---

## 3. Persistent Job State Schema & Idempotency

Job states are persisted in Redis with key pattern `job_state:<jobId>` and mirrored in PostgreSQL for auditability:

```json
{
  "jobId": "job_result_cmp_7718b9c1",
  "competitionId": "cmp_7718b9c1",
  "queueName": "result-processing",
  "status": "PROCESSING",
  "attemptsMade": 1,
  "maxRetries": 3,
  "startedAt": "2026-09-06T00:13:00.000Z",
  "completedAt": null,
  "failureReason": null
}
```

### Idempotency Safeguards
1. **Unique Job ID**: Formatted as `job_result_<competitionId>`. Re-enqueuing the same competition result processing request returns the existing job handle.
2. **Transaction Isolation**: Database operations (`updateMany` to verified winners and `prize_fulfillments` creation) run within PostgreSQL ACID transactions (`$transaction`). If a job retries, existing records are updated rather than duplicated.
