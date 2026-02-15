"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useMutation, api } from "@/lib/convex";
import { useState, useEffect } from "react";
import { X } from "lucide-react";

type Agent = {
  _id: any;
  name: string;
  description?: string;
  systemPrompt: string;
  model: string;
  provider: string;
  temperature?: number;
  maxTokens?: number;
  channels: string[];
  skills: string[];
  status: string;
};

interface AgentSettingsProps {
  agent: Agent;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AVAILABLE_CHANNELS = [
  "cli",
  "dashboard",
  "discord",
  "slack",
  "telegram",
  "api",
];

const AVAILABLE_SKILLS = [
  "web-search",
  "code-execution",
  "file-management",
  "image-generation",
  "data-analysis",
  "email",
  "calendar",
];

const PROVIDERS = [
  { value: "anthropic", label: "Anthropic" },
  { value: "openai", label: "OpenAI" },
  { value: "google", label: "Google" },
  { value: "ollama", label: "Ollama" },
];

const MODELS_BY_PROVIDER: Record<string, string[]> = {
  anthropic: ["claude-opus-4", "claude-sonnet-4", "claude-haiku-4"],
  openai: ["gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  google: ["gemini-pro", "gemini-ultra"],
  ollama: ["llama-3", "mistral", "codellama"],
};

export default function AgentSettings({
  agent,
  open,
  onOpenChange,
}: AgentSettingsProps) {
  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description || "",
    systemPrompt: agent.systemPrompt,
    provider: agent.provider,
    model: agent.model,
    temperature: agent.temperature ?? 0.7,
    maxTokens: agent.maxTokens ?? 4096,
    channels: agent.channels,
    skills: agent.skills,
  });

  const [isSaving, setIsSaving] = useState(false);
  const updateAgent = useMutation(api.mutations.agents.update);

  // Reset form when agent changes
  useEffect(() => {
    setFormData({
      name: agent.name,
      description: agent.description || "",
      systemPrompt: agent.systemPrompt,
      provider: agent.provider,
      model: agent.model,
      temperature: agent.temperature ?? 0.7,
      maxTokens: agent.maxTokens ?? 4096,
      channels: agent.channels,
      skills: agent.skills,
    });
  }, [agent]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateAgent({
        id: agent._id,
        ...formData,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to update agent:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const toggleChannel = (channel: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channel)
        ? prev.channels.filter((c) => c !== channel)
        : [...prev.channels, channel],
    }));
  };

  const toggleSkill = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Agent</DialogTitle>
          <DialogDescription>
            Update your agent's configuration and capabilities.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">System Prompt</Label>
            <Textarea
              id="systemPrompt"
              value={formData.systemPrompt}
              onChange={(e) =>
                setFormData({ ...formData, systemPrompt: e.target.value })
              }
              rows={4}
            />
          </div>

          {/* Provider & Model */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select
                value={formData.provider}
                onValueChange={(value) => {
                  const models = MODELS_BY_PROVIDER[value] || [];
                  setFormData({
                    ...formData,
                    provider: value,
                    model: models[0] || "",
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Model</Label>
              <Select
                value={formData.model}
                onValueChange={(value) =>
                  setFormData({ ...formData, model: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(MODELS_BY_PROVIDER[formData.provider] || []).map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Temperature & Max Tokens */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature ({formData.temperature})</Label>
              <Input
                id="temperature"
                type="number"
                min="0"
                max="2"
                step="0.1"
                value={formData.temperature}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    temperature: parseFloat(e.target.value),
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxTokens">Max Tokens</Label>
              <Input
                id="maxTokens"
                type="number"
                min="100"
                max="32000"
                step="100"
                value={formData.maxTokens}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    maxTokens: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* Channels */}
          <div className="space-y-2">
            <Label>Channels</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_CHANNELS.map((channel) => (
                <Badge
                  key={channel}
                  variant={
                    formData.channels.includes(channel) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleChannel(channel)}
                >
                  {channel}
                  {formData.channels.includes(channel) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Skills */}
          <div className="space-y-2">
            <Label>Skills</Label>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_SKILLS.map((skill) => (
                <Badge
                  key={skill}
                  variant={
                    formData.skills.includes(skill) ? "default" : "outline"
                  }
                  className="cursor-pointer"
                  onClick={() => toggleSkill(skill)}
                >
                  {skill}
                  {formData.skills.includes(skill) && (
                    <X className="ml-1 h-3 w-3" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
