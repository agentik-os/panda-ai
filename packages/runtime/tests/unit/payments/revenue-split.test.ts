/**
 * Revenue Split Tests
 *
 * Unit tests for marketplace revenue calculations
 */

import { describe, it, expect } from "vitest";
import {
  calculateRevenueSplit,
  calculatePublisherPayout,
  aggregateSalesByItem,
  meetsPayoutThreshold,
  calculatePlatformRevenue,
  formatCurrency,
  getPayoutPeriod,
  REVENUE_SPLIT,
} from "../../../src/payments/revenue-split";

describe("Revenue Split Calculations", () => {
  describe("calculateRevenueSplit", () => {
    it("should split $100 correctly (70/30)", () => {
      const result = calculateRevenueSplit(10000); // $100.00

      expect(result.totalRevenue).toBe(10000);
      expect(result.platformFee).toBe(3000); // 30%
      expect(result.creatorPayout).toBe(7000); // 70%
    });

    it("should split $19.99 correctly", () => {
      const result = calculateRevenueSplit(1999); // $19.99

      expect(result.totalRevenue).toBe(1999);
      expect(result.platformFee).toBe(600); // ~30% (rounded)
      expect(result.creatorPayout).toBe(1399); // ~70% (rounded)
    });

    it("should handle zero amount", () => {
      const result = calculateRevenueSplit(0);

      expect(result.totalRevenue).toBe(0);
      expect(result.platformFee).toBe(0);
      expect(result.creatorPayout).toBe(0);
    });

    it("should round amounts correctly", () => {
      const result = calculateRevenueSplit(1000); // $10.00

      expect(result.platformFee).toBe(300); // Exact 30%
      expect(result.creatorPayout).toBe(700); // Exact 70%
      expect(result.platformFee + result.creatorPayout).toBe(1000);
    });
  });

  describe("calculatePublisherPayout", () => {
    it("should calculate payout for single item", () => {
      const sales = [
        {
          itemType: "agent" as const,
          itemId: "agent_1",
          itemName: "AI Assistant",
          salesCount: 5,
          revenue: 9995, // 5 sales @ $19.99
        },
      ];

      const result = calculatePublisherPayout(
        "pub_123",
        "John Doe",
        1704067200000, // Jan 1, 2024
        1706745600000, // Feb 1, 2024
        sales,
      );

      expect(result.publisherId).toBe("pub_123");
      expect(result.publisherName).toBe("John Doe");
      expect(result.totalRevenue).toBe(9995);
      expect(result.platformFee).toBe(2999); // ~30%
      expect(result.creatorPayout).toBe(6997); // ~70%
      expect(result.itemsSold).toEqual(sales);
    });

    it("should calculate payout for multiple items", () => {
      const sales = [
        {
          itemType: "agent" as const,
          itemId: "agent_1",
          itemName: "AI Assistant",
          salesCount: 10,
          revenue: 19990,
        },
        {
          itemType: "skill" as const,
          itemId: "skill_1",
          itemName: "Web Scraper",
          salesCount: 3,
          revenue: 2997,
        },
      ];

      const result = calculatePublisherPayout(
        "pub_456",
        "Jane Smith",
        1704067200000,
        1706745600000,
        sales,
      );

      expect(result.totalRevenue).toBe(22987); // 19990 + 2997
      expect(result.platformFee).toBe(6896); // ~30%
      expect(result.creatorPayout).toBe(16091); // ~70%
    });

    it("should handle no sales", () => {
      const result = calculatePublisherPayout(
        "pub_789",
        "Empty Publisher",
        1704067200000,
        1706745600000,
        [],
      );

      expect(result.totalRevenue).toBe(0);
      expect(result.platformFee).toBe(0);
      expect(result.creatorPayout).toBe(0);
      expect(result.itemsSold).toEqual([]);
    });
  });

  describe("aggregateSalesByItem", () => {
    it("should aggregate multiple purchases of same item", () => {
      const purchases = [
        {
          itemType: "agent" as const,
          itemId: "agent_1",
          itemName: "AI Assistant",
          pricePaid: 1999,
        },
        {
          itemType: "agent" as const,
          itemId: "agent_1",
          itemName: "AI Assistant",
          pricePaid: 1999,
        },
        {
          itemType: "agent" as const,
          itemId: "agent_1",
          itemName: "AI Assistant",
          pricePaid: 1999,
        },
      ];

      const result = aggregateSalesByItem(purchases);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        itemType: "agent",
        itemId: "agent_1",
        itemName: "AI Assistant",
        salesCount: 3,
        revenue: 5997,
      });
    });

    it("should aggregate purchases of different items", () => {
      const purchases = [
        {
          itemType: "agent" as const,
          itemId: "agent_1",
          itemName: "AI Assistant",
          pricePaid: 1999,
        },
        {
          itemType: "skill" as const,
          itemId: "skill_1",
          itemName: "Web Scraper",
          pricePaid: 999,
        },
        {
          itemType: "agent" as const,
          itemId: "agent_1",
          itemName: "AI Assistant",
          pricePaid: 1999,
        },
      ];

      const result = aggregateSalesByItem(purchases);

      expect(result).toHaveLength(2);
      expect(result.find((s) => s.itemId === "agent_1")).toEqual({
        itemType: "agent",
        itemId: "agent_1",
        itemName: "AI Assistant",
        salesCount: 2,
        revenue: 3998,
      });
      expect(result.find((s) => s.itemId === "skill_1")).toEqual({
        itemType: "skill",
        itemId: "skill_1",
        itemName: "Web Scraper",
        salesCount: 1,
        revenue: 999,
      });
    });

    it("should handle empty purchases array", () => {
      const result = aggregateSalesByItem([]);
      expect(result).toEqual([]);
    });
  });

  describe("meetsPayoutThreshold", () => {
    it("should meet default threshold of $10", () => {
      expect(meetsPayoutThreshold(1000)).toBe(true); // $10.00
      expect(meetsPayoutThreshold(1001)).toBe(true); // $10.01
      expect(meetsPayoutThreshold(10000)).toBe(true); // $100.00
    });

    it("should not meet default threshold", () => {
      expect(meetsPayoutThreshold(999)).toBe(false); // $9.99
      expect(meetsPayoutThreshold(500)).toBe(false); // $5.00
      expect(meetsPayoutThreshold(0)).toBe(false); // $0.00
    });

    it("should respect custom threshold", () => {
      expect(meetsPayoutThreshold(5000, 5000)).toBe(true); // $50 threshold
      expect(meetsPayoutThreshold(4999, 5000)).toBe(false);
    });
  });

  describe("calculatePlatformRevenue", () => {
    it("should calculate total platform revenue", () => {
      const payouts = [
        {
          publisherId: "pub_1",
          publisherName: "Publisher 1",
          periodStart: 1704067200000,
          periodEnd: 1706745600000,
          totalRevenue: 10000,
          platformFee: 3000,
          creatorPayout: 7000,
          itemsSold: [],
        },
        {
          publisherId: "pub_2",
          publisherName: "Publisher 2",
          periodStart: 1704067200000,
          periodEnd: 1706745600000,
          totalRevenue: 5000,
          platformFee: 1500,
          creatorPayout: 3500,
          itemsSold: [],
        },
      ];

      const result = calculatePlatformRevenue(payouts);

      expect(result.totalRevenue).toBe(15000);
      expect(result.totalPlatformFees).toBe(4500);
      expect(result.totalCreatorPayouts).toBe(10500);
      expect(result.payoutCount).toBe(2);
    });

    it("should handle empty payouts", () => {
      const result = calculatePlatformRevenue([]);

      expect(result.totalRevenue).toBe(0);
      expect(result.totalPlatformFees).toBe(0);
      expect(result.totalCreatorPayouts).toBe(0);
      expect(result.payoutCount).toBe(0);
    });
  });

  describe("formatCurrency", () => {
    it("should format cents to USD", () => {
      expect(formatCurrency(1999)).toBe("$19.99");
      expect(formatCurrency(10000)).toBe("$100.00");
      expect(formatCurrency(0)).toBe("$0.00");
      expect(formatCurrency(1)).toBe("$0.01");
    });
  });

  describe("getPayoutPeriod", () => {
    it("should return previous month period", () => {
      // Feb 15, 2024
      const date = new Date(2024, 1, 15);
      const result = getPayoutPeriod(date);

      // Period should be Jan 1 - Feb 1
      expect(new Date(result.periodStart).toISOString()).toBe(
        "2024-01-01T00:00:00.000Z",
      );
      expect(new Date(result.periodEnd).toISOString()).toBe(
        "2024-02-01T00:00:00.000Z",
      );
    });

    it("should handle year boundary", () => {
      // Jan 15, 2024
      const date = new Date(2024, 0, 15);
      const result = getPayoutPeriod(date);

      // Period should be Dec 1, 2023 - Jan 1, 2024
      expect(new Date(result.periodStart).toISOString()).toBe(
        "2023-12-01T00:00:00.000Z",
      );
      expect(new Date(result.periodEnd).toISOString()).toBe(
        "2024-01-01T00:00:00.000Z",
      );
    });
  });

  describe("REVENUE_SPLIT constants", () => {
    it("should have correct split percentages", () => {
      expect(REVENUE_SPLIT.CREATOR_PERCENTAGE).toBe(0.7);
      expect(REVENUE_SPLIT.PLATFORM_PERCENTAGE).toBe(0.3);
    });

    it("should sum to 100%", () => {
      const total =
        REVENUE_SPLIT.CREATOR_PERCENTAGE + REVENUE_SPLIT.PLATFORM_PERCENTAGE;
      expect(total).toBe(1.0);
    });
  });
});
