"use client";

/**
 * Team Progress Component
 * Real-time updates as AI agents build the project
 */

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Code2,
  Database,
  TestTube,
  Shield,
  CheckCircle2,
  Clock,
  Loader2,
} from "lucide-react";

interface TeamProgressProps {
  teamId: string;
}

interface AgentProgress {
  id: string;
  name: string;
  role: "frontend" | "backend" | "testing" | "guardian";
  status: "idle" | "working" | "blocked" | "completed";
  currentTask?: string;
  progress: number;
  filesModified: number;
  linesWritten: number;
}

const AGENT_ICONS = {
  frontend: Code2,
  backend: Database,
  testing: TestTube,
  guardian: Shield,
};

const AGENT_COLORS = {
  frontend: "text-blue-500",
  backend: "text-green-500",
  testing: "text-purple-500",
  guardian: "text-orange-500",
};

const STATUS_BADGES = {
  idle: { label: "Idle", variant: "secondary" as const },
  working: { label: "Working", variant: "default" as const },
  blocked: { label: "Blocked", variant: "destructive" as const },
  completed: { label: "Done", variant: "outline" as const },
};

export function TeamProgress({ teamId: _teamId }: TeamProgressProps) {
  // TODO: Use teamId to fetch real-time progress from Convex
  const [agents, setAgents] = useState<AgentProgress[]>([
    {
      id: "agent-1",
      name: "Frontend Lead",
      role: "frontend",
      status: "working",
      currentTask: "Building dashboard components",
      progress: 45,
      filesModified: 12,
      linesWritten: 847,
    },
    {
      id: "agent-2",
      name: "Backend Lead",
      role: "backend",
      status: "working",
      currentTask: "Implementing API endpoints",
      progress: 62,
      filesModified: 8,
      linesWritten: 623,
    },
    {
      id: "agent-3",
      name: "QA Engineer",
      role: "testing",
      status: "idle",
      currentTask: "Waiting for codebase",
      progress: 0,
      filesModified: 0,
      linesWritten: 0,
    },
    {
      id: "agent-4",
      name: "Guardian",
      role: "guardian",
      status: "working",
      currentTask: "Reviewing code quality",
      progress: 35,
      filesModified: 0,
      linesWritten: 0,
    },
  ]);

  // Simulate progress updates (replace with real WebSocket/Convex updates)
  useEffect(() => {
    const interval = setInterval(() => {
      setAgents((prev) =>
        prev.map((agent) => {
          if (agent.status === "working" && agent.progress < 100) {
            return {
              ...agent,
              progress: Math.min(100, agent.progress + Math.random() * 5),
              filesModified:
                agent.progress % 10 === 0
                  ? agent.filesModified + 1
                  : agent.filesModified,
              linesWritten: agent.linesWritten + Math.floor(Math.random() * 50),
            };
          }
          return agent;
        })
      );
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const overallProgress =
    agents.reduce((sum, agent) => sum + agent.progress, 0) / agents.length;

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Team Progress</span>
            <Badge variant="outline" className="text-base">
              {Math.round(overallProgress)}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>{agents.length} agents working</span>
            </div>
            <div className="flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              <span>
                {agents.reduce((sum, a) => sum + a.filesModified, 0)} files
                modified
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>Estimated: 2-4 hours remaining</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Individual Agent Progress */}
      <div className="grid gap-4 md:grid-cols-2">
        {agents.map((agent) => {
          const Icon = AGENT_ICONS[agent.role];
          const colorClass = AGENT_COLORS[agent.role];
          const statusBadge = STATUS_BADGES[agent.status];

          return (
            <Card key={agent.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full bg-muted ${colorClass}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{agent.name}</CardTitle>
                      <p className="text-xs text-muted-foreground capitalize">
                        {agent.role}
                      </p>
                    </div>
                  </div>
                  <Badge variant={statusBadge.variant}>
                    {agent.status === "working" && (
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                    )}
                    {agent.status === "completed" && (
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                    )}
                    {statusBadge.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Task */}
                {agent.currentTask && (
                  <div>
                    <p className="text-sm font-medium mb-1">Current Task</p>
                    <p className="text-sm text-muted-foreground">
                      {agent.currentTask}
                    </p>
                  </div>
                )}

                {/* Progress Bar */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Progress</p>
                    <span className="text-sm text-muted-foreground">
                      {Math.round(agent.progress)}%
                    </span>
                  </div>
                  <Progress value={agent.progress} className="h-2" />
                </div>

                {/* Stats */}
                {agent.role !== "guardian" && (
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground">Files</p>
                      <p className="text-sm font-semibold">
                        {agent.filesModified}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Lines Written
                      </p>
                      <p className="text-sm font-semibold">
                        {agent.linesWritten.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                agent: "Frontend Lead",
                action: "Created component: UserDashboard.tsx",
                time: "2 min ago",
              },
              {
                agent: "Backend Lead",
                action: "Implemented API route: /api/users",
                time: "3 min ago",
              },
              {
                agent: "Guardian",
                action: "Approved PR: Authentication system",
                time: "5 min ago",
              },
              {
                agent: "Frontend Lead",
                action: "Added styles: tailwind.config.ts",
                time: "7 min ago",
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 text-sm border-l-2 border-muted pl-4 pb-3"
              >
                <div className="flex-1">
                  <p className="font-medium">{activity.agent}</p>
                  <p className="text-muted-foreground">{activity.action}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {activity.time}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
