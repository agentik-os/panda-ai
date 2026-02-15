"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface QuorumSelectorProps {
  selectedModels: string[];
  onModelsChange: (models: string[]) => void;
  query: string;
  onQueryChange: (query: string) => void;
}

const AVAILABLE_MODELS = [
  { id: "claude-sonnet-4.5", name: "Claude Sonnet 4.5", provider: "Anthropic" },
  { id: "claude-opus-4.6", name: "Claude Opus 4.6", provider: "Anthropic" },
  { id: "gpt-5", name: "GPT-5", provider: "OpenAI" },
  { id: "gemini-2.5", name: "Gemini 2.5 Pro", provider: "Google" },
  { id: "ollama-llama3", name: "Llama 3 (Local)", provider: "Ollama" },
];

export function QuorumSelector({
  selectedModels,
  onModelsChange,
  query,
  onQueryChange,
}: QuorumSelectorProps) {
  const handleToggleModel = (modelId: string) => {
    if (selectedModels.includes(modelId)) {
      onModelsChange(selectedModels.filter((id) => id !== modelId));
    } else {
      onModelsChange([...selectedModels, modelId]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Query Input */}
      <div className="space-y-2">
        <Label htmlFor="query">Query</Label>
        <Textarea
          id="query"
          placeholder="Enter your question or topic..."
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          rows={4}
        />
      </div>

      <Separator />

      {/* Model Selection */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Select Models ({selectedModels.length} selected)</Label>
          {selectedModels.length >= 2 && (
            <Badge variant="default">Ready</Badge>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {AVAILABLE_MODELS.map((model) => (
            <div
              key={model.id}
              className="flex items-center space-x-2 rounded-lg border p-3 hover:bg-accent cursor-pointer"
              onClick={() => handleToggleModel(model.id)}
            >
              <Checkbox
                id={model.id}
                checked={selectedModels.includes(model.id)}
                onCheckedChange={() => handleToggleModel(model.id)}
              />
              <div className="flex-1">
                <label
                  htmlFor={model.id}
                  className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {model.name}
                </label>
                <p className="text-xs text-muted-foreground">{model.provider}</p>
              </div>
            </div>
          ))}
        </div>

        {selectedModels.length < 2 && (
          <p className="text-xs text-muted-foreground">
            Select at least 2 models to run consensus
          </p>
        )}
      </div>
    </div>
  );
}
