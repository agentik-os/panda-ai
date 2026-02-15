"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Heart,
  Briefcase,
  Code,
  Megaphone,
  TrendingUp,
  Palette,
  Sparkles,
  BookOpen,
  DollarSign,
  GraduationCap,
  Play,
  Pause,
} from "lucide-react";
import { type OfficialModeId } from "@agentik-os/shared";

interface ModeCardProps {
  modeId: OfficialModeId;
  isActive: boolean;
  onActivate: () => void;
}

// Mode metadata (will be fetched from Convex later)
const MODE_METADATA: Record<
  OfficialModeId,
  {
    name: string;
    description: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    agentCount: number;
    skillCount: number;
  }
> = {
  "human-os": {
    name: "Human OS",
    description: "Health, fitness, sleep tracking, habit building",
    icon: Heart,
    color: "text-red-500",
    agentCount: 3,
    skillCount: 5,
  },
  "business-os": {
    name: "Business OS",
    description: "Revenue tracking, expense management, financial insights",
    icon: Briefcase,
    color: "text-blue-500",
    agentCount: 4,
    skillCount: 6,
  },
  "dev-os": {
    name: "Dev OS",
    description: "Code review, PR management, deployment automation",
    icon: Code,
    color: "text-green-500",
    agentCount: 5,
    skillCount: 8,
  },
  "marketing-os": {
    name: "Marketing OS",
    description: "Content generation, SEO, social media automation",
    icon: Megaphone,
    color: "text-purple-500",
    agentCount: 4,
    skillCount: 7,
  },
  "sales-os": {
    name: "Sales OS",
    description: "Lead scoring, pipeline management, outreach automation",
    icon: TrendingUp,
    color: "text-orange-500",
    agentCount: 3,
    skillCount: 5,
  },
  "design-os": {
    name: "Design OS",
    description: "Design feedback, asset organization, brand consistency",
    icon: Palette,
    color: "text-pink-500",
    agentCount: 2,
    skillCount: 4,
  },
  "art-os": {
    name: "Art OS",
    description: "Creative brainstorming, image generation, style exploration",
    icon: Sparkles,
    color: "text-yellow-500",
    agentCount: 3,
    skillCount: 6,
  },
  "ask-os": {
    name: "Ask OS",
    description: "Research assistant, citation finder, deep Q&A",
    icon: BookOpen,
    color: "text-cyan-500",
    agentCount: 2,
    skillCount: 4,
  },
  "finance-os": {
    name: "Finance OS",
    description: "Investment tracking, budget planning, tax optimization",
    icon: DollarSign,
    color: "text-emerald-500",
    agentCount: 4,
    skillCount: 7,
  },
  "learning-os": {
    name: "Learning OS",
    description: "Study plans, spaced repetition, knowledge graphs",
    icon: GraduationCap,
    color: "text-indigo-500",
    agentCount: 3,
    skillCount: 5,
  },
};

export function ModeCard({ modeId, isActive, onActivate }: ModeCardProps) {
  const metadata = MODE_METADATA[modeId];

  if (!metadata) {
    return null;
  }

  const Icon = metadata.icon;

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      {isActive && (
        <div className="absolute top-0 right-0 m-2">
          <Badge variant="default">Active</Badge>
        </div>
      )}

      <CardHeader>
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-${metadata.color.replace("text-", "")}-100 dark:bg-${metadata.color.replace("text-", "")}-900/20`}>
            <Icon className={`h-5 w-5 ${metadata.color}`} />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base">{metadata.name}</CardTitle>
            <CardDescription className="text-xs mt-1">
              {metadata.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span>{metadata.agentCount} agents</span>
            <span>{metadata.skillCount} skills</span>
          </div>
          <Button
            variant={isActive ? "outline" : "default"}
            size="sm"
            onClick={onActivate}
            className="h-9 w-9 p-0"
          >
            {isActive ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
