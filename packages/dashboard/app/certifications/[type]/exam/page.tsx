"use client";

import { useState, useCallback } from "react";
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
import { ExamQuestion } from "@/components/certifications/exam-question";

interface Question {
  id: number;
  section: string;
  question: string;
  options: string[];
  correctIndex: number;
}

interface ExamConfig {
  title: string;
  shortName: string;
  duration: number; // minutes
  passingPercent: number;
  questions: Question[];
}

const examData: Record<string, ExamConfig> = {
  aocd: {
    title: "AOCD Certification Exam",
    shortName: "AOCD",
    duration: 90,
    passingPercent: 75,
    questions: [
      {
        id: 1,
        section: "Architecture",
        question: "What is the primary role of the Runtime Engine?",
        options: [
          "Serve the web dashboard",
          "Process messages through the middleware pipeline",
          "Store data in the database",
          "Manage user authentication",
        ],
        correctIndex: 1,
      },
      {
        id: 2,
        section: "Architecture",
        question: "Which package contains the SkillBase class?",
        options: [
          "@agentik-os/runtime",
          "@agentik-os/cli",
          "@agentik-os/sdk",
          "@agentik-os/shared",
        ],
        correctIndex: 2,
      },
      {
        id: 3,
        section: "Architecture",
        question: "What database does Agentik OS use for real-time data?",
        options: ["PostgreSQL", "MongoDB", "Convex", "SQLite"],
        correctIndex: 2,
      },
      {
        id: 4,
        section: "Architecture",
        question:
          "In the message pipeline, what happens after authentication?",
        options: [
          "Model routing",
          "Rate limiting",
          "Skill execution",
          "Response formatting",
        ],
        correctIndex: 1,
      },
      {
        id: 5,
        section: "Architecture",
        question: "Which tool manages the Agentik OS monorepo?",
        options: ["Lerna", "Nx", "Turborepo", "Rush"],
        correctIndex: 2,
      },
      {
        id: 6,
        section: "Skill Development",
        question: "What class must all skills extend?",
        options: ["BasePlugin", "SkillBase", "AgentSkill", "SkillHandler"],
        correctIndex: 1,
      },
      {
        id: 7,
        section: "Skill Development",
        question: "What naming convention is required for skill IDs?",
        options: ["camelCase", "PascalCase", "kebab-case", "SCREAMING_CASE"],
        correctIndex: 2,
      },
      {
        id: 8,
        section: "Skill Development",
        question: "How many permission categories exist?",
        options: ["5", "7", "9", "12"],
        correctIndex: 2,
      },
      {
        id: 9,
        section: "Skill Development",
        question: "Which command creates a new skill from template?",
        options: [
          "panda create skill",
          "panda skill create",
          "panda new skill",
          "panda skill init",
        ],
        correctIndex: 1,
      },
      {
        id: 10,
        section: "Skill Development",
        question: "Which function creates a mock context for testing?",
        options: [
          "mockContext()",
          "createMockContext()",
          "setupContext()",
          "testContext()",
        ],
        correctIndex: 1,
      },
      {
        id: 11,
        section: "Best Practices",
        question: "What technology sandboxes skill execution?",
        options: ["Docker", "WASM (Extism)", "VM", "chroot"],
        correctIndex: 1,
      },
      {
        id: 12,
        section: "Best Practices",
        question: "Default budget alert threshold is:",
        options: ["50%", "70%", "80%", "95%"],
        correctIndex: 2,
      },
      {
        id: 13,
        section: "Best Practices",
        question: "Which deployment method does panda deploy support?",
        options: [
          "Docker and Kubernetes",
          "AWS Lambda only",
          "Vercel only",
          "Heroku only",
        ],
        correctIndex: 0,
      },
      {
        id: 14,
        section: "Architecture",
        question: "Which model routing strategy queries multiple models?",
        options: ["Direct", "Fallback", "Cost-Optimized", "Consensus"],
        correctIndex: 3,
      },
      {
        id: 15,
        section: "Architecture",
        question: "What framework is the dashboard built with?",
        options: ["React + Vite", "Next.js 16", "Remix", "SvelteKit"],
        correctIndex: 1,
      },
    ],
  },
  aocm: {
    title: "AOCM Certification Exam",
    shortName: "AOCM",
    duration: 60,
    passingPercent: 70,
    questions: [
      {
        id: 1,
        section: "Use Cases",
        question:
          "What percentage of customer queries can a Tier 1 AI agent typically handle?",
        options: ["40-50%", "60-70%", "80-85%", "95-100%"],
        correctIndex: 2,
      },
      {
        id: 2,
        section: "Use Cases",
        question:
          "Which channel is best for real-time customer support on a website?",
        options: ["Email", "Web Chat (API)", "CLI", "Telegram"],
        correctIndex: 1,
      },
      {
        id: 3,
        section: "Agent Design",
        question:
          "Which AI model is best for high-volume, simple FAQ responses?",
        options: ["Claude Opus", "GPT-4", "Claude Haiku", "Gemini Pro"],
        correctIndex: 2,
      },
      {
        id: 4,
        section: "Agent Design",
        question:
          "What should you ALWAYS include in a support agent's system prompt?",
        options: [
          "Competitor pricing",
          "Escalation triggers and rules",
          "Internal company financials",
          "Employee contact information",
        ],
        correctIndex: 1,
      },
      {
        id: 5,
        section: "Agent Design",
        question: "When installing a marketplace skill, what should you check?",
        options: [
          "The skill's star rating only",
          "That the permissions match the skill's purpose",
          "Nothing, all skills are safe",
          "The developer's social media profiles",
        ],
        correctIndex: 1,
      },
      {
        id: 6,
        section: "Measuring Success",
        question: "What is the typical cost reduction for AI-automated support?",
        options: ["20-30%", "50-60%", "80-90%", "100%"],
        correctIndex: 2,
      },
      {
        id: 7,
        section: "Use Cases",
        question:
          "In a content creation pipeline, what does the human always do?",
        options: [
          "Write the first draft",
          "Research topics",
          "Final approval and publish",
          "Grammar checking",
        ],
        correctIndex: 2,
      },
      {
        id: 8,
        section: "Agent Design",
        question: "What is the best approach when an agent can't answer?",
        options: [
          "Make up an answer",
          "Ignore the question",
          "Escalate to a human",
          "End the conversation",
        ],
        correctIndex: 2,
      },
      {
        id: 9,
        section: "Measuring Success",
        question: "Which metric measures customer satisfaction?",
        options: ["CTR", "CSAT", "CPM", "CPC"],
        correctIndex: 1,
      },
      {
        id: 10,
        section: "Agent Design",
        question: "Why use multiple specialized agents instead of one?",
        options: [
          "It's cheaper",
          "It looks more professional",
          "Specialized agents are better at specific tasks",
          "Agentik OS requires it",
        ],
        correctIndex: 2,
      },
    ],
  },
};

