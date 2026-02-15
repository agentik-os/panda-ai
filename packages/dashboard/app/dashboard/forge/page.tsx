"use client";

/**
 * FORGE Dashboard - From Idea to MVP
 * Autonomous project building with AI teams
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Palette,
  FileText,
  Layers,
  Users,
  CheckCircle2,
  Rocket,
  Play,
  ArrowRight,
} from "lucide-react";
import { DiscoveryWizard } from "./components/discovery-wizard";
import { TeamProgress } from "./components/team-progress";
import { CodePreview } from "./components/code-preview";

type ForgeStage =
  | "idle"
  | "discovery"
  | "branding"
  | "prd"
  | "stack"
  | "building"
  | "qa"
  | "complete";

interface ForgeSession {
  stage: ForgeStage;
  projectName?: string;
  discovery?: any;
  branding?: any;
  prd?: any;
  stack?: any;
  teamId?: string;
  progress?: {
    frontend: number;
    backend: number;
    testing: number;
  };
  codebase?: string;
}

const STAGE_INFO = {
  idle: {
    title: "Start Building",
    description: "Transform your idea into a working MVP with AI agents",
    icon: Sparkles,
    color: "text-blue-500",
  },
  discovery: {
    title: "Discovery",
    description: "Strategic questions about your idea",
    icon: Sparkles,
    color: "text-blue-500",
  },
  branding: {
    title: "Branding",
    description: "Product name and visual identity",
    icon: Palette,
    color: "text-purple-500",
  },
  prd: {
    title: "PRD Generation",
    description: "Comprehensive requirements document",
    icon: FileText,
    color: "text-green-500",
  },
  stack: {
    title: "Stack Selection",
    description: "Optimal technology stack",
    icon: Layers,
    color: "text-orange-500",
  },
  building: {
    title: "Team Build",
    description: "AI agents building your project",
    icon: Users,
    color: "text-indigo-500",
  },
  qa: {
    title: "Quality Assurance",
    description: "Automated testing and validation",
    icon: CheckCircle2,
    color: "text-teal-500",
  },
  complete: {
    title: "MVP Ready",
    description: "Your project is ready to deploy",
    icon: Rocket,
    color: "text-pink-500",
  },
};

export default function ForgePage() {
  const [session, setSession] = useState<ForgeSession>({
    stage: "idle",
  });

  const handleStartForge = () => {
    setSession({ stage: "discovery" });
  };

  const handleDiscoveryComplete = (discoveryData: any) => {
    setSession({
      ...session,
      stage: "branding",
      discovery: discoveryData,
      projectName: discoveryData.projectName,
    });
  };

  const StageIcon = STAGE_INFO[session.stage].icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">FORGE</h1>
          <p className="text-muted-foreground">
            From idea to working MVP in hours, not weeks
          </p>
        </div>
        {session.stage === "idle" && (
          <Button onClick={handleStartForge} size="lg" className="gap-2">
            <Play className="h-5 w-5" />
            Start New Project
          </Button>
        )}
      </div>

      {/* Current Stage Indicator */}
      {session.stage !== "idle" && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-full bg-muted ${STAGE_INFO[session.stage].color}`}
                >
                  <StageIcon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold">
                    {STAGE_INFO[session.stage].title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {STAGE_INFO[session.stage].description}
                  </p>
                </div>
              </div>
              {session.projectName && (
                <Badge variant="outline" className="text-base px-4 py-1">
                  {session.projectName}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stage-Specific Content */}
      {session.stage === "idle" && (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Workflow Steps Preview */}
          {(
            [
              "discovery",
              "branding",
              "prd",
              "stack",
              "building",
              "qa",
            ] as const
          ).map((stage, index) => {
            const StepIcon = STAGE_INFO[stage].icon;
            return (
              <Card key={stage} className="hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted ${STAGE_INFO[stage].color}`}
                    >
                      <StepIcon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <div className="text-xs text-muted-foreground">
                        Step {index + 1}
                      </div>
                      <CardTitle className="text-base">
                        {STAGE_INFO[stage].title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {STAGE_INFO[stage].description}
                  </p>
                </CardContent>
              </Card>
            );
          })}

          {/* Final Step */}
          <Card className="hover:bg-accent/50 transition-colors border-2 border-primary/20">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted ${STAGE_INFO.complete.color}`}
                >
                  <Rocket className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground">Final</div>
                  <CardTitle className="text-base">
                    {STAGE_INFO.complete.title}
                  </CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {STAGE_INFO.complete.description}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {session.stage === "discovery" && (
        <DiscoveryWizard onComplete={handleDiscoveryComplete} />
      )}

      {session.stage === "building" && session.teamId && (
        <TeamProgress teamId={session.teamId} />
      )}

      {session.stage === "complete" && session.codebase && (
        <CodePreview codebase={session.codebase} />
      )}

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-yellow-500" />
            Why FORGE?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <h4 className="font-semibold mb-2">⚡ Fast</h4>
              <p className="text-sm text-muted-foreground">
                3-10 hours from idea to MVP vs 2-4 weeks manually
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">🤖 Autonomous</h4>
              <p className="text-sm text-muted-foreground">
                AI team builds in parallel while you focus on strategy
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">✨ Production-Ready</h4>
              <p className="text-sm text-muted-foreground">
                Guardian agent ensures code quality and best practices
              </p>
            </div>
          </div>

          <div className="rounded-lg bg-muted p-4">
            <h4 className="font-semibold mb-2">End-to-End Workflow</h4>
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span>Idea</span>
              <ArrowRight className="h-4 w-4" />
              <span>Discovery</span>
              <ArrowRight className="h-4 w-4" />
              <span>Branding</span>
              <ArrowRight className="h-4 w-4" />
              <span>PRD</span>
              <ArrowRight className="h-4 w-4" />
              <span>Stack</span>
              <ArrowRight className="h-4 w-4" />
              <span>Team Build</span>
              <ArrowRight className="h-4 w-4" />
              <span>QA</span>
              <ArrowRight className="h-4 w-4" />
              <span className="font-semibold text-foreground">Working MVP</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
