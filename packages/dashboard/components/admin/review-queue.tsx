"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SecurityReport } from "@/components/admin/security-report";
import {
  Package,
  Bot,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from "lucide-react";
import { useState } from "react";
import type { MarketplaceItem, MarketplaceItemStatus, MarketplaceSecurityScan } from "@agentik-os/shared";

interface ReviewQueueProps {
  items: MarketplaceItem[];
  status: MarketplaceItemStatus;
}

export function ReviewQueue({ items, status }: ReviewQueueProps) {
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewAction, setReviewAction] = useState<"approve" | "reject" | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  // Mock security scan - will be fetched from Convex
  const mockSecurityScan: MarketplaceSecurityScan = {
    id: "scan-001",
    itemId: "item-001",
    status: "passed",
    scannedAt: new Date(),
    findings: [
      {
        severity: "high",
        title: "Broad filesystem access",
        description: "Skill requests read access to entire filesystem",
        location: "manifest.json",
      },
      {
        severity: "medium",
        title: "Outdated dependency detected",
        description: "Package 'axios' version 0.21.1 has known vulnerabilities",
        location: "package.json",
      },
      {
        severity: "medium",
        title: "Potential SQL injection",
        description: "User input not properly sanitized before database query",
        location: "src/database.ts:45",
      },
    ],
  };

  const handleReview = (item: MarketplaceItem, action: "approve" | "reject") => {
    setSelectedItem(item);
    setReviewAction(action);
    setReviewDialogOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedItem || !reviewAction) return;

    // TODO: Call Convex mutation to approve/reject item
    console.log("Submitting review:", {
      itemId: selectedItem.id,
      action: reviewAction,
      notes: reviewNotes,
    });

    // Reset state
    setReviewDialogOpen(false);
    setSelectedItem(null);
    setReviewAction(null);
    setReviewNotes("");
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No items in this queue</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {items.map((item) => {
          const ItemIcon = item.type === "skill" ? Package : Bot;
          const hasSecurityIssues = mockSecurityScan.findings.some(
            (f: MarketplaceSecurityScan["findings"][number]) => f.severity === "critical" || f.severity === "high"
          );
          const permissions = (item.manifest.permissions as string[] | undefined) || [];

          return (
            <div
              key={item.id}
              className="rounded-lg border p-4 hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                  <ItemIcon className="h-6 w-6 text-primary" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          v{item.version}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {item.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    {status === "pending_review" && hasSecurityIssues && (
                      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>by {item.author.name}</span>
                    <span>•</span>
                    <span>Submitted {formatDate(item.publishedAt)}</span>
                    <span>•</span>
                    <span>{permissions.length} permissions</span>
                  </div>

                  {/* Security Badge */}
                  {status === "pending_review" && (
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      <Badge
                        variant={
                          mockSecurityScan.status === "passed"
                            ? "default"
                            : mockSecurityScan.status === "failed"
                            ? "destructive"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {mockSecurityScan.findings.filter((f: MarketplaceSecurityScan["findings"][number]) => f.severity === "critical").length} critical,{" "}
                        {mockSecurityScan.findings.filter((f: MarketplaceSecurityScan["findings"][number]) => f.severity === "high").length} high,{" "}
                        {mockSecurityScan.findings.filter((f: MarketplaceSecurityScan["findings"][number]) => f.severity === "medium").length} medium
                      </Badge>
                    </div>
                  )}

                  {/* Actions */}
                  {status === "pending_review" && (
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedItem(item)}
                      >
                        <Shield className="mr-2 h-4 w-4" />
                        View Security Report
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleReview(item, "approve")}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleReview(item, "reject")}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Report Dialog */}
      {selectedItem && !reviewDialogOpen && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>{selectedItem.name} - Security Report</DialogTitle>
              <DialogDescription>
                Automated security scan results and findings
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <SecurityReport scan={mockSecurityScan} />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Review Confirmation Dialog */}
      {reviewDialogOpen && selectedItem && reviewAction && (
        <Dialog open={reviewDialogOpen} onOpenChange={setReviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {reviewAction === "approve" ? "Approve" : "Reject"} {selectedItem.name}
              </DialogTitle>
              <DialogDescription>
                {reviewAction === "approve"
                  ? "This will publish the item to the marketplace and notify the author."
                  : "This will reject the submission and notify the author with your feedback."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notes">Review Notes</Label>
                <Textarea
                  id="notes"
                  placeholder={
                    reviewAction === "approve"
                      ? "Optional: Add notes for internal reference..."
                      : "Required: Explain why this submission was rejected..."
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setReviewDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={reviewAction === "approve" ? "default" : "destructive"}
                onClick={handleSubmitReview}
              >
                {reviewAction === "approve" ? "Approve & Publish" : "Reject & Notify"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
