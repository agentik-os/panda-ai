import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Workflow, Plus } from "lucide-react";

export default function AutomationsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Automations</h1>
          <p className="text-muted-foreground">
            Create workflows that run automatically.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Automation
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "Daily Report Generator", status: "active", runs: 127 },
          { name: "Support Ticket Triage", status: "active", runs: 89 },
          { name: "Code Review Workflow", status: "paused", runs: 45 },
          { name: "Data Sync Pipeline", status: "active", runs: 234 },
        ].map((automation, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Workflow className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{automation.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {automation.runs} runs
                    </p>
                  </div>
                </div>
                <Badge variant={automation.status === "active" ? "default" : "secondary"}>
                  {automation.status}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
