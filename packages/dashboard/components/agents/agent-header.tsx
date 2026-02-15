"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bot,
  Play,
  Pause,
  Edit,
  Trash2,
  DollarSign,
  MessageSquare,
  Zap,
} from "lucide-react";
import { useMutation, api } from "@/lib/convex";
import { useRouter } from "next/navigation";
import { useState } from "react";
import AgentSettings from "./agent-settings";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Agent = {
  _id: any;
  name: string;
  description?: string;
  systemPrompt: string;
  model: string;
  provider: string;
  temperature?: number;
  maxTokens?: number;
  channels: string[];
  skills: string[];
  status: string;
  createdAt: number;
  updatedAt: number;
  lastActiveAt?: number;
  messageCount?: number;
  totalCost?: number;
};

type Stats = {
  messageCount: number;
  totalCost: number;
  totalTokens: number;
  avgCostPerMessage: number;
};

interface AgentHeaderProps {
  agent: Agent;
  stats: Stats;
}

export default function AgentHeader({ agent, stats }: AgentHeaderProps) {
  const router = useRouter();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateAgent = useMutation(api.mutations.agents.update);
  const deleteAgent = useMutation(api.mutations.agents.remove);

  const handleToggleStatus = async () => {
    const newStatus = agent.status === "active" ? "paused" : "active";
    await updateAgent({
      id: agent._id,
      status: newStatus,
    });
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteAgent({ id: agent._id });
      router.push("/dashboard/agents");
    } catch (error) {
      console.error("Failed to delete agent:", error);
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                <Bot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <CardTitle className="text-2xl">{agent.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {agent.description || "No description"}
                </p>
                <div className="flex items-center gap-2 mt-2">
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
                  <span className="text-xs text-muted-foreground">
                    {agent.model}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleStatus}
              >
                {agent.status === "active" ? (
                  <>
                    <Pause className="mr-2 h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Activate
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            {/* Messages */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <MessageSquare className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.messageCount}</p>
                <p className="text-xs text-muted-foreground">Messages</p>
              </div>
            </div>

            {/* Total Cost */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${stats.totalCost.toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground">Total Cost</p>
              </div>
            </div>

            {/* Avg Cost */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Zap className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  ${stats.avgCostPerMessage.toFixed(4)}
                </p>
                <p className="text-xs text-muted-foreground">Avg/Message</p>
              </div>
            </div>
          </div>

          {/* Configuration Details */}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="text-sm font-medium mb-2">Channels</h4>
              <div className="flex flex-wrap gap-2">
                {agent.channels.map((channel) => (
                  <Badge key={channel} variant="secondary">
                    {channel}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {agent.skills.map((skill) => (
                  <Badge key={skill} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div className="mt-4">
            <h4 className="text-sm font-medium mb-2">System Prompt</h4>
            <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
              {agent.systemPrompt}
            </p>
          </div>

          {/* Model Config */}
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="text-sm font-medium">Provider</h4>
              <p className="text-sm text-muted-foreground">{agent.provider}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Temperature</h4>
              <p className="text-sm text-muted-foreground">
                {agent.temperature ?? 0.7}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium">Max Tokens</h4>
              <p className="text-sm text-muted-foreground">
                {agent.maxTokens ?? 4096}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <AgentSettings
        agent={agent}
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Agent</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{agent.name}</strong>?
              This action cannot be undone. Conversation history will be
              preserved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
