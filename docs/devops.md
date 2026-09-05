# DevOps & Operational Guide — JeetoIndian

## 1. Local Development Environment Setup

### 1.1 Prerequisites
- Node.js >= 20.0.0
- Docker & Docker Compose
- Flutter SDK >= 3.24.0

### 1.2 Step-by-Step Command Sequence

```bash
# 1. Start Local PostgreSQL 16 & Redis 7 Container Services
docker-compose up -d

# 2. Push Database Schema to Local PostgreSQL
cd apps/api
npx prisma db push

# 3. Seed Database with Roles, Sample Questions, Sponsor, Campaign & Live Free Competition
npx ts-node src/prisma/seed.ts

# 4. Start NestJS Backend API Server (Port 3000)
npm run start:dev

# 5. Start Next.js Web Admin Portal (Port 3001)
npm run dev:admin

# 6. Start Next.js Sponsor Portal (Port 3002)
npm run dev:sponsor

# 7. Analyze & Run Flutter Mobile App
cd apps/mobile
flutter analyze
flutter run
```

---

## 2. Environment Variables Specification

### 2.1 Backend API (`apps/api/.env`)
```env
PORT=3000
NODE_ENV=development
DATABASE_URL=<DATABASE_URL>
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=<JWT_SECRET>
SMS_GATEWAY_API_KEY=<SMS_GATEWAY_API_KEY>
SMS_GATEWAY_SENDER_ID=JEETO
```

---

## 3. Production Deployment & AWS Infrastructure

```
Route53 -> WAF -> ALB -> ECS Fargate Cluster (NestJS API & Web Portals) -> RDS Multi-AZ PostgreSQL 16 & ElastiCache Redis 7
```
