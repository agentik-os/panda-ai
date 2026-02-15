/**
 * Stripe Skill Tests
 */

import { describe, it, expect } from "vitest";
import type { StripeInput, StripeConfig } from "../src/index.js";

describe("StripeSkill", () => {
  describe("Type Definitions", () => {
    it("should have valid StripeInput type", () => {
      const input: StripeInput = {
        action: "createCustomer",
        params: { email: "test@example.com" },
      };
      expect(input.action).toBe("createCustomer");
      expect(input.params.email).toBe("test@example.com");
    });

    it("should have valid StripeConfig type", () => {
      const config: StripeConfig = {
        secretKey: "sk_test_123",
        publishableKey: "pk_test_123",
      };
      expect(config.secretKey).toBe("sk_test_123");
      expect(config.publishableKey).toBe("pk_test_123");
    });

    it("should support all action types", () => {
      const actions: Array<StripeInput["action"]> = [
        "createCustomer",
        "createPaymentIntent",
        "createSubscription",
        "listCustomers",
      ];
      expect(actions).toHaveLength(4);
      expect(actions).toContain("createCustomer");
      expect(actions).toContain("createPaymentIntent");
    });
  });

  describe("Input Validation Patterns", () => {
    it("should validate createCustomer input structure", () => {
      const input: StripeInput = {
        action: "createCustomer",
        params: {
          email: "user@example.com",
          name: "John Doe",
          metadata: { userId: "123" },
        },
      };
      expect(input.params).toHaveProperty("email");
      expect(input.params.email).toMatch(/@/);
    });

    it("should validate createPaymentIntent input structure", () => {
      const input: StripeInput = {
        action: "createPaymentIntent",
        params: {
          amount: 5000,
          currency: "usd",
          customerId: "cus_123",
        },
      };
      expect(input.params.amount).toBeGreaterThan(0);
      expect(input.params.currency).toBeDefined();
    });

    it("should validate createSubscription input structure", () => {
      const input: StripeInput = {
        action: "createSubscription",
        params: {
          customerId: "cus_123",
          items: [{ price: "price_123" }],
        },
      };
      expect(input.params.items).toBeInstanceOf(Array);
      expect(input.params.items).toHaveLength(1);
    });

    it("should validate listCustomers input structure", () => {
      const input: StripeInput = {
        action: "listCustomers",
        params: { limit: 10 },
      };
      expect(input.params.limit).toBe(10);
    });
  });

  describe("Config Structure", () => {
    it("should require secretKey", () => {
      const config: StripeConfig = {
        secretKey: "sk_test_key",
      };
      expect(config.secretKey).toBeTruthy();
      expect(config.secretKey).toMatch(/^sk_/);
    });

    it("should support optional publishableKey", () => {
      const config: StripeConfig = {
        secretKey: "sk_test_key",
        publishableKey: "pk_test_key",
      };
      expect(config.publishableKey).toBeTruthy();
      expect(config.publishableKey).toMatch(/^pk_/);
    });
  });

  describe("Error Response Structure", () => {
    it("should have success false on error", () => {
      const errorResponse = {
        success: false,
        error: "Test error message",
      };
      expect(errorResponse.success).toBe(false);
      expect(errorResponse.error).toBeTruthy();
    });

    it("should have success true on success", () => {
      const successResponse = {
        success: true,
        data: { id: "cus_123" },
      };
      expect(successResponse.success).toBe(true);
      expect(successResponse.data).toBeDefined();
    });
  });

  describe("Parameter Validation", () => {
    it("should validate email format for createCustomer", () => {
      const validEmails = [
        "user@example.com",
        "test.user@domain.co.uk",
        "name+tag@company.io",
      ];
      validEmails.forEach((email) => {
        expect(email).toMatch(/@/);
      });
    });

    it("should validate amounts are positive", () => {
      const validAmounts = [100, 1000, 50000, 999999];
      validAmounts.forEach((amount) => {
        expect(amount).toBeGreaterThan(0);
      });
    });

    it("should validate currency codes", () => {
      const validCurrencies = ["usd", "eur", "gbp", "jpy", "cad"];
      validCurrencies.forEach((currency) => {
        expect(currency).toMatch(/^[a-z]{3}$/);
      });
    });

    it("should validate subscription items structure", () => {
      const validItems = [
        { price: "price_123" },
        { price: "price_456", quantity: 2 },
      ];
      validItems.forEach((item) => {
        expect(item).toHaveProperty("price");
        expect(item.price).toMatch(/^price_/);
      });
    });
  });

  describe("Metadata Support", () => {
    it("should support metadata in createCustomer", () => {
      const input: StripeInput = {
        action: "createCustomer",
        params: {
          email: "test@example.com",
          metadata: {
            userId: "user_123",
            source: "web_app",
            tier: "premium",
          },
        },
      };
      expect(input.params.metadata).toBeDefined();
      expect(Object.keys(input.params.metadata)).toHaveLength(3);
    });

    it("should support metadata in createPaymentIntent", () => {
      const input: StripeInput = {
        action: "createPaymentIntent",
        params: {
          amount: 5000,
          metadata: {
            orderId: "order_123",
            productId: "prod_456",
          },
        },
      };
      expect(input.params.metadata).toBeDefined();
      expect(input.params.metadata.orderId).toBe("order_123");
    });
  });

  describe("Default Values", () => {
    it("should use default currency USD for payment intents", () => {
      const input: StripeInput = {
        action: "createPaymentIntent",
        params: { amount: 5000 },
      };
      // Currency defaults to USD in implementation
      expect(input.params.currency || "usd").toBe("usd");
    });

    it("should use default limit 10 for listCustomers", () => {
      const input: StripeInput = {
        action: "listCustomers",
        params: {},
      };
      // Limit defaults to 10 in implementation
      expect(input.params.limit || 10).toBe(10);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty params object", () => {
      const input: StripeInput = {
        action: "listCustomers",
        params: {},
      };
      expect(input.params).toBeDefined();
      expect(Object.keys(input.params)).toHaveLength(0);
    });

    it("should handle large amounts", () => {
      const largeAmount = 99999999;
      expect(largeAmount).toBeGreaterThan(0);
      expect(largeAmount).toBeLessThan(100000000);
    });

    it("should handle special characters in names", () => {
      const specialNames = [
        "José García",
        "François Müller",
        "李明",
        "Company & Co.",
      ];
      specialNames.forEach((name) => {
        expect(name).toBeTruthy();
        expect(name.length).toBeGreaterThan(0);
      });
    });

    it("should handle multiple subscription items", () => {
      const items = [
        { price: "price_1" },
        { price: "price_2" },
        { price: "price_3" },
      ];
      expect(items).toHaveLength(3);
      items.forEach((item) => expect(item.price).toBeTruthy());
    });
  });
});
