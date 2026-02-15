"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MessageSquare, ChevronDown, ChevronUp, User, Bot } from "lucide-react";
import { useQuery, api } from "@/lib/convex";
import { useState } from "react";
import { formatDistance } from "date-fns";

type Session = {
  sessionId: string;
  messageCount: number;
  lastMessage: number;
  channel: string;
};

interface ConversationListProps {
  agentId: any;
  sessions: Session[];
}

export default function ConversationList({
  agentId,
  sessions,
}: ConversationListProps) {
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  if (sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Conversations Yet</h3>
          <p className="text-sm text-muted-foreground">
            This agent hasn't had any conversations yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Conversation History</CardTitle>
        <p className="text-sm text-muted-foreground">
          {sessions.length} session{sessions.length !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {sessions.map((session) => (
          <SessionItem
            key={session.sessionId}
            session={session}
            agentId={agentId}
            isExpanded={expandedSession === session.sessionId}
            onToggle={() =>
              setExpandedSession(
                expandedSession === session.sessionId
                  ? null
                  : session.sessionId
              )
            }
          />
        ))}
      </CardContent>
    </Card>
  );
}

interface SessionItemProps {
  session: Session;
  agentId: any;
  isExpanded: boolean;
  onToggle: () => void;
}

function SessionItem({
  session,
  agentId,
  isExpanded,
  onToggle,
}: SessionItemProps) {
  const messages = useQuery(
    api.queries.conversations.getSession,
    isExpanded ? { agentId, sessionId: session.sessionId } : "skip"
  );

  return (
    <div className="border rounded-lg p-4">
      {/* Session Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageSquare className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-medium">
              Session {session.sessionId.substring(0, 8)}...
            </h4>
            <p className="text-sm text-muted-foreground">
              {formatDistance(new Date(session.lastMessage), new Date(), {
                addSuffix: true,
              })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{session.channel}</Badge>
          <Badge variant="outline">{session.messageCount} messages</Badge>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Expanded Messages */}
      {isExpanded && (
        <div className="mt-4 space-y-3">
          {messages === undefined ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Loading messages...
            </p>
          ) : messages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No messages found
            </p>
          ) : (
            messages.map((message: any) => (
              <div
                key={message._id}
                className={`flex gap-3 ${
                  message.role === "user" ? "flex-row" : "flex-row-reverse"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    message.role === "user"
                      ? "bg-blue-500/10"
                      : "bg-primary/10"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-blue-500" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`flex-1 rounded-lg p-3 ${
                    message.role === "user"
                      ? "bg-blue-500/10"
                      : "bg-muted"
                  }`}
                >
                  <div className="flex items-start justify-between mb-1">
                    <span className="text-xs font-medium capitalize">
                      {message.role}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </p>
                  {message.tokensUsed && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {message.tokensUsed} tokens
                      {message.cost && ` • $${message.cost.toFixed(4)}`}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
