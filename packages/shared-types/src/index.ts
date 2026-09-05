// Enums
export enum UserStatus {
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum RoleName {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  CONTENT_MANAGER = 'CONTENT_MANAGER',
  MODERATOR = 'MODERATOR',
  SPONSOR_MANAGER = 'SPONSOR_MANAGER',
  SUPPORT_AGENT = 'SUPPORT_AGENT',
  ANALYST = 'ANALYST',
  SPONSOR = 'SPONSOR',
  PARTICIPANT = 'PARTICIPANT',
}

export enum CompetitionStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  ENDED = 'ENDED',
  RESULT_PROCESSING = 'RESULT_PROCESSING',
  WINNER_VERIFICATION = 'WINNER_VERIFICATION',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum QuestionStatus {
  DRAFT = 'DRAFT',
  REVIEW = 'REVIEW',
  APPROVED = 'APPROVED',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum DifficultyLevel {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum AttemptStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  EXPIRED = 'EXPIRED',
  DISQUALIFIED = 'DISQUALIFIED',
}

export enum RiskLevel {
  NORMAL = 'NORMAL',
  SUSPICIOUS = 'SUSPICIOUS',
  HIGH_RISK = 'HIGH_RISK',
  DISQUALIFIED = 'DISQUALIFIED',
}

export enum PrizeType {
  PHYSICAL = 'PHYSICAL',
  VOUCHER = 'VOUCHER',
  COUPON = 'COUPON',
  SPONSOR_PRODUCT = 'SPONSOR_PRODUCT',
}

export enum FulfillmentStatus {
  PENDING = 'PENDING',
  VERIFICATION_REQUIRED = 'VERIFICATION_REQUIRED',
  VERIFIED = 'VERIFIED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
}

// User Interfaces
export interface IUser {
  id: string;
  phone?: string;
  email?: string;
  status: UserStatus;
  isPhoneVerified: boolean;
  isTwoFactorEnabled: boolean;
  roles: RoleName[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  state?: string;
  city?: string;
  pincode?: string;
  dateOfBirth?: string;
  gender?: string;
  bio?: string;
}

// Competition & Question Interfaces
export interface ICompetition {
  id: string;
  title: string;
  slug: string;
  description?: string;
  bannerUrl?: string;
  category: string;
  status: CompetitionStatus;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  maxAttemptsPerUser: number;
  isFreeEntry: true; // Mandatory Non-negotiable constraint
  sponsorId?: string;
  campaignId?: string;
  prizes?: IPrize[];
  createdAt: string;
  updatedAt: string;
}

export interface IQuestionOption {
  optionKey: 'A' | 'B' | 'C' | 'D';
  optionText: string;
}

export interface IQuestionPublic {
  id: string;
  category: string;
  difficulty: DifficultyLevel;
  questionText: string;
  options: IQuestionOption[];
}

export interface IQuestionAdmin extends IQuestionPublic {
  status: QuestionStatus;
  version: number;
  correctOptionKey: 'A' | 'B' | 'C' | 'D';
  explanation?: string;
  sourceReference?: string;
  creatorId: string;
  reviewerId?: string;
}

// Attempt & Quiz Flow Interfaces
export interface IStartQuizResponse {
  attemptId: string;
  competitionId: string;
  durationSeconds: number;
  startedAt: string;
  expiresAt: string;
  questions: IQuestionPublic[];
}

export interface IQuizSubmissionItem {
  questionId: string;
  selectedOptionKey: 'A' | 'B' | 'C' | 'D' | null;
  timeTakenMs: number;
}

export interface ISubmitQuizPayload {
  answers: IQuizSubmissionItem[];
  clientSubmittedAt: string;
  telemetrySignals?: {
    backgroundCount: number;
    deviceFingerprint: string;
    tabSwitchCount: number;
  };
}

export interface IQuizResultSummary {
  attemptId: string;
  score: number;
  totalTimeMs: number;
  correctCount: number;
  incorrectCount: number;
  unansweredCount: number;
  provisionalRank?: number;
  status: AttemptStatus;
}

// Leaderboard & Winners
export interface ILeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  avatarUrl?: string;
  score: number;
  totalTimeMs: number;
  submittedAt: string;
}

export interface IWinner {
  id: string;
  competitionId: string;
  userId: string;
  displayName: string;
  rank: number;
  score: number;
  totalTimeMs: number;
  prize?: IPrize;
  isVerified: boolean;
  fulfillmentStatus: FulfillmentStatus;
}

// Prize & Sponsor Interfaces
export interface IPrize {
  id: string;
  title: string;
  description?: string;
  imageUrl: string;
  prizeType: PrizeType;
  estimatedValueInr: number;
  termsConditions?: string;
  rankStart?: number;
  rankend?: number;
}

export interface ISponsor {
  id: string;
  name: string;
  logoUrl: string;
  website?: string;
  description?: string;
  isActive: boolean;
}

export interface ICampaign {
  id: string;
  sponsorId: string;
  title: string;
  objective?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

// Standard API Response Structure
export interface IApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    timestamp: string;
  };
}
