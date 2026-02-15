"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Clock, CheckCircle2, XCircle, AlertCircle, Search, Calendar } from "lucide-react";

// Mock history data
const mockHistory = [
  {
    id: "dream-1",
    agentName: "Customer Support Agent",
    date: "2026-02-14",
    time: "02:00 AM",
    duration: "3.2s",
    status: "completed",
    actionsTotal: 8,
    actionsApproved: 6,
    actionsFailed: 0,
    cost: "$1.24",
  },
  {
    id: "dream-2",
    agentName: "Research Assistant",
    date: "2026-02-14",
    time: "03:00 AM",
    duration: "5.1s",
    status: "completed",
    actionsTotal: 12,
    actionsApproved: 12,
    actionsFailed: 0,
    cost: "$2.45",
  },
  {
    id: "dream-3",
    agentName: "Code Review Bot",
    date: "2026-02-13",
    time: "04:00 AM",
    duration: "2.8s",
    status: "partial",
    actionsTotal: 5,
    actionsApproved: 3,
    actionsFailed: 2,
    cost: "$0.89",
  },
  {
    id: "dream-4",
    agentName: "Customer Support Agent",
    date: "2026-02-13",
    time: "02:00 AM",
    duration: "4.1s",
    status: "completed",
    actionsTotal: 10,
    actionsApproved: 8,
    actionsFailed: 0,
    cost: "$1.67",
  },
  {
    id: "dream-5",
    agentName: "Research Assistant",
    date: "2026-02-13",
    time: "03:00 AM",
    duration: "6.2s",
    status: "completed",
    actionsTotal: 15,
    actionsApproved: 15,
    actionsFailed: 0,
    cost: "$3.12",
  },
];

export function DreamHistory() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            Completed
          </Badge>
        );
      case "partial":
        return (
          <Badge variant="secondary">
            <AlertCircle className="mr-1 h-3 w-3" />
            Partial
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive">
            <XCircle className="mr-1 h-3 w-3" />
            Failed
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Dream Session History</CardTitle>
            <CardDescription>Past dream sessions and their outcomes</CardDescription>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:flex-initial sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search sessions..." className="pl-9" />
            </div>
            <Select defaultValue="all">
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="partial">Partial</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {mockHistory.map((session) => (
            <Card key={session.id} className="p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* Left: Session Info */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between sm:items-center">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
                      <h4 className="font-semibold">{session.agentName}</h4>
                      {getStatusBadge(session.status)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {session.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {session.time}
                    </span>
                    <span>Duration: {session.duration}</span>
                    <span>Cost: {session.cost}</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs">
                      {session.actionsTotal} total actions
                    </Badge>
                    {session.actionsApproved > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {session.actionsApproved} approved
                      </Badge>
                    )}
                    {session.actionsFailed > 0 && (
                      <Badge variant="destructive" className="text-xs">
                        {session.actionsFailed} failed
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Right: Actions */}
                <Button variant="ghost" size="sm" className="w-full sm:w-auto">
                  View Details
                </Button>
              </div>
            </Card>
          ))}

          {/* Empty state */}
          {mockHistory.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground/50" />
              <p className="mt-4 text-sm text-muted-foreground">
                No dream sessions yet
              </p>
              <p className="text-xs text-muted-foreground">
                History will appear after your first dream session
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {mockHistory.length > 0 && (
          <div className="mt-6 flex items-center justify-between border-t pt-4">
            <p className="text-sm text-muted-foreground">
              Showing 1-{mockHistory.length} of {mockHistory.length} sessions
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm" disabled>
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
