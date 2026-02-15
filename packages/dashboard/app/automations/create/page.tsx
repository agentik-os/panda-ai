"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FlowBuilder } from "@/components/automations/flow-builder";
import { NodeLibrary } from "@/components/automations/node-library";
import { Play, Save, Settings } from "lucide-react";
import { useState } from "react";
import type { AutomationBuilderMode } from "@agentik-os/shared";

export default function AutomationCreatePage() {
  const [mode, setMode] = useState<AutomationBuilderMode>("visual");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  const handleSave = async () => {
    if (!name) return;

    setIsSaving(true);

    // TODO: Call Convex mutation to save automation
    console.log("Saving automation:", { name, description });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSaving(false);
  };

  const handleTest = async () => {
    setIsTesting(true);

    // TODO: Call Convex mutation to test automation
    console.log("Testing automation:", { name, description });

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsTesting(false);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create Automation</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Build workflows with visual drag-and-drop or natural language
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleTest}
            disabled={isTesting || !name}
            variant="outline"
          >
            <Play className="mr-2 h-4 w-4" />
            {isTesting ? "Testing..." : "Test"}
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !name}
          >
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>

      {/* Builder Mode Tabs */}
      <Tabs value={mode} onValueChange={(v) => setMode(v as AutomationBuilderMode)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visual">Visual Builder</TabsTrigger>
          <TabsTrigger value="natural-language">Natural Language</TabsTrigger>
          <TabsTrigger value="form">Form Builder</TabsTrigger>
        </TabsList>

        {/* Visual Builder */}
        <TabsContent value="visual" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Automation Details</CardTitle>
              <CardDescription>
                Name and describe your automation workflow
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Daily report generator"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this automation does..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-12 gap-4">
            {/* Node Library Sidebar */}
            <div className="col-span-3">
              <NodeLibrary />
            </div>

            {/* Flow Builder Canvas */}
            <div className="col-span-9">
              <FlowBuilder />
            </div>
          </div>
        </TabsContent>

        {/* Natural Language Builder */}
        <TabsContent value="natural-language" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Describe Your Automation</CardTitle>
              <CardDescription>
                Use plain English to describe what you want to automate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nl-name">Name</Label>
                <Input
                  id="nl-name"
                  placeholder="e.g., Daily report automation"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nl-prompt">What should this automation do?</Label>
                <Textarea
                  id="nl-prompt"
                  placeholder="Example: Every morning at 9am, fetch analytics data from the database, generate a summary using AI, and send it to my email..."
                  rows={8}
                />
              </div>
              <Button className="w-full">
                <Settings className="mr-2 h-4 w-4" />
                Generate Automation
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Examples</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Daily Report:</p>
                <p className="text-muted-foreground">
                  "Every weekday at 9am, query the database for yesterday's metrics,
                  use AI to summarize key insights, and email the report to team@company.com"
                </p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Onboarding Welcome:</p>
                <p className="text-muted-foreground">
                  "When a new user signs up, send them a welcome email,
                  create a Slack channel for their team, and schedule a follow-up task for 3 days later"
                </p>
              </div>
              <div className="rounded-lg border p-3 text-sm">
                <p className="font-medium">Content Moderation:</p>
                <p className="text-muted-foreground">
                  "When a post is created, use AI to analyze if it contains inappropriate content.
                  If flagged, send a notification to moderators and mark for review"
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Form Builder */}
        <TabsContent value="form" className="space-y-4 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Automation Configuration</CardTitle>
              <CardDescription>
                Step-by-step form to configure your automation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Form builder coming in Step-097 (Automation History & Logs)
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
