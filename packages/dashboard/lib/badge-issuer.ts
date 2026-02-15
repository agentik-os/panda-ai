/**
 * Badge Issuer - Certification Badge Generation & Verification
 *
 * Issues verifiable digital badges for certification completions.
 * Badges contain metadata for on-chain verification.
 */

export interface CertificationBadge {
  /** Unique badge identifier */
  id: string;
  /** Certification type (aocd, aocm) */
  certType: string;
  /** Full certification name */
  certName: string;
  /** Recipient user ID */
  userId: string;
  /** Recipient display name */
  userName: string;
  /** Score achieved (percentage) */
  score: number;
  /** Date issued (ISO string) */
  issuedAt: string;
  /** Expiration date (ISO string) */
  expiresAt: string;
  /** Verification hash for on-chain validation */
  verificationHash: string;
  /** Badge status */
  status: "active" | "expired" | "revoked";
}

export interface BadgeIssueRequest {
  certType: string;
  userId: string;
  userName: string;
  score: number;
}

const CERT_NAMES: Record<string, string> = {
  aocd: "Agentik OS Certified Developer",
  aocm: "Agentik OS Certified Marketer",
};

const CERT_VALIDITY_YEARS = 2;

/**
 * Generate a deterministic verification hash for badge validation.
 * In production, this would use a proper cryptographic signing mechanism.
 */
function generateVerificationHash(
  certType: string,
  userId: string,
  issuedAt: string,
): string {
  const data = `${certType}:${userId}:${issuedAt}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `badge_${Math.abs(hash).toString(36)}_${Date.now().toString(36)}`;
}

/**
 * Generate a unique badge ID
 */
function generateBadgeId(certType: string): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${certType}-${timestamp}-${random}`;
}

/**
 * Issue a new certification badge
 */
export function issueBadge(request: BadgeIssueRequest): CertificationBadge {
  const certName = CERT_NAMES[request.certType];
  if (!certName) {
    throw new Error(`Unknown certification type: ${request.certType}`);
  }

  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(
    Date.now() + CERT_VALIDITY_YEARS * 365.25 * 24 * 60 * 60 * 1000,
  ).toISOString();

  return {
    id: generateBadgeId(request.certType),
    certType: request.certType,
    certName,
    userId: request.userId,
    userName: request.userName,
    score: request.score,
    issuedAt,
    expiresAt,
    verificationHash: generateVerificationHash(
      request.certType,
      request.userId,
      issuedAt,
    ),
    status: "active",
  };
}

/**
 * Check if a badge is still valid
 */
export function isBadgeValid(badge: CertificationBadge): boolean {
  if (badge.status !== "active") return false;
  return new Date(badge.expiresAt) > new Date();
}

/**
 * Get the passing score threshold for a certification type
 */
export function getPassingScore(certType: string): number {
  switch (certType) {
    case "aocd":
      return 75;
    case "aocm":
      return 70;
    default:
      return 75;
  }
}

/**
 * Determine exam result based on score
 */
export function getExamResult(
  certType: string,
  scorePercent: number,
): { passed: boolean; result: string; action: string } {
  const passing = getPassingScore(certType);

  if (scorePercent >= passing) {
    return { passed: true, result: "PASS", action: "Badge issued" };
  }

  if (scorePercent >= passing - 15) {
    return {
      passed: false,
      result: "NEAR PASS",
      action: "Retake after 2 weeks",
    };
  }

  return {
    passed: false,
    result: "FAIL",
    action: "Retake after completing review modules",
  };
}
