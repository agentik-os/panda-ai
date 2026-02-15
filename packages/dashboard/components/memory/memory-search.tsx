"use client";

/**
 * Memory Search Component
 * Step-073: Semantic search interface for agent conversations
 */

import { useState } from "react";
import { useAction, useQuery, api } from "@/lib/convex";
import {
  Search,
  Calendar,
  Bot,
  Loader2,
  MessageSquare,
  ExternalLink,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface SearchFilters {
  agentId?: string;
  startDate?: number;
  endDate?: number;
}

export function MemorySearch() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const semanticSearch = useAction(api.actions.memory.semanticSearch);
  const agents = useQuery(api.queries.agents.list, {});

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const searchResults = await semanticSearch({
        query,
        agentId: filters.agentId as any,
        startDate: filters.startDate,
        endDate: filters.endDate,
        limit: 20,
      });
      setResults(searchResults || []);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Memory Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search conversations, memories, and context..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
              />
            </div>
            <Button
              onClick={handleSearch}
              disabled={isSearching || !query.trim()}
            >
              {isSearching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Searching...
                </>
              ) : (
                "Search"
              )}
            </Button>
          </div>

          {/* Filters */}
          <div className="flex gap-3">
            {/* Agent Filter */}
            <Select
              value={filters.agentId}
              onValueChange={(value) =>
                setFilters((prev) => ({ ...prev, agentId: value }))
              }
            >
              <SelectTrigger className="w-[200px]">
                <Bot className="mr-2 h-4 w-4" />
                <SelectValue placeholder="All Agents" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Agents</SelectItem>
                {agents?.map((agent: any) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <div className="flex items-center gap-2 border rounded-md px-3 py-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">All Time</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">
              {results.length} {results.length === 1 ? "result" : "results"} found
            </h3>
          </div>

          {results.map((result, index) => (
            <Card key={result._id || index} className="hover:bg-accent/50 transition-colors">
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <Badge variant="outline">{result.agentName}</Badge>
                      <Badge variant="secondary">{result.role}</Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(result.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* Content Preview */}
                  <div className="space-y-2">
                    <p className="text-sm line-clamp-3">{result.content}</p>
                    {result.sessionId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8"
                        onClick={() => {
                          // Navigate to conversation context
                          window.open(
                            `/dashboard/agents/${result.agentId}?session=${result.sessionId}`,
                            "_blank"
                          );
                        }}
                      >
                        View Context
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  {/* Metadata */}
                  {result.skillsUsed && result.skillsUsed.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {result.skillsUsed.map((skill: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {results.length === 0 && query && !isSearching && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Search className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No results found</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Try adjusting your search query or filters
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
