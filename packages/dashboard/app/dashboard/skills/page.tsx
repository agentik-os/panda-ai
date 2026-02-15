import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Plus } from "lucide-react";

export default function SkillsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Skills</h1>
          <p className="text-muted-foreground">
            Extend agent capabilities with custom skills.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Skill
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "Web Search", category: "Research", active: true },
          { name: "Code Execution", category: "Development", active: true },
          { name: "File Management", category: "System", active: true },
          { name: "Email Integration", category: "Communication", active: false },
          { name: "Database Query", category: "Data", active: true },
          { name: "API Integration", category: "Development", active: true },
        ].map((skill, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{skill.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {skill.category}
                    </p>
                  </div>
                </div>
                <Badge variant={skill.active ? "default" : "outline"}>
                  {skill.active ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