type ExamState = "intro" | "in-progress" | "completed";

export default function ExamPage() {
  const params = useParams();
  const type = params.type as string;
  const exam = examData[type];

  const [state, setState] = useState<ExamState>("intro");
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!exam) {
    notFound();
  }

  const handleAnswer = useCallback(
    (questionId: number, optionIndex: number) => {
      setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
    },
    [],
  );

  const handleSubmit = useCallback(() => {
    setState("completed");
  }, []);

  const score = exam.questions.reduce((acc, q) => {
    return acc + (answers[q.id] === q.correctIndex ? 1 : 0);
  }, 0);

  const percentage = Math.round((score / exam.questions.length) * 100);
  const passed = percentage >= exam.passingPercent;

  if (state === "intro") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <div className="mb-2">
          <Link
            href={`/certifications/${type}`}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; {exam.shortName} Details
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{exam.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>Duration:</strong> {exam.duration} minutes
              </p>
              <p>
                <strong>Questions:</strong> {exam.questions.length}
              </p>
              <p>
                <strong>Passing Score:</strong> {exam.passingPercent}%
              </p>
            </div>

            <div className="mb-6 rounded-md border bg-muted/30 p-4 text-sm">
              <h4 className="mb-2 font-medium">Exam Rules</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>- Answer all questions before submitting</li>
                <li>- You can navigate between questions freely</li>
                <li>- Maximum 3 attempts per 6-month period</li>
                <li>- 2-week waiting period between attempts</li>
              </ul>
            </div>

            <Button onClick={() => setState("in-progress")} size="lg">
              Start Exam
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state === "completed") {
    return (
      <div className="container mx-auto max-w-2xl px-4 py-12">
        <Card>
          <CardHeader>
            <CardTitle>Exam Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-6 text-center">
              <div
                className={`mb-2 text-5xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}
              >
                {percentage}%
              </div>
              <div className="text-lg text-muted-foreground">
                {score}/{exam.questions.length} correct
              </div>
              <Badge
                className={`mt-3 text-sm ${passed ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
              >
                {passed ? "PASSED" : "NOT PASSED"}
              </Badge>
            </div>

            {passed ? (
              <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200">
                Congratulations! You have earned the {exam.shortName}{" "}
                certification. Your digital badge will be issued shortly.
              </div>
            ) : (
              <div className="mb-6 rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200">
                You did not meet the passing score of {exam.passingPercent}%.
                Review the material and try again after the waiting period.
              </div>
            )}

            <div className="mb-6">
              <h4 className="mb-3 text-sm font-medium">Review Answers</h4>
              <div className="space-y-3">
                {exam.questions.map((q) => {
                  const userAnswer = answers[q.id];
                  const isCorrect = userAnswer === q.correctIndex;
                  return (
                    <div
                      key={q.id}
                      className={`rounded-md border p-3 text-sm ${isCorrect ? "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950" : "border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"}`}
                    >
                      <div className="mb-1 font-medium">
                        Q{q.id}: {q.question}
                      </div>
                      <div className="text-muted-foreground">
                        Your answer:{" "}
                        {userAnswer !== undefined
                          ? q.options[userAnswer]
                          : "Not answered"}
                      </div>
                      {!isCorrect && (
                        <div className="mt-1 text-green-700 dark:text-green-300">
                          Correct: {q.options[q.correctIndex]}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <Button asChild>
                <Link href={`/certifications/${type}`}>Back to Details</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/certifications">All Certifications</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // In-progress state
  const currentQuestion = exam.questions[currentIndex];
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="container mx-auto max-w-2xl px-4 py-12">
      <div className="mb-4 flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Question {currentIndex + 1} of {exam.questions.length}
        </div>
        <div className="text-sm text-muted-foreground">
          {answeredCount}/{exam.questions.length} answered
        </div>
      </div>

      <div className="mb-4 h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary transition-all"
          style={{
            width: `${((currentIndex + 1) / exam.questions.length) * 100}%`,
          }}
        />
      </div>

      {currentQuestion && (
        <ExamQuestion
          questionNumber={currentIndex + 1}
          section={currentQuestion.section}
          question={currentQuestion.question}
          options={currentQuestion.options}
          selectedIndex={answers[currentQuestion.id]}
          onSelect={(index) => handleAnswer(currentQuestion.id, index)}
        />
      )}

      <div className="mt-6 flex items-center justify-between">
        <Button
          variant="outline"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          Previous
        </Button>

        <div className="flex gap-2">
          {currentIndex < exam.questions.length - 1 ? (
            <Button onClick={() => setCurrentIndex((i) => i + 1)}>Next</Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={answeredCount < exam.questions.length}
              variant={
                answeredCount >= exam.questions.length ? "default" : "outline"
              }
            >
              Submit Exam
            </Button>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-1.5">
        {exam.questions.map((q, i) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(i)}
            className={`flex h-8 w-8 items-center justify-center rounded text-xs font-medium transition-colors ${
              i === currentIndex
                ? "bg-primary text-primary-foreground"
                : answers[q.id] !== undefined
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
