"use client";

import { Star } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Id } from "@/lib/convex";

interface Review {
  _id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  content: string;
  helpfulCount: number;
  isVerifiedPurchase: boolean;
  createdAt: number;
}

interface ReviewsSectionProps {
  itemType: "agent" | "skill";
  itemId: Id<"marketplace_agents">;
  reviews: Review[];
}

/**
 * Reviews Section Component
 * - Displays user reviews for an agent/skill
 * - Shows rating, title, content
 * - Verified purchase badge
 */
export function ReviewsSection({ reviews }: ReviewsSectionProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <Card key={review._id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <Avatar>
                  {review.userAvatar && <AvatarImage src={review.userAvatar} />}
                  <AvatarFallback>
                    {review.userName[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <p className="font-semibold">{review.userName}</p>
                    {review.isVerifiedPurchase && (
                      <Badge variant="secondary" className="text-xs">
                        Verified Purchase
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Rating */}
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < review.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-2">
            <h4 className="font-semibold">{review.title}</h4>
            <p className="text-sm text-muted-foreground">{review.content}</p>

            {review.helpfulCount > 0 && (
              <p className="text-xs text-muted-foreground mt-2">
                {review.helpfulCount} {review.helpfulCount === 1 ? "person" : "people"} found
                this helpful
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
