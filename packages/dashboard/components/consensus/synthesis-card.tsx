"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import type { SynthesisResult } from "@agentik-os/shared";

interface SynthesisCardProps {
  result: SynthesisResult;
}

export function SynthesisCard({ result }: SynthesisCardProps) {
  const agreementPercent = Math.round(result.agreementAnalysis.agreementScore * 100);

  return (
    <div className="space-y-4">
      {/* Synthesis Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Synthesis</CardTitle>
            <Badge
              variant={agreementPercent >= 70 ? "default" : agreementPercent >= 40 ? "secondary" : "destructive"}
            >
              {agreementPercent}% Agreement
            </Badge>
          </div>
          <CardDescription>
            Synthesized from {result.originalResponses.length} model responses
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Synthesized Response */}
          <div className="rounded-lg border p-4">
            <p className="text-sm whitespace-pre-wrap">{result.synthesis}</p>
          </div>

          <Separator />

          {/* Agreement Analysis */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Agreement Analysis</p>

            {/* Common Points */}
            {result.agreementAnalysis.commonPoints.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="font-medium">Points of Agreement:</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-6">
                  {result.agreementAnalysis.commonPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disagreements */}
            {result.agreementAnalysis.disagreements.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="font-medium">Points of Disagreement:</span>
                </div>
                <div className="space-y-3 ml-6">
                  {result.agreementAnalysis.disagreements.map((disagreement, i) => (
                    <div key={i} className="space-y-1">
                      <p className="text-sm font-medium">{disagreement.topic}</p>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {disagreement.positions.map((position, j) => (
                          <div key={j} className="rounded border p-2">
                            <p className="text-xs font-medium text-muted-foreground mb-1">
                              {position.model}:
                            </p>
                            <p className="text-xs">{position.position}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Confidence */}
            <div className="flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-muted-foreground">
                Confidence: {Math.round(result.agreementAnalysis.confidence * 100)}%
              </span>
            </div>
          </div>

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium">Recommendations:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                  {result.recommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Individual Responses */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Individual Model Responses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.originalResponses.map((response, i) => (
              <div key={i}>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{response.model}</p>
                    <Badge variant="outline" className="text-xs">
                      {response.usage.totalTokens} tokens
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{response.content}</p>
                </div>
                {i < result.originalResponses.length - 1 && <Separator className="my-4" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
