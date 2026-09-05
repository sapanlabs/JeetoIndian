# Database Design & Schema Specification — JeetoIndian

## 1. Entity Relationship Overview

The database uses PostgreSQL 16 as its primary transactional storage. All tables adhere to strict normalization standards (3NF), foreign key integrity, explicit indexing, and timezone-aware timestamps (`TIMESTAMPTZ`).

```
+---------------+       +------------------+       +-------------------+
|     User      |<----->|   UserProfile    |       |      Sponsor      |
+-------+-------+       +------------------+       +---------+---------+
        |                                                    |
        |                                                    v
        |               +------------------+       +-------------------+
        +-------------->|    UserRole      |<------|     Campaign      |
        |               +------------------+       +---------+---------+
        |                                                    |
        v                                                    v
+---------------+       +------------------+       +-------------------+
|  QuizAttempt  |<----->|   Competition    |<----->| CompetitionPrize  |
+-------+-------+       +--------+---------+       +---------+---------+
        |                        |                           |
        v                        v                           v
+---------------+       +------------------+       +-------------------+
|  QuizAnswer   |       |  QuestionVersion |       | PrizeFulfillment  |
+---------------+       +------------------+       +-------------------+
```

---

## 2. PostgreSQL DDL Schemas

```sql
-- Enums
CREATE TYPE user_status_enum AS ENUM ('ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE competition_status_enum AS ENUM ('DRAFT', 'REVIEW', 'SCHEDULED', 'LIVE', 'ENDED', 'RESULT_PROCESSING', 'WINNER_VERIFICATION', 'COMPLETED', 'CANCELLED');
CREATE TYPE question_status_enum AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE difficulty_enum AS ENUM ('EASY', 'MEDIUM', 'HARD');
CREATE TYPE attempt_status_enum AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'DISQUALIFIED');
CREATE TYPE risk_level_enum AS ENUM ('NORMAL', 'SUSPICIOUS', 'HIGH_RISK', 'DISQUALIFIED');
CREATE TYPE prize_type_enum AS ENUM ('PHYSICAL', 'VOUCHER', 'COUPON', 'SPONSOR_PRODUCT');
CREATE TYPE fulfillment_status_enum AS ENUM ('PENDING', 'VERIFICATION_REQUIRED', 'VERIFIED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'FAILED', 'CANCELLED');

-- 1. Users & Roles
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone VARCHAR(15) UNIQUE,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    status user_status_enum NOT NULL DEFAULT 'ACTIVE',
    is_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    two_factor_secret VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100) NOT NULL,
    avatar_url TEXT,
    state VARCHAR(100),
    city VARCHAR(100),
    pincode VARCHAR(10),
    date_of_birth DATE,
    gender VARCHAR(20),
    bio TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    module VARCHAR(50) NOT NULL,
    description TEXT
);

CREATE TABLE role_permissions (
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE user_roles (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

-- 2. Sponsors & Campaigns
CREATE TABLE sponsors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    logo_url TEXT NOT NULL,
    website VARCHAR(255),
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE sponsor_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    designation VARCHAR(100),
    is_primary BOOLEAN DEFAULT FALSE
);

CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID NOT NULL REFERENCES sponsors(id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    objective TEXT,
    budget_amount NUMERIC(12, 2) DEFAULT 0.00,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Question Bank & Versioning
CREATE TABLE questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category VARCHAR(100) NOT NULL,
    difficulty difficulty_enum NOT NULL DEFAULT 'MEDIUM',
    status question_status_enum NOT NULL DEFAULT 'DRAFT',
    current_version INT NOT NULL DEFAULT 1,
    creator_id UUID NOT NULL REFERENCES users(id),
    reviewer_id UUID REFERENCES users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE question_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    version INT NOT NULL,
    question_text TEXT NOT NULL,
    explanation TEXT,
    source_reference TEXT,
    language VARCHAR(10) NOT NULL DEFAULT 'en',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (question_id, version)
);

CREATE TABLE question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_version_id UUID NOT NULL REFERENCES question_versions(id) ON DELETE CASCADE,
    option_key CHAR(1) NOT NULL, -- 'A', 'B', 'C', 'D'
    option_text TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (question_version_id, option_key)
);

-- 4. Competitions & Rules
CREATE TABLE competitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    banner_url TEXT,
    category VARCHAR(100) NOT NULL,
    status competition_status_enum NOT NULL DEFAULT 'DRAFT',
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    duration_seconds INT NOT NULL,
    max_attempts_per_user INT NOT NULL DEFAULT 1,
    is_free_entry BOOLEAN NOT NULL DEFAULT TRUE CHECK (is_free_entry = TRUE), -- MANDATORY BUSINESS RULE
    campaign_id UUID REFERENCES campaigns(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE competition_questions (
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    question_version_id UUID NOT NULL REFERENCES question_versions(id),
    sequence_order INT NOT NULL,
    PRIMARY KEY (competition_id, question_id)
);

-- 5. Quiz Attempts & Answers
CREATE TABLE quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE RESTRICT,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_at TIMESTAMPTZ,
    status attempt_status_enum NOT NULL DEFAULT 'IN_PROGRESS',
    score INT NOT NULL DEFAULT 0,
    total_time_ms INT NOT NULL DEFAULT 0,
    risk_level risk_level_enum NOT NULL DEFAULT 'NORMAL',
    idempotency_key VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (competition_id, user_id)
);

CREATE TABLE quiz_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id),
    selected_option_key CHAR(1),
    is_correct BOOLEAN NOT NULL DEFAULT FALSE,
    time_taken_ms INT NOT NULL DEFAULT 0,
    answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (attempt_id, question_id)
);

-- 6. Leaderboards, Winners & Prizes
CREATE TABLE prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sponsor_id UUID REFERENCES sponsors(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url TEXT NOT NULL,
    prize_type prize_type_enum NOT NULL,
    estimated_value_inr NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    terms_conditions TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE competition_prizes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id) ON DELETE CASCADE,
    prize_id UUID NOT NULL REFERENCES prizes(id) ON DELETE RESTRICT,
    rank_start INT NOT NULL,
    rank_end INT NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    CHECK (rank_start <= rank_end)
);

CREATE TABLE winners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    competition_id UUID NOT NULL REFERENCES competitions(id),
    user_id UUID NOT NULL REFERENCES users(id),
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id),
    rank INT NOT NULL,
    score INT NOT NULL,
    total_time_ms INT NOT NULL,
    prize_id UUID REFERENCES prizes(id),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (competition_id, rank),
    UNIQUE (competition_id, user_id)
);

CREATE TABLE prize_fulfillments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    winner_id UUID NOT NULL UNIQUE REFERENCES winners(id),
    prize_id UUID NOT NULL REFERENCES prizes(id),
    status fulfillment_status_enum NOT NULL DEFAULT 'PENDING',
    tracking_number VARCHAR(100),
    courier_partner VARCHAR(100),
    voucher_code VARCHAR(255),
    shipping_address TEXT,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Anti-Cheat & Audit Logging
CREATE TABLE fraud_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES quiz_attempts(id),
    user_id UUID NOT NULL REFERENCES users(id),
    rule_triggered VARCHAR(100) NOT NULL,
    risk_score INT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE fraud_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    flag_id UUID NOT NULL REFERENCES fraud_flags(id),
    reviewed_by UUID NOT NULL REFERENCES users(id),
    action_taken VARCHAR(50) NOT NULL, -- 'CLEARED', 'DISQUALIFIED', 'SUSPEND_USER'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES users(id),
    role VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100) NOT NULL,
    resource_id VARCHAR(255),
    ip_address VARCHAR(45),
    before_state JSONB,
    after_state JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## 3. Indexing Strategy

```sql
-- Indexes for performance
CREATE INDEX idx_competitions_status_start ON competitions (status, start_time);
CREATE INDEX idx_quiz_attempts_comp_score ON quiz_attempts (competition_id, score DESC, total_time_ms ASC, submitted_at ASC);
CREATE INDEX idx_quiz_attempts_user ON quiz_attempts (user_id);
CREATE INDEX idx_questions_category_diff ON questions (category, difficulty, status);
CREATE INDEX idx_audit_logs_actor ON audit_logs (actor_id, timestamp DESC);
CREATE INDEX idx_fraud_flags_attempt ON fraud_flags (attempt_id);
```
