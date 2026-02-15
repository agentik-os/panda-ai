"use client";

import { useState } from "react";
import type { Id } from "@/lib/convex";
import { Button } from "@/components/ui/button";
import { Download, Check, Loader2 } from "lucide-react";

interface InstallButtonProps {
  itemType: "agent" | "skill";
  itemId: Id<"marketplace_agents">;
  item: {
    name: string;
    pricingModel: "free" | "freemium" | "paid";
    price?: number;
  };
}

/**
 * Install Button Component
 * - Handles installing agents/skills from marketplace
 * - Shows loading state during installation
 * - Handles paid items with Stripe checkout
 */
export function InstallButton({ itemType, itemId, item }: InstallButtonProps) {
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  const handleInstall = async () => {
    try {
      setIsInstalling(true);

      // For paid items, redirect to Stripe checkout
      if (item.pricingModel === "paid" && item.price) {
        // TODO: Implement Stripe checkout redirect
        window.location.href = `/api/stripe/checkout?itemType=${itemType}&itemId=${itemId}`;
        return;
      }

      // For free items, install directly
      // TODO: Call Convex mutation to install item
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setIsInstalled(true);
    } catch (error) {
      console.error("Installation failed:", error);
    } finally {
      setIsInstalling(false);
    }
  };

  return (
    <Button
      onClick={handleInstall}
      disabled={isInstalling || isInstalled}
      className="w-full"
      size="lg"
    >
      {isInstalling ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Installing...
        </>
      ) : isInstalled ? (
        <>
          <Check className="h-4 w-4 mr-2" />
          Installed
        </>
      ) : (
        <>
          <Download className="h-4 w-4 mr-2" />
          {item.pricingModel === "free" ? "Install" : `Install for $${item.price || "?"}`}
        </>
      )}
    </Button>
  );
}
