"use client";

// Force dynamic rendering (prevents build-time SSG errors with Convex)
export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2 } from "lucide-react";
import { useState } from "react";
import { QuorumSelector } from "@/components/consensus/quorum-selector";
import { DebateViewer } from "@/components/consensus/debate-viewer";
import { SynthesisCard } from "@/components/consensus/synthesis-card";
import type { DebateResult, SynthesisResult } from "@agentik-os/shared";

export default function ConsensusPage() {
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [activeTab, setActiveTab] = useState<"deliberation" | "synthesis" | "debate">("deliberation");

  // Mock results - will be replaced with real API calls
  const deliberationResult: SynthesisResult | null = null;
  const debateResult: DebateResult | null = null;

  const handleRunConsensus = async () => {
    if (!query || selectedModels.length < 2) return;

    setIsRunning(true);

    // TODO: Call Convex mutation to run consensus
    console.log("Running consensus:", {
      models: selectedModels,
      query,
      method: activeTab,
    });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 3000));

    setIsRunning(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Multi-AI Consensus</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Query multiple AI models simultaneously and synthesize their responses.
        </p>
      </div>

      {/* Method Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deliberation">Deliberation</TabsTrigger>
          <TabsTrigger value="synthesis">Synthesis</TabsTrigger>
          <TabsTrigger value="debate">Debate</TabsTrigger>
        </TabsList>

        <TabsContent value="deliberation" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Run Deliberation</CardTitle>
              <CardDescription>
                Query multiple models in parallel and synthesize their responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuorumSelector
                selectedModels={selectedModels}
                onModelsChange={setSelectedModels}
                query={query}
                onQueryChange={setQuery}
              />

              <Button
                onClick={handleRunConsensus}
                disabled={isRunning || !query || selectedModels.length < 2}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Deliberation...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Run Deliberation ({selectedModels.length} models)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {deliberationResult && (
            <SynthesisCard result={deliberationResult} />
          )}
        </TabsContent>

        <TabsContent value="synthesis" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Run Synthesis</CardTitle>
              <CardDescription>
                Combine multiple AI perspectives into a unified response
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuorumSelector
                selectedModels={selectedModels}
                onModelsChange={setSelectedModels}
                query={query}
                onQueryChange={setQuery}
              />

              <Button
                onClick={handleRunConsensus}
                disabled={isRunning || !query || selectedModels.length < 2}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Synthesis...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Run Synthesis ({selectedModels.length} models)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {deliberationResult && (
            <SynthesisCard result={deliberationResult} />
          )}
        </TabsContent>

        <TabsContent value="debate" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Run Debate</CardTitle>
              <CardDescription>
                Multi-round debate between AI models on a topic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <QuorumSelector
                selectedModels={selectedModels}
                onModelsChange={setSelectedModels}
                query={query}
                onQueryChange={setQuery}
              />

              <Button
                onClick={handleRunConsensus}
                disabled={isRunning || !query || selectedModels.length < 2}
                className="w-full"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Running Debate...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Start Debate ({selectedModels.length} models)
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {debateResult && (
            <DebateViewer result={debateResult} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
