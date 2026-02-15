"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Zap, Shield, Plus, X } from "lucide-react";

export function ScheduleWizard() {
  const [agentId, setAgentId] = useState("");
  const [scheduleTime, setScheduleTime] = useState("02:00");
  const [approvalThreshold, setApprovalThreshold] = useState("10");
  const [enabled, setEnabled] = useState(true);
  const [actions, setActions] = useState<string[]>([]);
  const [newAction, setNewAction] = useState("");

  const handleAddAction = () => {
    if (newAction.trim()) {
      setActions([...actions, newAction.trim()]);
      setNewAction("");
    }
  };

  const handleRemoveAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  const handleSchedule = () => {
    // TODO: Connect to backend when ready (Task #92 completion)
    console.log("Schedule dream:", {
      agentId,
      scheduleTime,
      approvalThreshold,
      enabled,
      actions,
    });
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Configuration Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Dream Schedule Configuration
          </CardTitle>
          <CardDescription>
            Schedule nightly agent processing with automated actions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Agent Selection */}
          <div className="space-y-2">
            <Label htmlFor="agent">Select Agent</Label>
            <Select value={agentId} onValueChange={setAgentId}>
              <SelectTrigger id="agent">
                <SelectValue placeholder="Choose an agent..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="agent-1">Customer Support Agent</SelectItem>
                <SelectItem value="agent-2">Research Assistant</SelectItem>
                <SelectItem value="agent-3">Code Review Bot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Schedule Time */}
          <div className="space-y-2">
            <Label htmlFor="time" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Dream Time (Nightly)
            </Label>
            <Input
              id="time"
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Agent will process and take actions at this time every night
            </p>
          </div>

          {/* Approval Threshold */}
          <div className="space-y-2">
            <Label htmlFor="threshold" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Auto-Approval Threshold ($)
            </Label>
            <Input
              id="threshold"
              type="number"
              min="0"
              step="0.01"
              value={approvalThreshold}
              onChange={(e) => setApprovalThreshold(e.target.value)}
              placeholder="10.00"
            />
            <p className="text-xs text-muted-foreground">
              Actions costing less than this amount will be auto-approved
            </p>
          </div>

          {/* Allowed Actions */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Allowed Actions
            </Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., send_email, create_draft, update_status"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddAction()}
              />
              <Button size="icon" onClick={handleAddAction}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {actions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {actions.map((action, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {action}
                    <button
                      onClick={() => handleRemoveAction(i)}
                      className="ml-1 rounded-full hover:bg-muted"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Enable/Disable */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="enabled">Enable Dream Schedule</Label>
              <p className="text-sm text-muted-foreground">
                Agent will run nightly at the scheduled time
              </p>
            </div>
            <Switch
              id="enabled"
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button onClick={handleSchedule} className="flex-1" disabled={!agentId}>
              Schedule Dream
            </Button>
            <Button variant="outline">Cancel</Button>
          </div>
        </CardContent>
      </Card>

      {/* Active Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Dream Schedules</CardTitle>
          <CardDescription>
            Currently scheduled nightly agent processing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Mock schedule entries */}
            {[
              {
                agent: "Customer Support Agent",
                time: "02:00",
                threshold: "$5.00",
                actions: 3,
                enabled: true,
              },
              {
                agent: "Research Assistant",
                time: "03:00",
                threshold: "$10.00",
                actions: 5,
                enabled: true,
              },
              {
                agent: "Code Review Bot",
                time: "04:00",
                threshold: "$2.00",
                actions: 2,
                enabled: false,
              },
            ].map((schedule, i) => (
              <Card key={i} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold">{schedule.agent}</h4>
                      <Badge variant={schedule.enabled ? "default" : "secondary"}>
                        {schedule.enabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {schedule.time}
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {schedule.threshold}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {schedule.actions} actions
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                </div>
              </Card>
            ))}

            {/* Empty state */}
            {false && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No dream schedules configured yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Create your first schedule to get started
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
