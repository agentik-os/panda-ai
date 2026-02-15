"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api, type Id } from "@/lib/convex";
import { notFound } from "next/navigation";
import { Star, Download, DollarSign, ExternalLink, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ReviewsSection } from "@/components/marketplace/reviews-section";
import { InstallButton } from "@/components/marketplace/install-button";
import Link from "next/link";

interface MarketplaceDetailPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Marketplace Agent/Skill Detail Page
 * - Full description and documentation
 * - Screenshots and demo video
 * - Reviews and ratings
 * - Install button
 * - Live preview link
 */
export default function MarketplaceDetailPage({ params }: MarketplaceDetailPageProps) {
  const { id } = use(params);

  // Try to fetch as agent first
  const agent = useQuery(api.queries.marketplace.getAgent, {
    id: id as Id<"marketplace_agents">,
  });

  // If agent is null, try as skill
  const skill = agent === null ? useQuery(api.queries.marketplace.getSkill, {
    id: id as Id<"marketplace_skills">,
  }) : null;

  const item = agent || skill;
  const itemType = agent ? "agent" : "skill";

  // Get reviews
  const reviews = useQuery(api.queries.marketplace.getReviews, {
    itemType,
    itemId: id as Id<"marketplace_agents">,
    limit: 20,
    sortBy: "recent",
  });

  if (item === undefined || reviews === undefined) {
    return <DetailPageSkeleton />;
  }

  if (item === null) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                {item.icon ? (
                  <img
                    src={item.icon}
                    alt={item.name}
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-3xl">
                    {item.name[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h1 className="text-3xl font-bold">{item.name}</h1>
                  <p className="text-muted-foreground">
                    by {item.publisherName} • v{item.version}
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {item.category}
              </Badge>
            </div>

            <p className="text-lg">{item.tagline}</p>

            {/* Stats */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                <span className="font-semibold">{item.averageRating.toFixed(1)}</span>
                <span className="text-muted-foreground">({item.ratingCount} ratings)</span>
              </div>
              <div className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span className="font-semibold">{item.installCount.toLocaleString()}</span>
                <span className="text-muted-foreground">installs</span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag: string) => (
                <Badge key={tag} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Tabs: Overview, Screenshots, Reviews */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="screenshots">Screenshots</TabsTrigger>
              <TabsTrigger value="reviews">Reviews ({reviews.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p>{item.description}</p>
              </div>

              {item.demoVideo && (
                <Card>
                  <CardHeader>
                    <CardTitle>Demo Video</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <video
                      src={item.demoVideo}
                      controls
                      className="w-full rounded-lg"
                    />
                  </CardContent>
                </Card>
              )}

              {itemType === "skill" && (skill as any).permissions && (
                <Card>
                  <CardHeader>
                    <CardTitle>Required Permissions</CardTitle>
                    <CardDescription>
                      This skill requires the following permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1">
                      {(skill as any).permissions.map((perm: string) => (
                        <li key={perm} className="capitalize">
                          {perm.replace("-", " ")}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="screenshots">
              {item.screenshots && item.screenshots.length > 0 ? (
                <div className="grid grid-cols-2 gap-4">
                  {item.screenshots.map((screenshot: string, index: number) => (
                    <img
                      key={index}
                      src={screenshot}
                      alt={`Screenshot ${index + 1}`}
                      className="rounded-lg border"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No screenshots available</p>
              )}
            </TabsContent>

            <TabsContent value="reviews">
              <ReviewsSection
                itemType={itemType}
                itemId={id as Id<"marketplace_agents">}
                reviews={reviews}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Pricing Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {item.pricingModel === "free" ? (
                  <Badge variant="outline" className="text-green-600 text-lg px-3 py-1">
                    Free
                  </Badge>
                ) : item.pricingModel === "freemium" ? (
                  <Badge variant="outline" className="text-blue-600 text-lg px-3 py-1">
                    Freemium
                  </Badge>
                ) : (
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-6 w-6" />
                    <span className="text-2xl font-bold">
                      {item.price ? `$${item.price}` : "Paid"}
                    </span>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InstallButton
                itemType={itemType}
                itemId={id as Id<"marketplace_agents">}
                item={item}
              />

              <Link href={`/marketplace/${id}/preview`}>
                <Button variant="outline" className="w-full">
                  <Play className="h-4 w-4 mr-2" />
                  Try Live Preview
                </Button>
              </Link>

              {(item as any).repositoryUrl && (
                <a
                  href={(item as any).repositoryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button variant="ghost" className="w-full">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Source
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>

          {/* Publisher Info */}
          <Card>
            <CardHeader>
              <CardTitle>Publisher</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{item.publisherName}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Published {new Date((item as any).publishedAt || item.createdAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          {/* Technical Details */}
          {itemType === "agent" && (
            <Card>
              <CardHeader>
                <CardTitle>Technical Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Model:</span>{" "}
                  <span className="font-medium">{(item as any).model}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Provider:</span>{" "}
                  <span className="font-medium capitalize">{(item as any).provider}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Channels:</span>{" "}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {(item as any).channels.map((channel: string) => (
                      <Badge key={channel} variant="outline" className="text-xs">
                        {channel}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailPageSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-64" />
          <Skeleton className="h-96" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}
