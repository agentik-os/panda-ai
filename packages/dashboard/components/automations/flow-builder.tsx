"use client";

import { useCallback } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  type Connection,
  type Edge,
  type Node,
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Zap, Filter, Play } from "lucide-react";

// Custom node types for different automation components
const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  action: ActionNode,
};

// Initial nodes (example setup)
const initialNodes: Node[] = [
  {
    id: "trigger-1",
    type: "trigger",
    position: { x: 250, y: 50 },
    data: { label: "Trigger: Daily at 9am", type: "cron" },
  },
];

const initialEdges: Edge[] = [];

export function FlowBuilder() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;

      const reactFlowBounds = (event.target as HTMLElement)
        .closest(".react-flow")
        ?.getBoundingClientRect();

      if (!reactFlowBounds) return;

      const position = {
        x: event.clientX - reactFlowBounds.left - 100,
        y: event.clientY - reactFlowBounds.top - 25,
      };

      const newNode: Node = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: `New ${type}`, type },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  return (
    <Card className="h-[600px]">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Automation Flow</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-[540px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            nodeTypes={nodeTypes}
            fitView
          >
            <Controls />
            <MiniMap />
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          </ReactFlow>
        </div>
      </CardContent>
    </Card>
  );
}

// Custom Node Components
function TriggerNode({ data }: { data: { label: string; type: string } }) {
  return (
    <div className="rounded-lg border-2 border-blue-500 bg-background px-4 py-3 shadow-md min-w-[200px]">
      <div className="flex items-center gap-2 mb-1">
        <Zap className="h-4 w-4 text-blue-500" />
        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
          Trigger
        </Badge>
      </div>
      <div className="text-sm font-medium">{data.label}</div>
      <div className="text-xs text-muted-foreground mt-1">{data.type}</div>
    </div>
  );
}

function ConditionNode({ data }: { data: { label: string; type?: string } }) {
  return (
    <div className="rounded-lg border-2 border-amber-500 bg-background px-4 py-3 shadow-md min-w-[200px]">
      <div className="flex items-center gap-2 mb-1">
        <Filter className="h-4 w-4 text-amber-500" />
        <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
          Condition
        </Badge>
      </div>
      <div className="text-sm font-medium">{data.label}</div>
      {data.type && <div className="text-xs text-muted-foreground mt-1">{data.type}</div>}
    </div>
  );
}

function ActionNode({ data }: { data: { label: string; type?: string } }) {
  return (
    <div className="rounded-lg border-2 border-green-500 bg-background px-4 py-3 shadow-md min-w-[200px]">
      <div className="flex items-center gap-2 mb-1">
        <Play className="h-4 w-4 text-green-500" />
        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
          Action
        </Badge>
      </div>
      <div className="text-sm font-medium">{data.label}</div>
      {data.type && <div className="text-xs text-muted-foreground mt-1">{data.type}</div>}
    </div>
  );
}
