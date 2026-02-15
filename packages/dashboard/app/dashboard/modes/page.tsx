"use client";

// Force dynamic rendering (prevents build-time SSG errors with Convex)
export const dynamic = "force-dynamic";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2 } from "lucide-react";
import { useState } from "react";
import { ModeCard } from "@/components/modes/mode-card";
import { ActivationWizard } from "@/components/modes/activation-wizard";
import { OFFICIAL_MODE_IDS, type OfficialModeId } from "@agentik-os/shared";

export default function ModesPage() {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<OfficialModeId | null>(null);

  // Mock data - will be replaced with Convex queries
  const activeModes: string[] = [];
  const isLoading = false;

  const handleActivateMode = (modeId: OfficialModeId) => {
    setSelectedMode(modeId);
    setIsWizardOpen(true);
  };

  const handleCloseWizard = () => {
    setIsWizardOpen(false);
    setSelectedMode(null);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">OS Modes</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Activate pre-configured agent teams for different contexts.
          </p>
        </div>
        <Button onClick={() => setIsWizardOpen(true)} className="h-11 min-w-[44px]">
          <Plus className="mr-2 h-4 w-4" />
          Activate Mode
        </Button>
      </div>

      {/* Active Modes */}
      {activeModes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Active Modes</CardTitle>
            <CardDescription>
              Currently running OS modes ({activeModes.length})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {activeModes.map((modeId) => (
                <Badge key={modeId} variant="default">
                  {modeId}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Official Modes Grid */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Official Modes</h2>
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {OFFICIAL_MODE_IDS.map((modeId: OfficialModeId) => (
              <ModeCard
                key={modeId}
                modeId={modeId}
                isActive={activeModes.includes(modeId)}
                onActivate={() => handleActivateMode(modeId)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Community & Custom Modes */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Community & Custom Modes</h2>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-sm text-muted-foreground mb-4">
              Community modes coming soon! Create your own custom OS modes.
            </p>
            <Button variant="outline" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Create Custom Mode
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Activation Wizard */}
      <ActivationWizard
        isOpen={isWizardOpen}
        onClose={handleCloseWizard}
        selectedModeId={selectedMode}
      />
    </div>
  );
}
