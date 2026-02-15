/**
 * Marketplace Types
 *
 * Supports three item types: agents, skills, and OS modes.
 * Used by both the backend (Convex) and frontend (dashboard).
 */

// ============================================================================
// Core Types
// ============================================================================

export type MarketplaceItemType = "agent" | "skill" | "mode";

export type MarketplaceItemStatus =
  | "draft"
  | "pending_review"
  | "approved"
  | "rejected"
  | "published"
  | "suspended";

export interface MarketplaceItem {
  id: string;
  type: MarketplaceItemType;
  name: string;
  description: string;
  longDescription?: string;
  author: MarketplaceAuthor;
  version: string;
  price: number;
  currency: string;
  downloads: number;
  rating: number;
  reviewCount: number;
  tags: string[];
  screenshots?: string[];
  icon?: string;
  status: MarketplaceItemStatus;
  manifest: Record<string, unknown>;
  publishedAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Author
// ============================================================================

export interface MarketplaceAuthor {
  id: string;
  name: string;
  avatar?: string;
  verified: boolean;
  totalDownloads: number;
  totalRevenue: number;
  joinedAt: Date;
}

// ============================================================================
// Reviews
// ============================================================================

export interface MarketplaceReview {
  id: string;
  itemId: string;
  authorId: string;
  authorName: string;
  rating: number;
  comment: string;
  verifiedPurchase: boolean;
  helpful: number;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Publishing
// ============================================================================

export interface MarketplaceSubmission {
  itemType: MarketplaceItemType;
  name: string;
  description: string;
  longDescription?: string;
  version: string;
  price: number;
  tags: string[];
  screenshots?: string[];
  manifest: Record<string, unknown>;
}

export interface MarketplaceSecurityScan {
  id: string;
  itemId: string;
  status: "pending" | "scanning" | "passed" | "failed";
  findings: MarketplaceSecurityFinding[];
  scannedAt?: Date;
}

export interface MarketplaceSecurityFinding {
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  description: string;
  location?: string;
}

// ============================================================================
// Revenue
// ============================================================================

export interface MarketplaceRevenueSplit {
  creatorPercent: number;
  platformPercent: number;
}

export const DEFAULT_REVENUE_SPLIT: MarketplaceRevenueSplit = {
  creatorPercent: 70,
  platformPercent: 30,
};

export interface MarketplacePayout {
  id: string;
  authorId: string;
  amount: number;
  currency: string;
  status: "pending" | "processing" | "completed" | "failed";
  period: { start: Date; end: Date };
  createdAt: Date;
}
