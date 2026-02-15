"use client";

// Force dynamic rendering (prevents build-time SSG errors with Convex)
export const dynamic = "force-dynamic";

import { useQuery, api } from "@/lib/convex";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";
import AgentHeader from "@/components/agents/agent-header";
import ConversationList from "@/components/agents/conversation-list";

export default function AgentDetailPage() {
  const params = useParams();
  const agentId = params.id as any;

  // Fetch agent data
  const agent = useQuery(api.queries.agents.get, { id: agentId });
  const stats = useQuery(api.queries.agents.stats, { id: agentId });
  const sessions = useQuery(api.queries.conversations.listSessions, {
    agentId,
  });

  const isLoading = agent === undefined || stats === undefined || sessions === undefined;

  // Agent not found
  if (!isLoading && !agent) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <h2 className="text-2xl font-bold mb-4">Agent Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The agent you're looking for doesn't exist.
        </p>
        <Button asChild>
          <Link href="/dashboard/agents">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Agents
          </Link>
        </Button>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link href="/dashboard/agents">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Agents
        </Link>
      </Button>

      {/* Agent Header */}
      <AgentHeader agent={agent} stats={stats} />

      {/* Conversation History */}
      <ConversationList agentId={agentId} sessions={sessions} />
    </div>
  );
}
