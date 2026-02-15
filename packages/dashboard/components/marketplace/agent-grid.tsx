"use client";

import Link from "next/link";
import { Star, Download, DollarSign } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MarketplaceItem {
  _id: string;
  name: string;
  description: string;
  tagline: string;
  category: string;
  publisherName: string;
  version: string;
  pricingModel: "free" | "freemium" | "paid";
  price?: number;
  icon?: string;
  tags: string[];
  averageRating: number;
  ratingCount: number;
  installCount: number;
}

interface AgentGridProps {
  items: MarketplaceItem[];
  itemType: "agent" | "skill";
}

/**
 * Agent/Skill Grid Component
 * - Displays marketplace items in a responsive grid
 * - Shows rating, price, downloads
 * - Links to detail page
 */
export function AgentGrid({ items, itemType: _itemType }: AgentGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {items.map((item) => (
        <Link key={item._id} href={`/marketplace/${item._id}`}>
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              {/* Icon */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  {item.icon ? (
                    <img
                      src={item.icon}
                      alt={item.name}
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                      {(item.name[0] ?? "?").toUpperCase()}
                    </div>
                  )}
                  <div>
                    <CardTitle className="text-lg">{item.name}</CardTitle>
                    <CardDescription className="text-xs">
                      by {item.publisherName}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {item.category}
                </Badge>
              </div>

              {/* Tagline */}
              <CardDescription className="mt-2 line-clamp-2">
                {item.tagline}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Tags */}
              <div className="flex flex-wrap gap-1">
                {item.tags.slice(0, 3).map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {item.tags.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{item.tags.length - 3}
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                {/* Rating */}
                {item.averageRating > 0 && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium">
                      {item.averageRating.toFixed(1)}
                    </span>
                    <span>({item.ratingCount})</span>
                  </div>
                )}

                {/* Downloads */}
                <div className="flex items-center space-x-1">
                  <Download className="h-4 w-4" />
                  <span>{formatNumber(item.installCount)}</span>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex items-center justify-between">
              {/* Pricing */}
              <div className="flex items-center space-x-1">
                {item.pricingModel === "free" ? (
                  <Badge variant="outline" className="text-green-600">
                    Free
                  </Badge>
                ) : item.pricingModel === "freemium" ? (
                  <Badge variant="outline" className="text-blue-600">
                    Freemium
                  </Badge>
                ) : (
                  <>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="font-semibold">
                      {item.price ? `$${item.price}` : "Paid"}
                    </span>
                  </>
                )}
              </div>

              {/* Version */}
              <span className="text-xs text-muted-foreground">
                v{item.version}
              </span>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}

function formatNumber(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toString();
}
