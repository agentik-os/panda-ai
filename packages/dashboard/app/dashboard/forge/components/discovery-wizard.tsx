"use client";

/**
 * Discovery Wizard Component
 * Interactive questions to understand project idea and scope
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, ArrowLeft, Sparkles } from "lucide-react";

interface DiscoveryWizardProps {
  onComplete: (data: DiscoveryData) => void;
}

interface DiscoveryData {
  projectName: string;
  tagline: string;
  problem: string;
  targetAudience: string;
  coreFeatures: string[];
  niceToHave: string[];
  monetization: string;
  timeline: string;
  technicalLevel: string;
}

const QUESTIONS = [
  {
    id: "basics",
    title: "Project Basics",
    description: "Let's start with the fundamentals",
  },
  {
    id: "problem",
    title: "Problem & Solution",
    description: "What pain point are you solving?",
  },
  {
    id: "features",
    title: "Features & Scope",
    description: "What should your MVP include?",
  },
  {
    id: "business",
    title: "Business Model",
    description: "How will this create value?",
  },
];

export function DiscoveryWizard({ onComplete }: DiscoveryWizardProps) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<DiscoveryData>>({
    coreFeatures: [],
    niceToHave: [],
  });

  const [featureInput, setFeatureInput] = useState("");
  const [niceToHaveInput, setNiceToHaveInput] = useState("");

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setData({
        ...data,
        coreFeatures: [...(data.coreFeatures || []), featureInput.trim()],
      });
      setFeatureInput("");
    }
  };

  const handleAddNiceToHave = () => {
    if (niceToHaveInput.trim()) {
      setData({
        ...data,
        niceToHave: [...(data.niceToHave || []), niceToHaveInput.trim()],
      });
      setNiceToHaveInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    if (!data.coreFeatures) return;
    setData({
      ...data,
      coreFeatures: data.coreFeatures.filter((_, i) => i !== index),
    });
  };

  const handleRemoveNiceToHave = (index: number) => {
    if (!data.niceToHave) return;
    setData({
      ...data,
      niceToHave: data.niceToHave.filter((_, i) => i !== index),
    });
  };

  const handleNext = () => {
    if (step < QUESTIONS.length - 1) {
      setStep(step + 1);
    } else {
      onComplete(data as DiscoveryData);
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 0:
        return data.projectName && data.tagline;
      case 1:
        return data.problem && data.targetAudience;
      case 2:
        return (data.coreFeatures?.length || 0) > 0;
      case 3:
        return data.monetization && data.timeline;
      default:
        return true;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              {QUESTIONS[step]?.title || "Discovery"}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {QUESTIONS[step]?.description || "Let's get started"}
            </p>
          </div>
          <Badge variant="outline">
            Step {step + 1} of {QUESTIONS.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 0: Basics */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="projectName">Project Name *</Label>
              <Input
                id="projectName"
                placeholder="e.g., TaskMaster AI"
                value={data.projectName || ""}
                onChange={(e) =>
                  setData({ ...data, projectName: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="tagline">One-Line Tagline *</Label>
              <Input
                id="tagline"
                placeholder="e.g., AI-powered task management for busy teams"
                value={data.tagline || ""}
                onChange={(e) => setData({ ...data, tagline: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Describe your product in one compelling sentence
              </p>
            </div>

            <div>
              <Label htmlFor="technicalLevel">Your Technical Level</Label>
              <Select
                value={data.technicalLevel || ""}
                onValueChange={(value) =>
                  setData({ ...data, technicalLevel: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    Beginner - Learning to code
                  </SelectItem>
                  <SelectItem value="intermediate">
                    Intermediate - Can build basic apps
                  </SelectItem>
                  <SelectItem value="advanced">
                    Advanced - Professional developer
                  </SelectItem>
                  <SelectItem value="expert">
                    Expert - Can architect complex systems
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 1: Problem */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="problem">What Problem Are You Solving? *</Label>
              <Textarea
                id="problem"
                placeholder="Describe the pain point your product addresses. Be specific about who has this problem and why it matters."
                value={data.problem || ""}
                onChange={(e) => setData({ ...data, problem: e.target.value })}
                rows={4}
              />
            </div>

            <div>
              <Label htmlFor="targetAudience">Who Is Your Target User? *</Label>
              <Textarea
                id="targetAudience"
                placeholder="e.g., Small business owners who struggle with task delegation and team coordination"
                value={data.targetAudience || ""}
                onChange={(e) =>
                  setData({ ...data, targetAudience: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 2: Features */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Core Features (Must-Haves) *</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add a core feature..."
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleAddFeature()}
                />
                <Button onClick={handleAddFeature} variant="outline">
                  Add
                </Button>
              </div>
              {(data.coreFeatures?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {data.coreFeatures?.map((feature, index) => (
                    <Badge
                      key={index}
                      variant="default"
                      className="cursor-pointer"
                      onClick={() => handleRemoveFeature(index)}
                    >
                      {feature} ×
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Features essential for your MVP to be functional
              </p>
            </div>

            <div>
              <Label>Nice-to-Have Features</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Add a nice-to-have feature..."
                  value={niceToHaveInput}
                  onChange={(e) => setNiceToHaveInput(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && handleAddNiceToHave()
                  }
                />
                <Button onClick={handleAddNiceToHave} variant="outline">
                  Add
                </Button>
              </div>
              {(data.niceToHave?.length || 0) > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {data.niceToHave?.map((feature, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveNiceToHave(index)}
                    >
                      {feature} ×
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-2">
                Features you'd like but can launch without
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Business */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="monetization">Monetization Strategy *</Label>
              <Select
                value={data.monetization || ""}
                onValueChange={(value) =>
                  setData({ ...data, monetization: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="How will you make money?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freemium">
                    Freemium (Free tier + Paid upgrades)
                  </SelectItem>
                  <SelectItem value="subscription">
                    Subscription (Monthly/Annual)
                  </SelectItem>
                  <SelectItem value="one-time">
                    One-Time Payment
                  </SelectItem>
                  <SelectItem value="usage">
                    Usage-Based Pricing
                  </SelectItem>
                  <SelectItem value="free">
                    Free (No monetization yet)
                  </SelectItem>
                  <SelectItem value="ads">
                    Advertising
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="timeline">Launch Timeline *</Label>
              <Select
                value={data.timeline || ""}
                onValueChange={(value) => setData({ ...data, timeline: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="When do you want to launch?" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asap">
                    ASAP (Within 1 week)
                  </SelectItem>
                  <SelectItem value="month">
                    1-2 Months
                  </SelectItem>
                  <SelectItem value="quarter">
                    This Quarter
                  </SelectItem>
                  <SelectItem value="exploring">
                    Just Exploring
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="gap-2"
          >
            {step === QUESTIONS.length - 1 ? "Complete Discovery" : "Next"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
