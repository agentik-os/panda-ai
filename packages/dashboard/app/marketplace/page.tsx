"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { SearchBar } from "@/components/marketplace/search-bar";
import { Filters } from "@/components/marketplace/filters";
import { AgentGrid } from "@/components/marketplace/agent-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

/**
 * Marketplace Browse Page
 * - Search agents and skills
 * - Filter by category, price, rating
 * - View popular, trending, new items
 */
export default function MarketplacePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedPricing, setSelectedPricing] = useState<string | null>(null);
  const [minRating, setMinRating] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"agents" | "skills">("agents");

  // Query marketplace items
  const agentsRaw = useQuery(api.queries.marketplace.listAgents, {
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
    sortBy: "popular",
  });

  const skillsRaw = useQuery(api.queries.marketplace.listSkills, {
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
    sortBy: "popular",
  });

  const isLoading = agentsRaw === undefined || skillsRaw === undefined;

  // Client-side filtering for pricing and rating
  const agents = agentsRaw
    ? agentsRaw.filter((item: any) => {
        if (selectedPricing && item.pricingModel !== selectedPricing) return false;
        if (minRating && item.averageRating < minRating) return false;
        return true;
      })
    : undefined;

  const skills = skillsRaw
    ? skillsRaw.filter((item: any) => {
        if (selectedPricing && item.pricingModel !== selectedPricing) return false;
        if (minRating && item.averageRating < minRating) return false;
        return true;
      })
    : undefined;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-4xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground">
          Discover and install AI agents and skills to enhance your workflow
        </p>
      </div>

      {/* Search */}
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={`Search ${activeTab}...`}
      />

      {/* Tabs: Agents vs Skills */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "agents" | "skills")}>
        <TabsList>
          <TabsTrigger value="agents">
            Agents {agents && `(${agents.length})`}
          </TabsTrigger>
          <TabsTrigger value="skills">
            Skills {skills && `(${skills.length})`}
          </TabsTrigger>
        </TabsList>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mt-6">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <Filters
              itemType={activeTab}
              selectedCategory={selectedCategory}
              onCategoryChange={setSelectedCategory}
              selectedPricing={selectedPricing}
              onPricingChange={setSelectedPricing}
              minRating={minRating}
              onRatingChange={setMinRating}
            />
          </div>

          {/* Results Grid */}
          <div className="lg:col-span-3">
            <TabsContent value="agents" className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-64" />
                  ))}
                </div>
              ) : agents && agents.length > 0 ? (
                <AgentGrid items={agents} itemType="agent" />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No agents found</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="skills" className="mt-0">
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-64" />
                  ))}
                </div>
              ) : skills && skills.length > 0 ? (
                <AgentGrid items={skills} itemType="skill" />
              ) : (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No skills found</p>
                </div>
              )}
            </TabsContent>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
