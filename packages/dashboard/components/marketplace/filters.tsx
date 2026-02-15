"use client";

import { Star } from "lucide-react";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface FiltersProps {
  itemType: "agents" | "skills";
  selectedCategory: string | null;
  onCategoryChange: (category: string | null) => void;
  selectedPricing: string | null;
  onPricingChange: (pricing: string | null) => void;
  minRating: number | null;
  onRatingChange: (rating: number | null) => void;
}

const AGENT_CATEGORIES = [
  "productivity",
  "automation",
  "communication",
  "development",
  "customer-service",
  "data-analysis",
  "creative",
  "education",
];

const SKILL_CATEGORIES = [
  "web",
  "data",
  "communication",
  "files",
  "automation",
  "security",
  "integration",
  "utilities",
];

const PRICING_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "freemium", label: "Freemium" },
  { value: "paid", label: "Paid" },
];

/**
 * Marketplace Filters Sidebar
 * - Category filter
 * - Pricing model filter
 * - Minimum rating filter
 */
export function Filters({
  itemType,
  selectedCategory,
  onCategoryChange,
  selectedPricing,
  onPricingChange,
  minRating,
  onRatingChange,
}: FiltersProps) {
  const categories = itemType === "agents" ? AGENT_CATEGORIES : SKILL_CATEGORIES;

  const handleReset = () => {
    onCategoryChange(null);
    onPricingChange(null);
    onRatingChange(null);
  };

  const hasFilters = selectedCategory || selectedPricing || minRating;

  return (
    <div className="space-y-6 sticky top-6">
      {/* Reset Button */}
      {hasFilters && (
        <Button variant="outline" size="sm" onClick={handleReset} className="w-full">
          Reset Filters
        </Button>
      )}

      {/* Category Filter */}
      <div>
        <Label className="text-sm font-semibold">Category</Label>
        <RadioGroup value={selectedCategory || ""} onValueChange={onCategoryChange}>
          <div className="space-y-2 mt-3">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <RadioGroupItem value={category} id={`category-${category}`} />
                <Label
                  htmlFor={`category-${category}`}
                  className="text-sm font-normal capitalize cursor-pointer"
                >
                  {category.replace("-", " ")}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Pricing Filter */}
      <div>
        <Label className="text-sm font-semibold">Pricing</Label>
        <RadioGroup value={selectedPricing || ""} onValueChange={onPricingChange}>
          <div className="space-y-2 mt-3">
            {PRICING_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <RadioGroupItem value={option.value} id={`pricing-${option.value}`} />
                <Label
                  htmlFor={`pricing-${option.value}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>
      </div>

      <Separator />

      {/* Rating Filter */}
      <div>
        <Label className="text-sm font-semibold">Minimum Rating</Label>
        <div className="space-y-2 mt-3">
          {[5, 4, 3, 2, 1].map((rating) => (
            <button
              key={rating}
              onClick={() => onRatingChange(rating === minRating ? null : rating)}
              className={`flex items-center space-x-2 w-full px-2 py-1 rounded hover:bg-accent ${
                minRating === rating ? "bg-accent" : ""
              }`}
            >
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm">& up</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
