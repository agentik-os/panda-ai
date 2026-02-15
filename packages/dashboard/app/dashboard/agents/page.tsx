"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Plus, Play, Pause, Settings, Loader2 } from "lucide-react";
import { useQuery, api } from "@/lib/convex";
import Link from "next/link";

// Force dynamic rendering (prevents build-time SSG errors with Convex)
export const dynamic = "force-dynamic";

export default function AgentsPage() {
  // Fetch all agents with real-time updates
  const agents = useQuery(api.queries.agents.list, {});

  const isLoading = agents === undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Agents</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Create and manage your AI agents.
          </p>
        </div>
        <Button asChild className="h-11 min-w-[44px]">
          <Link href="/dashboard/agents/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Agent
          </Link>
        </Button>
      </div>

      {/* Agent List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : agents && agents.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent: any) => (
            <Link key={agent._id} href={`/dashboard/agents/${agent._id}`}>
              <Card className="cursor-pointer transition-all hover:shadow-md">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Bot className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{agent.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {agent.model}
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        agent.status === "active"
                          ? "default"
                          : agent.status === "paused"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {agent.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">
                        {agent.messageCount ?? 0}
                      </span>{" "}
                      messages
                    </div>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-11 w-11">
                        {agent.status === "active" ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-11 w-11">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first AI agent to get started.
            </p>
            <Button asChild>
              <Link href="/dashboard/agents/create">
                <Plus className="mr-2 h-4 w-4" />
                Create Agent
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
