"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DiffViewer } from "@/components/time-travel/diff-viewer";
import { CostComparison } from "@/components/time-travel/cost-comparison";
import { GitBranch, Play, Clock, Sparkles, ArrowRight } from "lucide-react";

export function ReplayPanel() {
  const [conversationId, setConversationId] = useState("");
  const [replayModel, setReplayModel] = useState("");
  const [temperature, setTemperature] = useState([0.7]);
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayResult, setReplayResult] = useState<any>(null);

  const handleReplay = async () => {
    setIsReplaying(true);
    // TODO: Connect to backend when ready (Task #94 completion)
    // Simulate replay
    setTimeout(() => {
      setReplayResult({
        original: {
          model: "claude-opus-4",
          output: "Here's a comprehensive analysis of your problem:\n\n1. First, we need to understand the root cause...\n\n2. Based on the data, I recommend...\n\n3. The implementation would involve...",
          cost: "$0.45",
          tokens: 1250,
        },
        replayed: {
          model: replayModel,
          output: "Let me help you with that:\n\n1. Looking at this issue, the main factor is...\n\n2. I'd suggest...\n\n3. You could implement this by...",
          cost: "$0.12",
          tokens: 850,
        },
      });
      setIsReplaying(false);
    }, 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Configuration Panel */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            Replay Configuration
          </CardTitle>
          <CardDescription>
            Select a conversation and replay parameters
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Conversation Selection */}
          <div className="space-y-2">
            <Label htmlFor="conversation">Select Conversation</Label>
            <Select value={conversationId} onValueChange={setConversationId}>
              <SelectTrigger id="conversation">
                <SelectValue placeholder="Choose a conversation..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="conv-1">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Support Chat #1234</span>
                    <span className="text-xs text-muted-foreground">
                      2 hours ago • opus-4
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="conv-2">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Research Query #5678</span>
                    <span className="text-xs text-muted-foreground">
                      5 hours ago • opus-4
                    </span>
                  </div>
                </SelectItem>
                <SelectItem value="conv-3">
                  <div className="flex flex-col items-start">
                    <span className="font-medium">Code Review #9012</span>
                    <span className="text-xs text-muted-foreground">
                      1 day ago • opus-4
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <Label htmlFor="model">Replay With Model</Label>
            <Select value={replayModel} onValueChange={setReplayModel}>
              <SelectTrigger id="model">
                <SelectValue placeholder="Select model..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude-sonnet-4">
                  Claude Sonnet 4
                  <Badge variant="secondary" className="ml-2 text-xs">
                    60% cheaper
                  </Badge>
                </SelectItem>
                <SelectItem value="claude-haiku-4">
                  Claude Haiku 4
                  <Badge variant="secondary" className="ml-2 text-xs">
                    90% cheaper
                  </Badge>
                </SelectItem>
                <SelectItem value="gpt-4o-mini">
                  GPT-4o Mini
                  <Badge variant="secondary" className="ml-2 text-xs">
                    80% cheaper
                  </Badge>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <Label>Temperature: {temperature[0]}</Label>
            <Slider
              value={temperature}
              onValueChange={setTemperature}
              min={0}
              max={2}
              step={0.1}
              className="w-full"
            />
            <p className="text-xs text-muted-foreground">
              Higher = more creative, Lower = more focused
            </p>
          </div>

          {/* Original Conversation Info */}
          {conversationId && (
            <div className="rounded-lg border p-3 space-y-2">
              <h4 className="text-sm font-semibold">Original Conversation</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Model:</span>
                  <span className="font-medium">claude-opus-4</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span className="font-medium">$0.45</span>
                </div>
                <div className="flex justify-between">
                  <span>Tokens:</span>
                  <span className="font-medium">1,250</span>
                </div>
                <div className="flex justify-between">
                  <span>Temperature:</span>
                  <span className="font-medium">1.0</span>
                </div>
              </div>
            </div>
          )}

          {/* Replay Button */}
          <Button
            onClick={handleReplay}
            disabled={!conversationId || !replayModel || isReplaying}
            className="w-full"
          >
            {isReplaying ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Replaying...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Replay Conversation
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Panel */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Replay Results
          </CardTitle>
          <CardDescription>
            Compare original and replayed outputs side-by-side
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!replayResult ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <GitBranch className="h-16 w-16 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No replay results yet
              </p>
              <p className="text-xs text-muted-foreground">
                Configure and run a replay to see the comparison
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Cost Comparison */}
              <CostComparison
                original={replayResult.original}
                replayed={replayResult.replayed}
              />

              {/* Output Comparison */}
              <Tabs defaultValue="diff" className="w-full">
                <TabsList>
                  <TabsTrigger value="diff">Side-by-Side Diff</TabsTrigger>
                  <TabsTrigger value="original">Original Only</TabsTrigger>
                  <TabsTrigger value="replayed">Replayed Only</TabsTrigger>
                </TabsList>

                <TabsContent value="diff" className="mt-4">
                  <DiffViewer
                    original={replayResult.original.output}
                    replayed={replayResult.replayed.output}
                  />
                </TabsContent>

                <TabsContent value="original" className="mt-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge>{replayResult.original.model}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {replayResult.original.cost} • {replayResult.original.tokens} tokens
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm">
                      {replayResult.original.output}
                    </pre>
                  </Card>
                </TabsContent>

                <TabsContent value="replayed" className="mt-4">
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary">{replayResult.replayed.model}</Badge>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {replayResult.replayed.cost} • {replayResult.replayed.tokens} tokens
                      </span>
                    </div>
                    <pre className="whitespace-pre-wrap text-sm">
                      {replayResult.replayed.output}
                    </pre>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
