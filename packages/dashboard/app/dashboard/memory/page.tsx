/**
 * Memory Search Page
 * Step-073: Semantic search interface for agent memories
 */

import { MemorySearch } from "@/components/memory/memory-search";

export default function MemoryPage() {
  return (
    <div className="container mx-auto p-6 max-w-5xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Memory Search</h1>
          <p className="text-muted-foreground mt-2">
            Search across all agent conversations using semantic similarity
          </p>
        </div>

        <MemorySearch />
      </div>
    </div>
  );
}
