"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface DiffViewerProps {
  original: string;
  replayed: string;
}

export function DiffViewer({ original, replayed }: DiffViewerProps) {
  // TODO: When react-diff-viewer-continued is installed (Step 114), replace with proper diff library
  // For now, simple side-by-side view

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* Original */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="default">Original</Badge>
          <span className="text-xs text-muted-foreground">claude-opus-4</span>
        </div>
        <div className="rounded border bg-muted/50 p-3">
          <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
            {original}
          </pre>
        </div>
      </Card>

      {/* Replayed */}
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2">
          <Badge variant="secondary">Replayed</Badge>
          <span className="text-xs text-muted-foreground">Cheaper model</span>
        </div>
        <div className="rounded border bg-muted/50 p-3">
          <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
            {replayed}
          </pre>
        </div>
      </Card>
    </div>
  );
}

/*
TODO: When ready to install react-diff-viewer-continued (Step 114):

1. Install dependency:
   pnpm add react-diff-viewer-continued

2. Replace component with:

import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued';

export function DiffViewer({ original, replayed }: DiffViewerProps) {
  return (
    <div className="rounded-lg border overflow-hidden">
      <ReactDiffViewer
        oldValue={original}
        newValue={replayed}
        splitView={true}
        compareMethod={DiffMethod.WORDS}
        leftTitle="Original (Opus)"
        rightTitle="Replayed (Cheaper Model)"
        showDiffOnly={false}
        styles={{
          variables: {
            dark: {
              diffViewerBackground: 'hsl(var(--background))',
              addedBackground: 'hsl(142 76% 36% / 0.15)',
              addedColor: 'hsl(142 71% 45%)',
              removedBackground: 'hsl(0 84% 60% / 0.15)',
              removedColor: 'hsl(0 84% 60%)',
              wordAddedBackground: 'hsl(142 76% 36% / 0.25)',
              wordRemovedBackground: 'hsl(0 84% 60% / 0.25)',
              gutterBackground: 'hsl(var(--muted))',
              gutterColor: 'hsl(var(--muted-foreground))',
              codeFoldGutterBackground: 'hsl(var(--muted))',
              codeFoldBackground: 'hsl(var(--muted))',
            },
          },
        }}
      />
    </div>
  );
}
*/
