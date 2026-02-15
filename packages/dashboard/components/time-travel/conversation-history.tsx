"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, Search, GitBranch, DollarSign, Zap } from "lucide-react";

// Mock conversation data
const mockConversations = [
  {
    id: "conv-1",
    title: "Support Chat #1234",
    agentName: "Customer Support Agent",
    originalModel: "claude-opus-4",
    date: "2026-02-14",
    time: "10:30 AM",
    messages: 12,
    originalCost: "$0.45",
    replays: 2,
    bestReplay: {
      model: "claude-haiku-4",
      cost: "$0.08",
      savings: "$0.37",
    },
  },
  {
    id: "conv-2",
    title: "Research Query #5678",
    agentName: "Research Assistant",
    originalModel: "claude-opus-4",
    date: "2026-02-14",
    time: "07:15 AM",
    messages: 8,
    originalCost: "$1.24",
    replays: 3,
    bestReplay: {
      model: "claude-sonnet-4",
      cost: "$0.45",
      savings: "$0.79",
    },
  },
  {
    id: "conv-3",
    title: "Code Review #9012",
    agentName: "Code Review Bot",
    originalModel: "claude-opus-4",
    date: "2026-02-13",
    time: "04:20 PM",
    messages: 15,
    originalCost: "$2.10",
    replays: 1,
    bestReplay: {
      model: "gpt-4o-mini",
      cost: "$0.42",
      savings: "$1.68",
    },
  },
];

export function ConversationHistory() {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Conversation History</CardTitle>
            <CardDescription>
              Past conversations and their replay results
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search conversations..." className="pl-9" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Models</SelectItem>
                <SelectItem value="opus">Opus</SelectItem>
                <SelectItem value="sonnet">Sonnet</SelectItem>
                <SelectItem value="haiku">Haiku</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockConversations.map((conv) => (
            <Card key={conv.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                {/* Left: Conversation Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between sm:items-center">
                    <div>
                      <h4 className="font-semibold">{conv.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {conv.agentName}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {conv.date} at {conv.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {conv.messages} messages
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {conv.originalCost}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {conv.originalModel}
                    </Badge>
                    {conv.replays > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <GitBranch className="mr-1 h-3 w-3" />
                        {conv.replays} replays
                      </Badge>
                    )}
                  </div>

                  {/* Best Replay */}
                  {conv.bestReplay && (
                    <div className="mt-2 rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-900 dark:bg-green-950/20">
                      <div className="flex items-center gap-2 text-xs text-green-900 dark:text-green-100">
                        <span className="font-semibold">Best Replay:</span>
                        <Badge variant="secondary" className="text-xs">
                          {conv.bestReplay.model}
                        </Badge>
                        <span className="text-green-700 dark:text-green-300">
                          {conv.bestReplay.cost} • Saved {conv.bestReplay.savings}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Replay Again
                  </Button>
                  <Button variant="ghost" size="sm">
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {/* Empty state */}
          {mockConversations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No conversation history yet
              </p>
              <p className="text-xs text-muted-foreground">
                Conversations appear after agents have activity
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {mockConversations.length > 0 && (
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Showing 1-{mockConversations.length} of {mockConversations.length}{" "}
              conversations
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
