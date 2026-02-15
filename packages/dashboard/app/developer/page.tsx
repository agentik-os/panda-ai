"use client";

import { useQuery } from "convex/react";
import { api } from "@/lib/convex";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DollarSign,
  Download,
  Star,
  TrendingUp,
  Package,
  Users,
  BarChart3,
  Plus,
} from "lucide-react";
import Link from "next/link";

/**
 * Developer Dashboard
 * - Analytics for published agents/skills
 * - Revenue tracking and payouts
 * - Install and usage metrics
 * - Reviews and ratings
 */
export default function DeveloperPage() {
  // TODO: Get authenticated user's published items
  // For now, using placeholder queries
  const publishedAgents = useQuery(api.queries.marketplace.listAgents, {
    sortBy: "recent",
  });

  const publishedSkills = useQuery(api.queries.marketplace.listSkills, {
    sortBy: "recent",
  });

  if (publishedAgents === undefined || publishedSkills === undefined) {
    return <DashboardSkeleton />;
  }

  // Calculate total metrics (placeholder - should filter by authenticated user)
  const totalRevenue = 12450.0; // TODO: Sum from marketplace_payouts
  const totalInstalls = publishedAgents?.reduce((sum: number, item: any) => sum + item.installCount, 0) || 0;
  const totalReviews = publishedAgents?.reduce((sum: number, item: any) => sum + item.ratingCount, 0) || 0;
  const avgRating =
    publishedAgents && publishedAgents.length > 0
      ? publishedAgents.reduce((sum: number, item: any) => sum + item.averageRating, 0) / publishedAgents.length
      : 0;

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">Developer Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your published agents and skills
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Publish New
        </Button>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Installs</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInstalls.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+23%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              From {totalReviews} reviews
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Published Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(publishedAgents?.length || 0) + (publishedSkills?.length || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {publishedAgents?.length || 0} agents, {publishedSkills?.length || 0} skills
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>Last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                  <p>Chart visualization coming soon</p>
                  <p className="text-xs">Integration with charting library needed</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Purchases</CardTitle>
              <CardDescription>Latest sales from your items</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Placeholder data - should come from marketplace_purchases */}
                {[
                  { item: "AI Assistant Pro", buyer: "user_123", amount: 29.99, date: "2h ago" },
                  { item: "Data Analyzer", buyer: "user_456", amount: 49.99, date: "5h ago" },
                  { item: "Code Helper", buyer: "user_789", amount: 19.99, date: "1d ago" },
                ].map((purchase, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="font-medium">{purchase.item}</p>
                      <p className="text-xs text-muted-foreground">
                        Purchased by {purchase.buyer}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${purchase.amount}</p>
                      <p className="text-xs text-muted-foreground">{purchase.date}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {publishedAgents && publishedAgents.length > 0 ? (
              publishedAgents.map((agent: any) => (
                <Card key={agent._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {agent.icon ? (
                          <img
                            src={agent.icon}
                            alt={agent.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xl">
                            {agent.name[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <CardTitle>{agent.name}</CardTitle>
                          <CardDescription>v{agent.version}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {agent.pricingModel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{agent.installCount}</div>
                        <p className="text-xs text-muted-foreground">Installs</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{agent.averageRating.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{agent.ratingCount}</div>
                        <p className="text-xs text-muted-foreground">Reviews</p>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Link href={`/marketplace/${agent._id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          View Listing
                        </Button>
                      </Link>
                      <Button variant="outline">Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No published agents yet</p>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Publish Your First Agent
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Skills Tab */}
        <TabsContent value="skills" className="space-y-4">
          <div className="grid grid-cols-1 gap-4">
            {publishedSkills && publishedSkills.length > 0 ? (
              publishedSkills.map((skill: any) => (
                <Card key={skill._id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        {skill.icon ? (
                          <img
                            src={skill.icon}
                            alt={skill.name}
                            className="h-12 w-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xl">
                            {skill.name[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <CardTitle>{skill.name}</CardTitle>
                          <CardDescription>v{skill.version}</CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {skill.pricingModel}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{skill.installCount}</div>
                        <p className="text-xs text-muted-foreground">Installs</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{skill.averageRating.toFixed(1)}</div>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{skill.ratingCount}</div>
                        <p className="text-xs text-muted-foreground">Reviews</p>
                      </div>
                    </div>
                    <div className="mt-4 flex space-x-2">
                      <Link href={`/marketplace/${skill._id}`} className="flex-1">
                        <Button variant="outline" className="w-full">
                          View Listing
                        </Button>
                      </Link>
                      <Button variant="outline">Edit</Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No published skills yet</p>
                  <Button className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Publish Your First Skill
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>Your earnings and scheduled payouts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Placeholder - should come from marketplace_payouts */}
                {[
                  { amount: 850.0, status: "completed", date: "2026-02-01", items: 34 },
                  { amount: 920.0, status: "completed", date: "2026-01-01", items: 38 },
                  { amount: 750.0, status: "pending", date: "2026-03-01", items: 28 },
                ].map((payout, index) => (
                  <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">${payout.amount.toFixed(2)}</p>
                        <Badge
                          variant={payout.status === "completed" ? "default" : "secondary"}
                        >
                          {payout.status}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {payout.items} sales • {payout.date}
                      </p>
                    </div>
                    {payout.status === "completed" && (
                      <Button variant="ghost" size="sm">
                        View Invoice
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Split</CardTitle>
              <CardDescription>70% to creator, 30% platform fee</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gross Revenue</span>
                  <span className="font-medium">$12,450.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Fee (30%)</span>
                  <span className="font-medium text-red-600">-$3,735.00</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="font-medium">Your Earnings (70%)</span>
                  <span className="text-2xl font-bold">$8,715.00</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Downloads Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Chart coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Retention</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Users className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Chart coming soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="container mx-auto py-8 space-y-6">
      <Skeleton className="h-12 w-64" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-32" />
        ))}
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

function Separator() {
  return <div className="border-t my-4" />;
}
