import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex Database Schema for Agentik OS
 *
 * Tables:
 * - agents: AI agent configurations
 * - conversations: Message history and sessions
 * - costs: Usage tracking and billing
 * - budgets: Budget limits and alerts
 * - marketplace_agents: Published agents in marketplace
 * - marketplace_skills: Published skills in marketplace
 * - marketplace_ratings: User ratings for agents/skills
 * - marketplace_reviews: User reviews for agents/skills
 * - marketplace_payouts: Creator revenue payouts (70/30 split)
 * - marketplace_purchases: Install/purchase tracking
 */

export default defineSchema({
  // ============================================================================
  // AGENTS TABLE
  // ============================================================================
  agents: defineTable({
    // Core Identity
    name: v.string(),
    description: v.optional(v.string()),
    systemPrompt: v.string(),

    // Model Configuration
    model: v.string(), // "claude-opus-4", "gpt-4o", "gemini-pro", "llama-3"
    provider: v.string(), // "anthropic", "openai", "google", "ollama"
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),

    // Features & Capabilities
    channels: v.array(v.string()), // ["cli", "dashboard", "discord", "slack", "telegram", "api"]
    skills: v.array(v.string()), // ["web-search", "code-execution", "file-management", etc.]

    // Status & Metadata
    status: v.string(), // "active", "inactive", "paused"
    createdAt: v.number(),
    updatedAt: v.number(),
    lastActiveAt: v.optional(v.number()),

    // Usage Statistics
    messageCount: v.optional(v.number()),
    totalCost: v.optional(v.number()),

    // Advanced Configuration (Phase 2+)
    memoryEnabled: v.optional(v.boolean()),
    contextWindow: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),

    // OS Modes (Step-072)
    mode: v.optional(
      v.union(
        v.literal("focus"),
        v.literal("creative"),
        v.literal("research"),
        v.literal("balanced"),
      ),
    ), // Default: "balanced"
  })
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_last_active", ["lastActiveAt"])
    .index("by_mode", ["mode"]),

  // ============================================================================
  // CONVERSATIONS TABLE
  // ============================================================================
  conversations: defineTable({
    // Core Identity
    agentId: v.id("agents"),
    channel: v.string(), // "cli", "dashboard", "discord", "slack", "telegram", "api"
    sessionId: v.optional(v.string()), // For grouping related messages

    // Message Content
    role: v.string(), // "user", "assistant", "system"
    content: v.string(),

    // Message Metadata
    timestamp: v.number(),
    userId: v.optional(v.string()), // External user identifier

    // Model Usage
    model: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
    cost: v.optional(v.number()),

    // Context & Features
    attachments: v.optional(v.array(v.object({
      type: v.string(), // "image", "file", "url"
      url: v.string(),
      name: v.optional(v.string()),
    }))),

    skillsUsed: v.optional(v.array(v.string())),

    // Response Metadata
    responseTime: v.optional(v.number()), // Milliseconds
    error: v.optional(v.string()),

    // Semantic Search (Step-073)
    embedding: v.optional(v.array(v.float64())), // Vector embedding for semantic search
  })
    .index("by_agent", ["agentId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_session", ["sessionId"])
    .index("by_agent_and_session", ["agentId", "sessionId"])
    .index("by_channel", ["channel"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536, // OpenAI text-embedding-3-small dimensions
      filterFields: ["agentId", "role"],
    }),

  // ============================================================================
  // COSTS TABLE
  // ============================================================================
  costs: defineTable({
    // Request Identity
    agentId: v.id("agents"),
    conversationId: v.optional(v.id("conversations")),

    // Model & Provider
    model: v.string(),
    provider: v.string(),

    // Token Usage
    inputTokens: v.number(),
    outputTokens: v.number(),
    totalTokens: v.number(),

    // Cost Breakdown
    inputCost: v.number(), // USD
    outputCost: v.number(), // USD
    totalCost: v.number(), // USD

    // Timing
    timestamp: v.number(),
    responseTime: v.optional(v.number()),

    // Context
    channel: v.string(),
    endpoint: v.optional(v.string()), // API endpoint or command name
  })
    .index("by_agent", ["agentId"])
    .index("by_timestamp", ["timestamp"])
    .index("by_model", ["model"])
    .index("by_provider", ["provider"])
    .index("by_agent_and_timestamp", ["agentId", "timestamp"]),

  // ============================================================================
  // BUDGETS TABLE
  // ============================================================================
  budgets: defineTable({
    // Agent Reference
    agentId: v.id("agents"),

    // Budget Configuration
    limitAmount: v.number(), // USD
    period: v.union(
      v.literal("daily"),
      v.literal("weekly"),
      v.literal("monthly"),
      v.literal("per-conversation"),
    ),

    // Alert Configuration
    thresholds: v.array(
      v.union(v.literal(50), v.literal(75), v.literal(90), v.literal(100)),
    ), // Percentage thresholds
    notificationChannels: v.array(
      v.union(
        v.literal("email"),
        v.literal("webhook"),
        v.literal("telegram"),
        v.literal("in-app"),
      ),
    ),
    enforcementAction: v.union(
      v.literal("warn"),
      v.literal("pause"),
      v.literal("block"),
    ),

    // Notification Settings
    webhookUrl: v.optional(v.string()),
    emailAddress: v.optional(v.string()),
    telegramChatId: v.optional(v.string()),

    // Reset Configuration
    resetDay: v.optional(v.number()), // Day of month (1-31) for monthly reset
    resetTime: v.number(), // Timestamp of next reset

    // Current State
    currentSpend: v.number(), // USD spent in current period
    lastAlertThreshold: v.number(), // Last threshold that triggered alert
    isPaused: v.boolean(), // Whether agent is paused due to budget

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_agent", ["agentId"])
    .index("by_reset_time", ["resetTime"])
    .index("by_is_paused", ["isPaused"]),

  // ============================================================================
  // DREAMS TABLE (Agent Dreams - Nightly Processing)
  // ============================================================================
  dreams: defineTable({
    agentId: v.string(),
    timestamp: v.number(),
    insights: v.array(v.string()),
    stateSnapshot: v.any(),
    approved: v.boolean(),
  }).index("by_agent", ["agentId"]),

  // ============================================================================
  // TIMELINE EVENTS TABLE (Time Travel Debug)
  // ============================================================================
  timelineEvents: defineTable({
    agentId: v.string(),
    eventType: v.string(),
    timestamp: v.number(),
    data: v.any(),
    cost: v.number(),
  }).index("by_agent_time", ["agentId", "timestamp"]),

  // ============================================================================
  // MARKETPLACE AGENTS TABLE
  // ============================================================================
  marketplace_agents: defineTable({
    // Core Identity
    name: v.string(),
    description: v.string(),
    tagline: v.string(), // Short one-liner for card display
    category: v.string(), // "productivity", "automation", "communication", "development", etc.

    // Publishing Info
    publisherId: v.string(), // User/org who published this agent
    publisherName: v.string(),
    version: v.string(), // "1.0.0"

    // Agent Configuration (template)
    systemPrompt: v.string(),
    model: v.string(),
    provider: v.string(),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),

    // Features
    channels: v.array(v.string()),
    skills: v.array(v.string()), // Skill IDs this agent uses
    tags: v.array(v.string()), // ["email", "customer-service", "ai", etc.]

    // Media
    icon: v.optional(v.string()), // URL to icon/logo
    screenshots: v.optional(v.array(v.string())), // URLs to screenshots
    demoVideo: v.optional(v.string()), // URL to demo video

    // Pricing
    pricingModel: v.union(
      v.literal("free"),
      v.literal("freemium"),
      v.literal("paid"),
    ),
    price: v.optional(v.number()), // USD for paid agents

    // Stats
    installCount: v.number(),
    averageRating: v.number(), // 0-5
    ratingCount: v.number(),
    reviewCount: v.number(),

    // Status & Moderation
    status: v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("published"),
      v.literal("rejected"),
      v.literal("suspended"),
    ),
    moderationNotes: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_publisher", ["publisherId"])
    .index("by_published_at", ["publishedAt"])
    .index("by_install_count", ["installCount"])
    .index("by_rating", ["averageRating"]),

  // ============================================================================
  // MARKETPLACE SKILLS TABLE
  // ============================================================================
  marketplace_skills: defineTable({
    // Core Identity
    name: v.string(),
    description: v.string(),
    tagline: v.string(),
    category: v.string(), // "web", "data", "communication", "files", etc.

    // Publishing Info
    publisherId: v.string(),
    publisherName: v.string(),
    version: v.string(),

    // Skill Details
    permissions: v.array(v.string()), // ["network", "file-read", "file-write", etc.]
    executionType: v.union(
      v.literal("function"),
      v.literal("wasm"),
      v.literal("api"),
    ),

    // Code/Package
    packageUrl: v.optional(v.string()), // URL to WASM package or code
    repositoryUrl: v.optional(v.string()), // GitHub repo

    // Tags & Search
    tags: v.array(v.string()),

    // Media
    icon: v.optional(v.string()),
    screenshots: v.optional(v.array(v.string())),

    // Pricing
    pricingModel: v.union(
      v.literal("free"),
      v.literal("freemium"),
      v.literal("paid"),
    ),
    price: v.optional(v.number()),

    // Stats
    installCount: v.number(),
    averageRating: v.number(),
    ratingCount: v.number(),
    reviewCount: v.number(),

    // Status
    status: v.union(
      v.literal("draft"),
      v.literal("pending"),
      v.literal("published"),
      v.literal("rejected"),
      v.literal("suspended"),
    ),
    moderationNotes: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    publishedAt: v.optional(v.number()),
  })
    .index("by_status", ["status"])
    .index("by_category", ["category"])
    .index("by_publisher", ["publisherId"])
    .index("by_published_at", ["publishedAt"])
    .index("by_install_count", ["installCount"])
    .index("by_rating", ["averageRating"]),

  // ============================================================================
  // MARKETPLACE RATINGS TABLE
  // ============================================================================
  marketplace_ratings: defineTable({
    // Item Reference
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"), // Or marketplace_skills (polymorphic)

    // User & Rating
    userId: v.string(), // External user ID
    rating: v.number(), // 1-5

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_item", ["itemType", "itemId"])
    .index("by_user", ["userId"])
    .index("by_user_and_item", ["userId", "itemId"]),

  // ============================================================================
  // MARKETPLACE REVIEWS TABLE
  // ============================================================================
  marketplace_reviews: defineTable({
    // Item Reference
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"), // Or marketplace_skills (polymorphic)

    // User & Review
    userId: v.string(),
    userName: v.string(), // Display name
    userAvatar: v.optional(v.string()),

    // Review Content
    rating: v.number(), // 1-5 (duplicate from ratings table for convenience)
    title: v.string(),
    content: v.string(),

    // Helpful Votes
    helpfulCount: v.number(),
    notHelpfulCount: v.number(),

    // Verification
    isVerifiedPurchase: v.boolean(), // Did user actually install/buy this?

    // Moderation
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("flagged"),
      v.literal("removed"),
    ),
    moderationNotes: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_item", ["itemType", "itemId"])
    .index("by_user", ["userId"])
    .index("by_status", ["status"])
    .index("by_created", ["createdAt"])
    .index("by_helpful", ["helpfulCount"]),

  // ============================================================================
  // MARKETPLACE PAYOUTS TABLE
  // ============================================================================
  marketplace_payouts: defineTable({
    // Publisher Info
    publisherId: v.string(),
    publisherName: v.string(),

    // Payout Period
    periodStart: v.number(), // Timestamp
    periodEnd: v.number(), // Timestamp

    // Revenue Breakdown
    totalRevenue: v.number(), // Total sales revenue in period (USD)
    platformFee: v.number(), // 30% platform fee (USD)
    creatorPayout: v.number(), // 70% creator payout (USD)

    // Item Breakdown
    itemsSold: v.array(v.object({
      itemType: v.union(v.literal("agent"), v.literal("skill")),
      itemId: v.string(),
      itemName: v.string(),
      salesCount: v.number(),
      revenue: v.number(),
    })),

    // Payment Status
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("on-hold"),
    ),
    failureReason: v.optional(v.string()),

    // Stripe Integration
    stripePayoutId: v.optional(v.string()), // Stripe payout ID
    stripeTransferId: v.optional(v.string()), // Stripe transfer ID

    // Bank Details (encrypted)
    paymentMethod: v.union(
      v.literal("bank_transfer"),
      v.literal("stripe_connect"),
      v.literal("paypal"),
    ),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    paidAt: v.optional(v.number()),
  })
    .index("by_publisher", ["publisherId"])
    .index("by_status", ["status"])
    .index("by_period", ["periodStart", "periodEnd"])
    .index("by_created", ["createdAt"])
    .index("by_paid_at", ["paidAt"]),

  // ============================================================================
  // MARKETPLACE PURCHASES TABLE
  // ============================================================================
  marketplace_purchases: defineTable({
    // Item Reference
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"), // Or marketplace_skills (polymorphic)

    // User & Purchase
    userId: v.string(),
    agentId: v.optional(v.id("agents")), // If installed to a specific agent

    // Purchase Details
    pricePaid: v.number(), // USD (0 for free items)
    paymentMethod: v.optional(v.string()), // "stripe", "paypal", etc.
    transactionId: v.optional(v.string()),

    // License
    licenseType: v.union(
      v.literal("free"),
      v.literal("trial"),
      v.literal("paid"),
      v.literal("subscription"),
    ),
    licenseKey: v.optional(v.string()),
    expiresAt: v.optional(v.number()), // For subscriptions/trials

    // Installation Status
    installStatus: v.union(
      v.literal("pending"),
      v.literal("installed"),
      v.literal("failed"),
      v.literal("uninstalled"),
    ),
    installError: v.optional(v.string()),

    // Usage Stats
    lastUsedAt: v.optional(v.number()),
    usageCount: v.number(),

    // Timestamps
    createdAt: v.number(),
    updatedAt: v.number(),
    installedAt: v.optional(v.number()),
    uninstalledAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_item", ["itemType", "itemId"])
    .index("by_agent", ["agentId"])
    .index("by_user_and_item", ["userId", "itemId"])
    .index("by_install_status", ["installStatus"])
    .index("by_created", ["createdAt"]),
});
