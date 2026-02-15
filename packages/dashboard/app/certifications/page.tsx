"use client";

import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CertificationProgram {
  id: string;
  title: string;
  shortName: string;
  description: string;
  duration: string;
  examDuration: string;
  passingScore: string;
  level: "beginner" | "intermediate" | "advanced";
  audience: string;
  modules: number;
  questions: number;
  topics: string[];
}

const certifications: CertificationProgram[] = [
  {
    id: "aocd",
    title: "Agentik OS Certified Developer",
    shortName: "AOCD",
    description:
      "Validate your proficiency in building, deploying, and maintaining AI agents on the Agentik OS platform. Covers architecture, skill development, best practices, and production deployment.",
    duration: "20 hours",
    examDuration: "90 minutes",
    passingScore: "75%",
    level: "intermediate",
    audience: "Developers & Engineers",
    modules: 4,
    questions: 50,
    topics: [
      "Architecture & Core Concepts",
      "Skill Development",
      "Best Practices & Production",
      "Hands-On Capstone",
    ],
  },
  {
    id: "aocm",
    title: "Agentik OS Certified Marketer",
    shortName: "AOCM",
    description:
      "Learn to leverage AI agents for marketing, sales, and business operations. No coding required. Covers use cases, agent design, prompt engineering, and measuring ROI.",
    duration: "10 hours",
    examDuration: "60 minutes",
    passingScore: "70%",
    level: "beginner",
    audience: "Marketers & Business Users",
    modules: 4,
    questions: 35,
    topics: [
      "AI Agent Use Cases",
      "Agent Design for Non-Developers",
      "Measuring Success",
      "Hands-On Capstone",
    ],
  },
];

const levelColors: Record<string, string> = {
  beginner: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  intermediate: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  advanced: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
};

export default function CertificationsPage() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-12">
      <div className="mb-10 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-tight">
          Certifications
        </h1>
        <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
          Validate your skills with official Agentik OS certifications. Earn
          verifiable badges and join the certified community.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {certifications.map((cert) => (
          <Card key={cert.id} className="flex flex-col">
            <CardHeader>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="outline" className="text-sm font-semibold">
                  {cert.shortName}
                </Badge>
                <Badge className={levelColors[cert.level]}>
                  {cert.level}
                </Badge>
              </div>
              <CardTitle className="text-xl">{cert.title}</CardTitle>
              <CardDescription className="text-sm">
                {cert.audience}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col">
              <p className="mb-4 text-sm text-muted-foreground">
                {cert.description}
              </p>

              <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="font-medium">Duration:</span>{" "}
                  {cert.duration}
                </div>
                <div>
                  <span className="font-medium">Exam:</span>{" "}
                  {cert.examDuration}
                </div>
                <div>
                  <span className="font-medium">Passing:</span>{" "}
                  {cert.passingScore}
                </div>
                <div>
                  <span className="font-medium">Questions:</span>{" "}
                  {cert.questions}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="mb-2 text-sm font-medium">Modules</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  {cert.topics.map((topic, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground/60">
                        {i + 1}.
                      </span>
                      {topic}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-auto flex gap-3">
                <Button asChild className="flex-1">
                  <Link href={`/certifications/${cert.id}`}>Learn More</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/certifications/${cert.id}/exam`}>
                    Take Exam
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-12 rounded-lg border bg-muted/30 p-8 text-center">
        <h2 className="mb-2 text-xl font-semibold">
          Certification Benefits
        </h2>
        <div className="mx-auto mt-6 grid max-w-3xl gap-6 sm:grid-cols-2 md:grid-cols-4">
          {[
            { label: "Digital Badge", desc: "Verifiable on-chain" },
            { label: "Certificate", desc: "Downloadable PDF" },
            { label: "Profile Flair", desc: "Marketplace badge" },
            { label: "Community", desc: "Alumni access" },
          ].map((benefit) => (
            <div key={benefit.label}>
              <div className="text-sm font-medium">{benefit.label}</div>
              <div className="text-xs text-muted-foreground">
                {benefit.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
