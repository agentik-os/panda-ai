"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReviewQueue } from "@/components/admin/review-queue";
import { Shield, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { MarketplaceItem, MarketplaceAuthor } from "@agentik-os/shared";

export default function AdminReviewsPage() {
  // Mock authors
  const mockAuthor1: MarketplaceAuthor = {
    id: "author-001",
    name: "john-dev",
    verified: false,
    totalDownloads: 0,
    totalRevenue: 0,
    joinedAt: new Date(Date.now() - 86400000 * 30), // 30 days ago
  };

  const mockAuthor2: MarketplaceAuthor = {
    id: "author-002",
    name: "email-ai",
    verified: false,
    totalDownloads: 0,
    totalRevenue: 0,
    joinedAt: new Date(Date.now() - 86400000 * 60), // 60 days ago
  };

  // Mock data - will be replaced with Convex query
  const pendingItems: MarketplaceItem[] = [
    {
      id: "item-001",
      name: "Advanced File Search",
      description: "AI-powered semantic file search across your entire system",
      type: "skill",
      author: mockAuthor1,
      version: "1.0.0",
      publishedAt: new Date(Date.now() - 86400000), // 1 day ago
      updatedAt: new Date(Date.now() - 86400000),
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      tags: ["search", "ai", "files"],
      price: 0,
      currency: "USD",
      screenshots: [],
      status: "pending_review",
      manifest: {
        license: "MIT",
        permissions: ["filesystem:read", "network:fetch"],
        requirements: {
          os: ["linux", "macos", "windows"],
          agentikVersion: ">=1.0.0",
        },
      },
    },
    {
      id: "item-002",
      name: "Email Assistant Agent",
      description: "AI agent that helps draft, schedule, and manage emails",
      type: "agent",
      author: mockAuthor2,
      version: "2.1.0",
      publishedAt: new Date(Date.now() - 172800000), // 2 days ago
      updatedAt: new Date(Date.now() - 172800000),
      downloads: 0,
      rating: 0,
      reviewCount: 0,
      tags: ["email", "assistant", "productivity"],
      price: 999, // $9.99 in cents
      currency: "USD",
      screenshots: [],
      status: "pending_review",
      manifest: {
        license: "Commercial",
        permissions: ["email:read", "email:send", "calendar:read"],
        requirements: {
          os: ["linux", "macos", "windows"],
          agentikVersion: ">=1.0.0",
        },
      },
    },
  ];

  const approvedItems: MarketplaceItem[] = [];
  const rejectedItems: MarketplaceItem[] = [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Marketplace Reviews</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Review and certify marketplace submissions for security and quality
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting manual review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Today</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Certified and published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Needs improvements
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Scans</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Automated scans completed
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Review Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingItems.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedItems.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedItems.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Reviews</CardTitle>
              <CardDescription>
                Items awaiting manual security and quality review
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewQueue items={pendingItems} status="pending_review" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Approved Items</CardTitle>
              <CardDescription>
                Items that passed review and are live on the marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewQueue items={approvedItems} status="approved" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rejected Items</CardTitle>
              <CardDescription>
                Items that failed review and need improvements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewQueue items={rejectedItems} status="rejected" />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
