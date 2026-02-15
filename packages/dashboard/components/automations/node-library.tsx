"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Zap,
  Filter,
  Play,
  Clock,
  Webhook,
  Mail,
  MessageSquare,
  Database,
  Sparkles,
  Search,
} from "lucide-react";
import { useState } from "react";

interface NodeCategory {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  nodes: NodeItem[];
}

interface NodeItem {
  id: string;
  type: "trigger" | "condition" | "action";
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NODE_LIBRARY: NodeCategory[] = [
  {
    name: "Triggers",
    icon: Zap,
    color: "blue",
    nodes: [
      {
        id: "cron",
        type: "trigger",
        label: "Schedule",
        description: "Run on a schedule (cron)",
        icon: Clock,
      },
      {
        id: "event",
        type: "trigger",
        label: "Event",
        description: "Listen to system events",
        icon: Zap,
      },
      {
        id: "webhook",
        type: "trigger",
        label: "Webhook",
        description: "HTTP webhook endpoint",
        icon: Webhook,
      },
    ],
  },
  {
    name: "Conditions",
    icon: Filter,
    color: "amber",
    nodes: [
      {
        id: "filter",
        type: "condition",
        label: "Filter",
        description: "Check field values",
        icon: Filter,
      },
    ],
  },
  {
    name: "Actions",
    icon: Play,
    color: "green",
    nodes: [
      {
        id: "send_notification",
        type: "action",
        label: "Send Notification",
        description: "Email, Slack, Telegram, Discord",
        icon: Mail,
      },
      {
        id: "execute_skill",
        type: "action",
        label: "Execute Skill",
        description: "Run an installed skill",
        icon: Sparkles,
      },
      {
        id: "run_ai",
        type: "action",
        label: "Run AI",
        description: "Process with AI model",
        icon: MessageSquare,
      },
      {
        id: "webhook_call",
        type: "action",
        label: "Webhook Call",
        description: "Call external API",
        icon: Webhook,
      },
      {
        id: "create_record",
        type: "action",
        label: "Create Record",
        description: "Insert into database",
        icon: Database,
      },
      {
        id: "update_record",
        type: "action",
        label: "Update Record",
        description: "Modify database record",
        icon: Database,
      },
    ],
  },
];

export function NodeLibrary() {
  const [searchQuery, setSearchQuery] = useState("");

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  const filteredLibrary = NODE_LIBRARY.map((category) => ({
    ...category,
    nodes: category.nodes.filter(
      (node) =>
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.description.toLowerCase().includes(searchQuery.toLowerCase())
    ),
  })).filter((category) => category.nodes.length > 0);

  return (
    <Card className="h-[600px] overflow-hidden flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Node Library</CardTitle>
        <div className="pt-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search nodes..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <div className="space-y-4">
          {filteredLibrary.map((category) => (
            <div key={category.name}>
              <div className="flex items-center gap-2 mb-2">
                <category.icon className={`h-4 w-4 text-${category.color}-500`} />
                <h3 className="text-sm font-medium">{category.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {category.nodes.length}
                </Badge>
              </div>
              <div className="space-y-2">
                {category.nodes.map((node) => (
                  <div
                    key={node.id}
                    draggable
                    onDragStart={(e) => onDragStart(e, node.type)}
                    className="rounded-lg border p-3 cursor-grab active:cursor-grabbing hover:bg-accent transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <node.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{node.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{node.description}</p>
                  </div>
                ))}
              </div>
              <Separator className="mt-4" />
            </div>
          ))}

          {filteredLibrary.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-muted-foreground">No nodes found</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
