"use client";

/**
 * Agent Mode Selector Component
 * Step-072: OS Modes (Focus/Creative/Research)
 */

import { useState } from "react";
import { useQuery, useMutation, api, type Id } from "@/lib/convex";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Target,
  Sparkles,
  BookOpen,
  Scale,
  LucideIcon,
} from "lucide-react";

type AgentMode = "focus" | "creative" | "research" | "balanced";

interface ModeConfig {
  id: AgentMode;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

const MODE_CONFIGS: Record<AgentMode, ModeConfig> = {
  focus: {
    id: "focus",
    name: "Focus",
    description: "Minimal distractions, direct answers",
    icon: Target,
    color: "text-blue-600 dark:text-blue-400",
  },
  creative: {
    id: "creative",
    name: "Creative",
    description: "Exploratory thinking, brainstorming",
    icon: Sparkles,
    color: "text-purple-600 dark:text-purple-400",
  },
  research: {
    id: "research",
    name: "Research",
    description: "Deep analysis, citations",
    icon: BookOpen,
    color: "text-green-600 dark:text-green-400",
  },
  balanced: {
    id: "balanced",
    name: "Balanced",
    description: "General-purpose, adaptive",
    icon: Scale,
    color: "text-gray-600 dark:text-gray-400",
  },
};

interface ModeSelectorProps {
  agentId: Id<"agents">;
  currentMode?: AgentMode;
  variant?: "compact" | "full";
}

export function ModeSelector({
  agentId,
  currentMode: propMode,
  variant = "full",
}: ModeSelectorProps) {
  const [isChanging, setIsChanging] = useState(false);

  // Get current mode from DB if not provided
  const modeData = useQuery(api.queries.modes.getCurrentMode, {
    agentId,
  });

  const switchMode = useMutation(api.mutations.modes.switchMode);

  const currentMode: AgentMode = propMode || modeData?.mode || "balanced";
  const config = MODE_CONFIGS[currentMode];
  const Icon = config.icon;

  const handleModeChange = async (newMode: AgentMode) => {
    setIsChanging(true);
    try {
      await switchMode({
        agentId,
        mode: newMode,
      });
    } catch (error) {
      console.error("Failed to switch mode:", error);
    } finally {
      setIsChanging(false);
    }
  };

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.color}`} />
        <Select
          value={currentMode}
          onValueChange={handleModeChange}
          disabled={isChanging}
        >
          <SelectTrigger className="h-8 w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(MODE_CONFIGS).map((mode) => {
              const ModeIcon = mode.icon;
              return (
                <SelectItem key={mode.id} value={mode.id}>
                  <div className="flex items-center gap-2">
                    <ModeIcon className={`h-4 w-4 ${mode.color}`} />
                    <span>{mode.name}</span>
                  </div>
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Operating Mode</h3>
          <p className="text-xs text-muted-foreground">
            {config.description}
          </p>
        </div>
        <Badge variant="outline" className={config.color}>
          <Icon className="mr-1 h-3 w-3" />
          {config.name}
        </Badge>
      </div>

      <Select
        value={currentMode}
        onValueChange={handleModeChange}
        disabled={isChanging}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.values(MODE_CONFIGS).map((mode) => {
            const ModeIcon = mode.icon;
            return (
              <SelectItem key={mode.id} value={mode.id}>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <ModeIcon className={`h-4 w-4 ${mode.color}`} />
                    <span className="font-medium">{mode.name}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {mode.description}
                  </span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
