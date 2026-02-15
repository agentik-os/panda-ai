"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { api, type Id } from "@/lib/convex";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Send, ArrowLeft, Info } from "lucide-react";
import Link from "next/link";

interface PreviewPageProps {
  params: Promise<{ id: string }>;
}

/**
 * Live Preview Page
 * - Test agent/skill in isolated sandbox
 * - Chat interface for interaction
 * - Shows agent capabilities
 * - Safe execution environment
 */
export default function PreviewPage({ params }: PreviewPageProps) {
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

  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: `Hi! I'm ${item?.name || "the agent"}. This is a preview mode - you can test my capabilities here. How can I help you?`,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (item === undefined) {
    return <PreviewSkeleton />;
  }

  if (item === null) {
    notFound();
  }

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      // TODO: Call agent execution API in sandbox
      // For now, simulate response
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const assistantMessage = {
        role: "assistant" as const,
        content: `[Preview Mode] This is a simulated response. In production, this would execute the actual agent with your message: "${userMessage}"`,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Preview execution error:", error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error executing the preview. Please try again.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="mb-6">
        <Link href={`/marketplace/${id}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Details
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Live Preview: {item.name}</CardTitle>
                  <CardDescription>
                    Test the {itemType} in a safe sandbox environment
                  </CardDescription>
                </div>
                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  Preview Mode
                </Badge>
              </div>
            </CardHeader>

            <Separator />

            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-4 py-2">
                    <div className="flex items-center space-x-2">
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                      <div className="h-2 w-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Input */}
            <Separator />
            <div className="p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex space-x-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  disabled={isLoading}
                />
                <Button type="submit" disabled={isLoading || !input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </div>
          </Card>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-4">
          {/* About Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Info className="h-5 w-5" />
                <span>About Preview Mode</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p>
                This is a safe sandbox environment where you can test the {itemType} before
                installing.
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>No real data is modified</li>
                <li>Limited execution time</li>
                <li>Isolated from your workspace</li>
                <li>No cost for preview usage</li>
              </ul>
            </CardContent>
          </Card>

          {/* Agent Details */}
          <Card>
            <CardHeader>
              <CardTitle>Preview Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Name:</span>{" "}
                <span className="font-medium">{item.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Version:</span>{" "}
                <span className="font-medium">{item.version}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Category:</span>{" "}
                <span className="font-medium capitalize">{item.category}</span>
              </div>
              {itemType === "agent" && (
                <>
                  <div>
                    <span className="text-muted-foreground">Model:</span>{" "}
                    <span className="font-medium">{(item as any).model}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Provider:</span>{" "}
                    <span className="font-medium capitalize">{(item as any).provider}</span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Install CTA */}
          <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
            <CardHeader>
              <CardTitle>Ready to Install?</CardTitle>
              <CardDescription>
                Add this {itemType} to your workspace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href={`/marketplace/${id}`}>
                <Button className="w-full">
                  View Full Details & Install
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function PreviewSkeleton() {
  return (
    <div className="container mx-auto py-8">
      <div className="h-8 w-32 bg-muted rounded mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-[600px] bg-muted rounded" />
        <div className="space-y-4">
          <div className="h-48 bg-muted rounded" />
          <div className="h-48 bg-muted rounded" />
          <div className="h-32 bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
