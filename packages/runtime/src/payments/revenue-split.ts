/**
 * Revenue Split Calculation
 *
 * Handles marketplace revenue distribution (70% creator, 30% platform)
 */

/**
 * Revenue split configuration
 */
export const REVENUE_SPLIT = {
  CREATOR_PERCENTAGE: 0.7, // 70% to creator
  PLATFORM_PERCENTAGE: 0.3, // 30% to platform
} as const;

/**
 * Sale item for payout calculation
 */
export interface SaleItem {
  itemType: "agent" | "skill";
  itemId: string;
  itemName: string;
  salesCount: number;
  revenue: number;
}

/**
 * Payout calculation result
 */
export interface PayoutCalculation {
  publisherId: string;
  publisherName: string;
  periodStart: number;
  periodEnd: number;
  totalRevenue: number;
  platformFee: number;
  creatorPayout: number;
  itemsSold: SaleItem[];
}

/**
 * Calculate revenue split for a single transaction
 *
 * @param amount - Total transaction amount in cents
 * @returns Split breakdown
 */
export function calculateRevenueSplit(amount: number): {
  totalRevenue: number;
  platformFee: number;
  creatorPayout: number;
} {
  const totalRevenue = amount;
  const platformFee = Math.round(totalRevenue * REVENUE_SPLIT.PLATFORM_PERCENTAGE);
  const creatorPayout = Math.round(totalRevenue * REVENUE_SPLIT.CREATOR_PERCENTAGE);

  return {
    totalRevenue,
    platformFee,
    creatorPayout,
  };
}

/**
 * Calculate payout for a publisher over a period
 *
 * @param publisherId - Publisher ID
 * @param publisherName - Publisher name
 * @param periodStart - Period start timestamp
 * @param periodEnd - Period end timestamp
 * @param sales - Sales data for the period
 */
export function calculatePublisherPayout(
  publisherId: string,
  publisherName: string,
  periodStart: number,
  periodEnd: number,
  sales: SaleItem[],
): PayoutCalculation {
  // Calculate total revenue from all sales
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.revenue, 0);

  // Apply revenue split
  const { platformFee, creatorPayout } = calculateRevenueSplit(totalRevenue);

  return {
    publisherId,
    publisherName,
    periodStart,
    periodEnd,
    totalRevenue,
    platformFee,
    creatorPayout,
    itemsSold: sales,
  };
}

/**
 * Aggregate sales by item
 *
 * Useful for grouping multiple purchase records into summary by item
 */
export function aggregateSalesByItem(
  purchases: Array<{
    itemType: "agent" | "skill";
    itemId: string;
    itemName: string;
    pricePaid: number;
  }>,
): SaleItem[] {
  const itemMap = new Map<string, SaleItem>();

  for (const purchase of purchases) {
    const existing = itemMap.get(purchase.itemId);

    if (existing) {
      existing.salesCount += 1;
      existing.revenue += purchase.pricePaid;
    } else {
      itemMap.set(purchase.itemId, {
        itemType: purchase.itemType,
        itemId: purchase.itemId,
        itemName: purchase.itemName,
        salesCount: 1,
        revenue: purchase.pricePaid,
      });
    }
  }

  return Array.from(itemMap.values());
}

/**
 * Validate payout minimum threshold
 *
 * Most payment processors have minimum payout amounts
 */
export function meetsPayoutThreshold(
  amount: number,
  minimumThreshold = 1000, // $10.00 in cents
): boolean {
  return amount >= minimumThreshold;
}

/**
 * Calculate platform fees for a period
 *
 * Useful for financial reporting
 */
export function calculatePlatformRevenue(
  payouts: PayoutCalculation[],
): {
  totalRevenue: number;
  totalPlatformFees: number;
  totalCreatorPayouts: number;
  payoutCount: number;
} {
  const totalRevenue = payouts.reduce((sum, p) => sum + p.totalRevenue, 0);
  const totalPlatformFees = payouts.reduce((sum, p) => sum + p.platformFee, 0);
  const totalCreatorPayouts = payouts.reduce(
    (sum, p) => sum + p.creatorPayout,
    0,
  );

  return {
    totalRevenue,
    totalPlatformFees,
    totalCreatorPayouts,
    payoutCount: payouts.length,
  };
}

/**
 * Format amount in cents to dollars
 */
export function formatCurrency(cents: number): string {
  const dollars = cents / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(dollars);
}

/**
 * Calculate payout schedule
 *
 * Returns start/end timestamps for payout periods
 * Default: Monthly payouts on the 1st of each month
 */
export function getPayoutPeriod(
  date: Date = new Date(),
): {
  periodStart: number;
  periodEnd: number;
} {
  // Previous month
  const periodStart = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  const periodEnd = new Date(date.getFullYear(), date.getMonth(), 1);

  return {
    periodStart: periodStart.getTime(),
    periodEnd: periodEnd.getTime(),
  };
}
