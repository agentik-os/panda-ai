"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Trophy } from "lucide-react";
import type { DebateResult } from "@agentik-os/shared";

interface DebateViewerProps {
  result: DebateResult;
}

export function DebateViewer({ result }: DebateViewerProps) {
  return (
    <div className="space-y-4">
      {/* Debate Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Debate Results</CardTitle>
              <CardDescription>{result.topic}</CardDescription>
            </div>
            {result.winner && (
              <Badge variant="default" className="gap-1">
                <Trophy className="h-3 w-3" />
                Winner: {result.winner}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Models:</span>
              <span className="font-medium">{result.models.join(", ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Rounds:</span>
              <span className="font-medium">{result.rounds.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">{(result.duration / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Debate Rounds */}
      {result.rounds.map((round, roundIndex) => (
        <Card key={roundIndex}>
          <CardHeader>
            <CardTitle className="text-base">Round {round.roundNumber}</CardTitle>
            <CardDescription>{round.summary}</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]">
              <div className="space-y-4">
                {round.turns.map((turn, turnIndex) => (
                  <div key={turnIndex}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 shrink-0">
                        <MessageSquare className="h-4 w-4 text-primary" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{turn.model}</p>
                          <Badge variant="outline" className="text-xs">
                            Turn {turnIndex + 1}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{turn.content}</p>
                      </div>
                    </div>
                    {turnIndex < round.turns.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>

            {round.keyPoints.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="space-y-2">
                  <p className="text-sm font-medium">Key Points:</p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {round.keyPoints.map((point, i) => (
                      <li key={i}>{point}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Final Synthesis */}
      <Card>
        <CardHeader>
          <CardTitle>Final Synthesis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{result.finalSynthesis}</p>

          {result.judgeReasoning && (
            <>
              <Separator className="my-4" />
              <div className="space-y-2">
                <p className="text-sm font-medium">Judge's Reasoning:</p>
                <p className="text-sm text-muted-foreground">{result.judgeReasoning}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
