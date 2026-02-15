"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  Undo2,
  Mail,
  Download,
  ChevronRight,
} from "lucide-react";

// Mock report data
const mockReports = [
  {
    id: "report-1",
    agentName: "Customer Support Agent",
    date: "2026-02-14",
    dreamTime: "02:00 AM",
    duration: "3.2s",
    summary: "Processed 24 customer inquiries, categorized and drafted responses",
    insights: [
      "Peak inquiry time: 2-4 PM",
      "Most common topic: Billing questions (35%)",
      "Average response quality: 94%",
    ],
    actionsTotal: 8,
    actionsApproved: 6,
    actionsRequiringReview: 2,
    totalCost: "$1.24",
    memoryConsolidated: "142 KB",
  },
  {
    id: "report-2",
    agentName: "Research Assistant",
    date: "2026-02-14",
    dreamTime: "03:00 AM",
    duration: "5.1s",
    summary: "Analyzed 15 research papers, extracted key findings, generated citations",
    insights: [
      "Emerging trend: AI safety research increasing 23%",
      "Most cited author: Geoffrey Hinton",
      "Average paper length: 8,400 words",
    ],
    actionsT: 12,
    actionsApproved: 12,
    actionsRequiringReview: 0,
    totalCost: "$2.45",
    memoryConsolidated: "256 KB",
  },
];

export function ReportViewer() {
  const [selectedReport, setSelectedReport] = useState<typeof mockReports[0] | null>(
    mockReports[0] ?? null
  );

  if (!selectedReport) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Sparkles className="h-12 w-12 text-muted-foreground/50" />
          <p className="mt-4 text-sm text-muted-foreground">
            No report selected
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Reports List */}
      <Card className="lg:col-span-1">
        <CardHeader>
          <CardTitle>Recent Reports</CardTitle>
          <CardDescription>Morning insights from dream sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {mockReports.map((report) => (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report)}
                className={`w-full rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                  selectedReport.id === report.id
                    ? "border-primary bg-muted"
                    : "border-border"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm">{report.agentName}</h4>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {report.date} at {report.dreamTime}
                    </div>
                    <div className="mt-2 flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {report.actionsTotal} actions
                      </Badge>
                      {report.actionsRequiringReview > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {report.actionsRequiringReview} need review
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </button>
            ))}

            {/* Empty state */}
            {mockReports.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No morning reports yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Reports appear after dream sessions complete
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Report Details */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Morning Report
              </CardTitle>
              <CardDescription className="mt-1">
                {selectedReport.agentName} • {selectedReport.date}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Email
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Duration
              </div>
              <p className="mt-1 text-xl font-bold">{selectedReport.duration}</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4" />
                Actions
              </div>
              <p className="mt-1 text-xl font-bold">{selectedReport.actionsTotal}</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <DollarSign className="h-4 w-4" />
                Cost
              </div>
              <p className="mt-1 text-xl font-bold">{selectedReport.totalCost}</p>
            </div>
            <div className="rounded-lg border p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4" />
                Memory
              </div>
              <p className="mt-1 text-xl font-bold">
                {selectedReport.memoryConsolidated}
              </p>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="summary" className="w-full">
            <TabsList>
              <TabsTrigger value="summary">Summary</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="actions">Actions</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4 mt-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-2">What Happened</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedReport.summary}
                </p>
              </div>
            </TabsContent>

            <TabsContent value="insights" className="space-y-4 mt-4">
              <div className="rounded-lg border p-4">
                <h4 className="font-semibold mb-3">Key Insights</h4>
                <ul className="space-y-2">
                  {selectedReport.insights.map((insight, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Sparkles className="h-4 w-4 text-amber-500 mt-0.5" />
                      <span className="text-muted-foreground">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4 mt-4">
              <div className="space-y-2">
                {/* Approved actions */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    <h4 className="font-semibold">
                      Auto-Approved ({selectedReport.actionsApproved})
                    </h4>
                  </div>
                  <div className="space-y-2">
                    {[...Array(selectedReport.actionsApproved)].map((_, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded border p-3 text-sm"
                      >
                        <div className="flex-1">
                          <p className="font-medium">Action {i + 1}</p>
                          <p className="text-xs text-muted-foreground">
                            Cost: ${(0.15 + i * 0.03).toFixed(2)} • Executed
                            successfully
                          </p>
                        </div>
                        <Button variant="ghost" size="sm">
                          <Undo2 className="mr-2 h-4 w-4" />
                          Undo
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions requiring review */}
                {selectedReport.actionsRequiringReview > 0 && (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/20">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertCircle className="h-5 w-5 text-amber-600" />
                      <h4 className="font-semibold text-amber-900 dark:text-amber-100">
                        Awaiting Review ({selectedReport.actionsRequiringReview})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {[...Array(selectedReport.actionsRequiringReview)].map(
                        (_, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between rounded border border-amber-300 bg-background p-3 text-sm dark:border-amber-800"
                          >
                            <div className="flex-1">
                              <p className="font-medium">High-Cost Action {i + 1}</p>
                              <p className="text-xs text-muted-foreground">
                                Cost: ${(12.50 + i * 5).toFixed(2)} • Exceeds
                                threshold
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" variant="default">
                                Approve
                              </Button>
                              <Button size="sm" variant="outline">
                                Reject
                              </Button>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
