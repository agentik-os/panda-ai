"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModuleInfo {
  title: string;
  duration: string;
  topics: string[];
  labs: string[];
}

interface CertDetail {
  title: string;
  shortName: string;
  description: string;
  prerequisites: string[];
  duration: string;
  examDuration: string;
  passingScore: string;
  validity: string;
  modules: ModuleInfo[];
}

const certData: Record<string, CertDetail> = {
  aocd: {
    title: "Agentik OS Certified Developer",
    shortName: "AOCD",
    description:
      "The AOCD certification validates proficiency in building, deploying, and maintaining AI agents on the Agentik OS platform.",
    prerequisites: [
      "Intermediate TypeScript/JavaScript experience",
      "Basic understanding of AI/LLM concepts",
      "Familiarity with REST APIs and async programming",
    ],
    duration: "20 hours",
    examDuration: "90 minutes",
    passingScore: "75% (38/50)",
    validity: "2 years (renewable)",
    modules: [
      {
        title: "Architecture & Core Concepts",
        duration: "5 hours",
        topics: [
          "Platform architecture overview",
          "Runtime engine & message pipeline",
          "Multi-model router (Claude, GPT, Gemini, Ollama)",
          "Channel adapters (CLI, API, Telegram, Discord)",
          "Convex backend & event sourcing",
        ],
        labs: [
          "Set up local development environment",
          "Trace a message through the pipeline",
          "Configure a multi-model agent",
        ],
      },
      {
        title: "Skill Development",
        duration: "6 hours",
        topics: [
          "SkillBase class and SDK types",
          "Permission system (9 categories)",
          "Skill manifest (skill.json)",
          "Testing framework: mocks, assertions, runner",
          "Hot-reload development with panda dev",
          "Publishing to the marketplace",
        ],
        labs: [
          "Create a skill from template",
          "Implement a weather lookup skill",
          "Write comprehensive tests",
          "Publish to the marketplace",
        ],
      },
      {
        title: "Best Practices & Production",
        duration: "5 hours",
        topics: [
          "WASM sandboxing & permission enforcement",
          "Authentication: SSO, OAuth, RBAC",
          "Performance: caching, batch processing",
          "Monitoring: Prometheus, Sentry",
          "Cost management & budget alerts",
          "Deployment: Docker, Kubernetes",
        ],
        labs: [
          "Configure RBAC and audit logging",
          "Set up Prometheus monitoring",
          "Deploy with Docker Compose",
          "Implement budget alerts",
        ],
      },
      {
        title: "Hands-On Capstone",
        duration: "4 hours",
        topics: [
          "Build a complete AI agent with 3+ skills",
          "Proper error handling and logging",
          "Monitoring and cost tracking",
          "Test suite with >80% coverage",
          "Production deployment",
        ],
        labs: ["Build and deploy a complete agent (graded project)"],
      },
    ],
  },
  aocm: {
    title: "Agentik OS Certified Marketer",
    shortName: "AOCM",
    description:
      "The AOCM certification validates proficiency in leveraging AI agents for marketing, sales, and business operations. No coding required.",
    prerequisites: [
      "Basic understanding of marketing concepts",
      "Familiarity with AI chatbots (ChatGPT, Claude, etc.)",
      "No programming experience required",
    ],
    duration: "10 hours",
    examDuration: "60 minutes",
    passingScore: "70% (25/35)",
    validity: "2 years (renewable)",
    modules: [
      {
        title: "AI Agent Use Cases",
        duration: "3 hours",
        topics: [
          "Customer support automation",
          "Lead generation & qualification",
          "Content creation workflows",
          "Email marketing personalization",
          "Multi-channel strategy",
        ],
        labs: [
          "Explore the Agentik OS dashboard",
          "Chat with pre-built marketing agents",
          "Map your workflow to agent capabilities",
        ],
      },
      {
        title: "Agent Design for Non-Developers",
        duration: "3 hours",
        topics: [
          "Agent anatomy: prompts, skills, models",
          "Prompt engineering for marketers",
          "Installing marketplace skills (no code)",
          "Multi-agent workflows",
          "Brand voice consistency & guardrails",
        ],
        labs: [
          "Create a customer support agent",
          "Write effective system prompts",
          "Install and configure marketplace skills",
          "Set up a multi-agent content pipeline",
        ],
      },
      {
        title: "Measuring Success",
        duration: "2 hours",
        topics: [
          "Key metrics for AI agent performance",
          "Cost tracking and budget management",
          "A/B testing agent configurations",
          "ROI calculation for agent deployment",
        ],
        labs: [
          "Set up cost alerts and budgets",
          "Configure analytics dashboard",
          "Run an A/B test between agents",
        ],
      },
      {
        title: "Hands-On Capstone",
        duration: "2 hours",
        topics: [
          "Deploy a marketing agent stack",
          "Configure channels and personas",
          "Document expected ROI",
        ],
        labs: ["Deploy a complete marketing agent (graded project)"],
      },
    ],
  },
};

export default function CertificationDetailPage() {
  const params = useParams();
  const type = params.type as string;
  const cert = certData[type];

  if (!cert) {
    notFound();
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="mb-2">
        <Link
          href="/certifications"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; All Certifications
        </Link>
      </div>

      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <Badge variant="outline" className="text-sm font-semibold">
            {cert.shortName}
          </Badge>
        </div>
        <h1 className="mb-2 text-3xl font-bold tracking-tight">
          {cert.title}
        </h1>
        <p className="text-lg text-muted-foreground">{cert.description}</p>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Duration", value: cert.duration },
          { label: "Exam", value: cert.examDuration },
          { label: "Passing Score", value: cert.passingScore },
          { label: "Validity", value: cert.validity },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4">
              <div className="text-xs text-muted-foreground">{stat.label}</div>
              <div className="text-lg font-semibold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-8">
        <h2 className="mb-3 text-lg font-semibold">Prerequisites</h2>
        <ul className="space-y-1 text-sm text-muted-foreground">
          {cert.prerequisites.map((p, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
              {p}
            </li>
          ))}
        </ul>
      </div>

      <Tabs defaultValue="module-0" className="mb-8">
        <TabsList className="mb-4">
          {cert.modules.map((_, i) => (
            <TabsTrigger key={i} value={`module-${i}`}>
              Module {i + 1}
            </TabsTrigger>
          ))}
        </TabsList>

        {cert.modules.map((mod, i) => (
          <TabsContent key={i} value={`module-${i}`}>
            <Card>
              <CardHeader>
                <CardTitle>
                  Module {i + 1}: {mod.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{mod.duration}</p>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="mb-2 text-sm font-medium">Topics</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {mod.topics.map((t, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground/40" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="mb-2 text-sm font-medium">Labs</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    {mod.labs.map((l, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary/40" />
                        {l}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex gap-3">
        <Button asChild size="lg">
          <Link href={`/certifications/${type}/exam`}>Start Exam</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/certifications">Back to All</Link>
        </Button>
      </div>
    </div>
  );
}
