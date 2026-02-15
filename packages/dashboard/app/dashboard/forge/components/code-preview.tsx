"use client";

/**
 * Code Preview Component
 * Preview and explore the generated codebase
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileCode,
  Folder,
  Download,
  ExternalLink,
  CheckCircle2,
  Rocket,
  Terminal,
  Eye,
} from "lucide-react";

interface CodePreviewProps {
  codebase: string; // Will be used to load actual generated codebase
}

interface FileTreeNode {
  name: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
  content?: string;
}

const SAMPLE_FILE_TREE: FileTreeNode[] = [
  {
    name: "src",
    type: "folder",
    children: [
      {
        name: "components",
        type: "folder",
        children: [
          {
            name: "Dashboard.tsx",
            type: "file",
            content: `export function Dashboard() {\n  return (\n    <div className="p-6">\n      <h1>Dashboard</h1>\n    </div>\n  );\n}`,
          },
          {
            name: "UserProfile.tsx",
            type: "file",
            content: `export function UserProfile() {\n  return <div>User Profile</div>;\n}`,
          },
        ],
      },
      {
        name: "pages",
        type: "folder",
        children: [
          {
            name: "index.tsx",
            type: "file",
            content: `import { Dashboard } from '@/components/Dashboard';\n\nexport default function Home() {\n  return <Dashboard />;\n}`,
          },
        ],
      },
    ],
  },
  {
    name: "package.json",
    type: "file",
    content: `{\n  "name": "my-app",\n  "version": "1.0.0",\n  "dependencies": {\n    "next": "^16.0.0",\n    "react": "^19.0.0"\n  }\n}`,
  },
];

export function CodePreview({ codebase: _codebase }: CodePreviewProps) {
  const [selectedFile, setSelectedFile] = useState<string | null>(
    "src/components/Dashboard.tsx"
  );
  const [fileTree] = useState<FileTreeNode[]>(SAMPLE_FILE_TREE);

  const findFile = (
    tree: FileTreeNode[],
    path: string
  ): FileTreeNode | null => {
    for (const node of tree) {
      if (node.type === "file" && node.name === path.split("/").pop()) {
        return node;
      }
      if (node.type === "folder" && node.children) {
        const found = findFile(node.children, path);
        if (found) return found;
      }
    }
    return null;
  };

  const renderFileTree = (nodes: FileTreeNode[], prefix = "") => {
    return nodes.map((node, index) => {
      const fullPath = prefix ? `${prefix}/${node.name}` : node.name;
      const isSelected = selectedFile === fullPath;

      if (node.type === "folder") {
        return (
          <div key={index} className="ml-4">
            <div className="flex items-center gap-2 py-1 text-sm">
              <Folder className="h-4 w-4 text-blue-500" />
              <span className="font-medium">{node.name}</span>
            </div>
            {node.children && renderFileTree(node.children, fullPath)}
          </div>
        );
      }

      return (
        <div
          key={index}
          className={`ml-4 flex items-center gap-2 py-1 px-2 rounded cursor-pointer hover:bg-accent ${
            isSelected ? "bg-accent" : ""
          }`}
          onClick={() => setSelectedFile(fullPath)}
        >
          <FileCode className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">{node.name}</span>
        </div>
      );
    });
  };

  const currentFile = selectedFile ? findFile(fileTree, selectedFile) : null;

  return (
    <div className="space-y-6">
      {/* Success Banner */}
      <Card className="border-2 border-green-500/20 bg-green-500/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">MVP Ready!</h3>
                <p className="text-sm text-muted-foreground">
                  Your project has been built and is ready to deploy
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Download
              </Button>
              <Button className="gap-2">
                <Rocket className="h-4 w-4" />
                Deploy
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Files Created", value: "47", icon: FileCode },
          { label: "Lines of Code", value: "3,842", icon: Terminal },
          { label: "Components", value: "23", icon: Folder },
          { label: "Tests Written", value: "18", icon: CheckCircle2 },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                    <Icon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">
                      {stat.label}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Code Browser */}
      <Tabs defaultValue="code" className="space-y-4">
        <TabsList>
          <TabsTrigger value="code">Code</TabsTrigger>
          <TabsTrigger value="structure">Structure</TabsTrigger>
          <TabsTrigger value="preview">Live Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="space-y-0">
          <div className="grid grid-cols-[250px_1fr] gap-4">
            {/* File Tree */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">File Explorer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm">{renderFileTree(fileTree)}</div>
              </CardContent>
            </Card>

            {/* Code Viewer */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-mono">
                    {selectedFile || "Select a file"}
                  </CardTitle>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <Eye className="h-4 w-4" />
                    View Full
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {currentFile?.content ? (
                  <pre className="text-sm bg-muted p-4 rounded-lg overflow-x-auto">
                    <code>{currentFile.content}</code>
                  </pre>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileCode className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Select a file to view its contents</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="structure" className="space-y-0">
          <Card>
            <CardHeader>
              <CardTitle>Project Architecture</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Tech Stack</h4>
                  <div className="flex flex-wrap gap-2">
                    {["Next.js 16", "React 19", "TypeScript", "Tailwind", "Convex"].map(
                      (tech) => (
                        <Badge key={tech} variant="secondary">
                          {tech}
                        </Badge>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Features Implemented</h4>
                  <ul className="space-y-2 text-sm">
                    {[
                      "User authentication with Clerk",
                      "Dashboard with analytics",
                      "Real-time updates via Convex",
                      "Responsive design (mobile + desktop)",
                      "Dark mode support",
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-0">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Live Preview</CardTitle>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Open in New Tab
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Live preview will appear here
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Run <code className="bg-background px-2 py-1 rounded">npm run dev</code> locally to preview
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Next Steps</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button variant="outline" className="justify-start gap-2">
              <Terminal className="h-4 w-4" />
              Run Locally
            </Button>
            <Button variant="outline" className="justify-start gap-2">
              <Rocket className="h-4 w-4" />
              Deploy to Vercel
            </Button>
            <Button variant="outline" className="justify-start gap-2">
              <Download className="h-4 w-4" />
              Download ZIP
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
