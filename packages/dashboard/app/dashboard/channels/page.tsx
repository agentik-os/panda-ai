import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Radio, Plus } from "lucide-react";

export default function ChannelsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Channels</h1>
          <p className="text-muted-foreground">
            Connect agents to communication platforms.
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Channel
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[
          { name: "CLI", type: "Terminal", status: "connected" },
          { name: "Dashboard", type: "Web", status: "connected" },
          { name: "Discord", type: "Chat", status: "disconnected" },
          { name: "Slack", type: "Chat", status: "connected" },
          { name: "Telegram", type: "Chat", status: "disconnected" },
          { name: "API", type: "REST", status: "connected" },
        ].map((channel, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Radio className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{channel.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {channel.type}
                    </p>
                  </div>
                </div>
                <Badge variant={channel.status === "connected" ? "default" : "secondary"}>
                  {channel.status}
                </Badge>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}
