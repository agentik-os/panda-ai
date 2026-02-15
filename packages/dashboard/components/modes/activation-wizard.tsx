"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { type OfficialModeId } from "@agentik-os/shared";

interface ActivationWizardProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModeId: OfficialModeId | null;
}

type WizardStep = "select-mode" | "configure" | "review" | "success";

export function ActivationWizard({ isOpen, onClose, selectedModeId }: ActivationWizardProps) {
  const [step, setStep] = useState<WizardStep>("select-mode");
  const [selectedMode, setSelectedMode] = useState<OfficialModeId | null>(selectedModeId);
  const [enableSharedMemory, setEnableSharedMemory] = useState(true);
  const [enableAutomations, setEnableAutomations] = useState(true);
  const [defaultModel, setDefaultModel] = useState("claude-sonnet-4.5");

  const handleActivate = () => {
    // TODO: Call Convex mutation to activate mode
    console.log("Activating mode:", {
      modeId: selectedMode,
      enableSharedMemory,
      enableAutomations,
      defaultModel,
    });

    setStep("success");

    // Close wizard after 2 seconds
    setTimeout(() => {
      handleClose();
    }, 2000);
  };

  const handleClose = () => {
    setStep("select-mode");
    setSelectedMode(null);
    onClose();
  };

  const handleNext = () => {
    if (step === "select-mode") {
      setStep("configure");
    } else if (step === "configure") {
      setStep("review");
    }
  };

  const handleBack = () => {
    if (step === "configure") {
      setStep("select-mode");
    } else if (step === "review") {
      setStep("configure");
    }
  };

  // Update selectedMode when selectedModeId prop changes
  if (selectedModeId && selectedModeId !== selectedMode && step === "select-mode") {
    setSelectedMode(selectedModeId);
    setStep("configure");
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {step === "select-mode" && "Activate OS Mode"}
            {step === "configure" && "Configure Mode"}
            {step === "review" && "Review Activation"}
            {step === "success" && "Mode Activated!"}
          </DialogTitle>
          <DialogDescription>
            {step === "select-mode" && "Choose an OS mode to activate."}
            {step === "configure" && "Configure mode settings and preferences."}
            {step === "review" && "Review your configuration before activation."}
            {step === "success" && "Your OS mode is now active and ready to use."}
          </DialogDescription>
        </DialogHeader>

        {/* Step: Select Mode */}
        {step === "select-mode" && (
          <div className="space-y-4">
            <Label>Select Mode</Label>
            <Select
              value={selectedMode || undefined}
              onValueChange={(value) => setSelectedMode(value as OfficialModeId)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a mode..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="human-os">Human OS</SelectItem>
                <SelectItem value="business-os">Business OS</SelectItem>
                <SelectItem value="dev-os">Dev OS</SelectItem>
                <SelectItem value="marketing-os">Marketing OS</SelectItem>
                <SelectItem value="sales-os">Sales OS</SelectItem>
                <SelectItem value="design-os">Design OS</SelectItem>
                <SelectItem value="art-os">Art OS</SelectItem>
                <SelectItem value="ask-os">Ask OS</SelectItem>
                <SelectItem value="finance-os">Finance OS</SelectItem>
                <SelectItem value="learning-os">Learning OS</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Step: Configure */}
        {step === "configure" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Shared Memory</Label>
                <p className="text-sm text-muted-foreground">
                  Allow mode to access memory from other modes
                </p>
              </div>
              <Switch checked={enableSharedMemory} onCheckedChange={setEnableSharedMemory} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Automations</Label>
                <p className="text-sm text-muted-foreground">
                  Enable mode-specific automations and workflows
                </p>
              </div>
              <Switch checked={enableAutomations} onCheckedChange={setEnableAutomations} />
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Default AI Model</Label>
              <Select value={defaultModel} onValueChange={setDefaultModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="claude-sonnet-4.5">Claude Sonnet 4.5</SelectItem>
                  <SelectItem value="claude-opus-4.6">Claude Opus 4.6</SelectItem>
                  <SelectItem value="gpt-5">GPT-5</SelectItem>
                  <SelectItem value="gemini-2.5">Gemini 2.5</SelectItem>
                  <SelectItem value="ollama">Ollama (Local)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step: Review */}
        {step === "review" && (
          <div className="space-y-4">
            <div className="rounded-lg border p-4 space-y-3">
              <div>
                <p className="text-sm font-medium">Mode</p>
                <p className="text-sm text-muted-foreground">
                  {selectedMode?.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                </p>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">Configuration</p>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant={enableSharedMemory ? "default" : "outline"}>
                      {enableSharedMemory ? "Enabled" : "Disabled"}
                    </Badge>
                    <span className="text-muted-foreground">Shared Memory</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant={enableAutomations ? "default" : "outline"}>
                      {enableAutomations ? "Enabled" : "Disabled"}
                    </Badge>
                    <span className="text-muted-foreground">Automations</span>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium">Default Model</p>
                <p className="text-sm text-muted-foreground">{defaultModel}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20 mb-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <p className="text-sm text-muted-foreground">
              {selectedMode?.replace("-", " ").replace(/\b\w/g, (l: string) => l.toUpperCase())} is now active!
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step !== "select-mode" && step !== "success" && (
            <Button variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}

          {step === "select-mode" && (
            <Button onClick={handleNext} disabled={!selectedMode}>
              Next
            </Button>
          )}

          {step === "configure" && <Button onClick={handleNext}>Next</Button>}

          {step === "review" && <Button onClick={handleActivate}>Activate Mode</Button>}

          {step === "success" && (
            <Button onClick={handleClose}>Close</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
