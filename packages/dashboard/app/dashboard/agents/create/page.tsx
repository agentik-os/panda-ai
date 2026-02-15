"use client";

// Force dynamic rendering (prevents build-time SSG errors with Convex)
export const dynamic = "force-dynamic";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Bot,
  Sparkles,
  MessageSquare,
  Zap,
} from "lucide-react";
import { useMutation, api } from "@/lib/convex";

type WizardStep = "basic" | "model" | "channels" | "skills" | "review";

const MODELS = [
  { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { id: "claude-3-5-haiku-20241022", name: "Claude 3.5 Haiku", provider: "Anthropic" },
  { id: "gpt-4o", name: "GPT-4o", provider: "OpenAI" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "OpenAI" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "Google" },
  { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "Google" },
];

const CHANNELS = [
  { id: "cli", name: "CLI", icon: MessageSquare, description: "Command-line interface" },
  { id: "api", name: "API", icon: Zap, description: "HTTP REST API" },
  { id: "telegram", name: "Telegram", icon: MessageSquare, description: "Telegram bot" },
  { id: "discord", name: "Discord", icon: MessageSquare, description: "Discord bot" },
  { id: "webhook", name: "Webhook", icon: Zap, description: "HTTP webhooks" },
];

const SKILLS = [
  { id: "web-search", name: "Web Search", description: "Search the web for information" },
  { id: "code-execution", name: "Code Execution", description: "Execute code snippets" },
  { id: "file-management", name: "File Management", description: "Read and write files" },
  { id: "calendar", name: "Calendar", description: "Manage calendar events" },
  { id: "email", name: "Email", description: "Send and receive emails" },
];

export default function CreateAgentPage() {
  const router = useRouter();
  const createAgent = useMutation(api.mutations.agents.create);

  const [step, setStep] = useState<WizardStep>("basic");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    systemPrompt: "",
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.7,
    maxTokens: 4000,
    channels: ["cli"] as string[],
    skills: [] as string[],
    status: "active" as "active" | "paused" | "inactive",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const steps: { id: WizardStep; title: string; icon: any }[] = [
    { id: "basic", title: "Basic Info", icon: Bot },
    { id: "model", title: "AI Model", icon: Sparkles },
    { id: "channels", title: "Channels", icon: MessageSquare },
    { id: "skills", title: "Skills", icon: Zap },
    { id: "review", title: "Review", icon: Check },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === step);

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setStep(steps[currentStepIndex + 1]!.id);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1]!.id);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // Derive provider from selected model
      const selectedModel = MODELS.find((m) => m.id === formData.model);
      const provider = selectedModel?.provider.toLowerCase() ?? "anthropic";

      await createAgent({
        name: formData.name,
        description: formData.description,
        systemPrompt: formData.systemPrompt,
        model: formData.model,
        provider,
        temperature: formData.temperature,
        maxTokens: formData.maxTokens,
        channels: formData.channels,
        skills: formData.skills,
        // Note: status is set to "active" by default in the mutation
      });
      router.push("/dashboard/agents");
    } catch (error) {
      console.error("Failed to create agent:", error);
      setIsSubmitting(false);
    }
  };

  const toggleChannel = (channelId: string) => {
    setFormData((prev) => ({
      ...prev,
      channels: prev.channels.includes(channelId)
        ? prev.channels.filter((c) => c !== channelId)
        : [...prev.channels, channelId],
    }));
  };

  const toggleSkill = (skillId: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skillId)
        ? prev.skills.filter((s) => s !== skillId)
        : [...prev.skills, skillId],
    }));
  };

  const isStepValid = () => {
    switch (step) {
      case "basic":
        return formData.name.trim() !== "" && formData.description.trim() !== "";
      case "model":
        return formData.model !== "";
      case "channels":
        return formData.channels.length > 0;
      case "skills":
        return true; // Skills are optional
      case "review":
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.push("/dashboard/agents")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create Agent</h1>
          <p className="text-muted-foreground">
            Set up a new AI agent with custom capabilities.
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((s, index) => {
          const StepIcon = s.icon;
          const isActive = s.id === step;
          const isCompleted = index < currentStepIndex;

          return (
            <div key={s.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center gap-2 flex-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                    isCompleted
                      ? "border-primary bg-primary text-primary-foreground"
                      : isActive
                        ? "border-primary bg-background text-primary"
                        : "border-muted bg-background text-muted-foreground"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <StepIcon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`text-sm font-medium ${
                    isActive ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {s.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-[2px] flex-1 transition-colors ${
                    isCompleted ? "bg-primary" : "bg-muted"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>{steps.find((s) => s.id === step)?.title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Info Step */}
          {step === "basic" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Agent Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Customer Support Agent"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe what this agent does..."
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  placeholder="You are a helpful assistant that..."
                  value={formData.systemPrompt}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, systemPrompt: e.target.value }))
                  }
                  rows={6}
                />
                <p className="text-xs text-muted-foreground">
                  Define the agent's behavior, personality, and capabilities.
                </p>
              </div>
            </div>
          )}

          {/* Model Selection Step */}
          {step === "model" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Select AI Model *</Label>
                <Select
                  value={formData.model}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, model: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        <div className="flex items-center gap-2">
                          <span>{model.name}</span>
                          <Badge variant="outline" className="text-xs">
                            {model.provider}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="temperature">
                  Temperature: {formData.temperature}
                </Label>
                <Input
                  id="temperature"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      temperature: parseFloat(e.target.value),
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Lower values make output more focused and deterministic. Higher values
                  increase creativity.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxTokens">Max Tokens</Label>
                <Input
                  id="maxTokens"
                  type="number"
                  min="100"
                  max="200000"
                  step="100"
                  value={formData.maxTokens}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      maxTokens: parseInt(e.target.value),
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Maximum length of the agent's response.
                </p>
              </div>
            </div>
          )}

          {/* Channels Step */}
          {step === "channels" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select the channels where this agent will be available.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {CHANNELS.map((channel) => {
                  const ChannelIcon = channel.icon;
                  const isSelected = formData.channels.includes(channel.id);

                  return (
                    <Card
                      key={channel.id}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? "border-primary bg-primary/5" : ""
                      }`}
                      onClick={() => toggleChannel(channel.id)}
                    >
                      <CardContent className="flex items-start gap-3 pt-6">
                        <div
                          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <ChannelIcon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{channel.name}</h4>
                            {isSelected && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {channel.description}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Skills Step */}
          {step === "skills" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Select skills to enhance your agent's capabilities (optional).
              </p>
              <div className="space-y-2">
                {SKILLS.map((skill) => {
                  const isSelected = formData.skills.includes(skill.id);

                  return (
                    <div
                      key={skill.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{skill.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {skill.description}
                        </p>
                      </div>
                      <Switch
                        checked={isSelected}
                        onCheckedChange={() => toggleSkill(skill.id)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Review Step */}
          {step === "review" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Review Your Agent</h3>
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Name</Label>
                      <p className="font-medium">{formData.name}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Model</Label>
                      <p className="font-medium">
                        {MODELS.find((m) => m.id === formData.model)?.name}
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Description</Label>
                    <p className="font-medium">{formData.description}</p>
                  </div>

                  {formData.systemPrompt && (
                    <div>
                      <Label className="text-muted-foreground">System Prompt</Label>
                      <p className="text-sm">{formData.systemPrompt}</p>
                    </div>
                  )}

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Temperature</Label>
                      <p className="font-medium">{formData.temperature}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Max Tokens</Label>
                      <p className="font-medium">{formData.maxTokens}</p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground">Channels</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.channels.map((channelId) => {
                        const channel = CHANNELS.find((c) => c.id === channelId);
                        return (
                          <Badge key={channelId} variant="secondary">
                            {channel?.name}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>

                  {formData.skills.length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Skills</Label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.skills.map((skillId) => {
                          const skill = SKILLS.find((s) => s.id === skillId);
                          return (
                            <Badge key={skillId} variant="outline">
                              {skill?.name}
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>

            {currentStepIndex < steps.length - 1 ? (
              <Button onClick={handleNext} disabled={!isStepValid()}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={isSubmitting || !isStepValid()}>
                {isSubmitting ? "Creating..." : "Create Agent"}
                <Check className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
