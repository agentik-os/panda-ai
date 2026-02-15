import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ConvexAdapter,
  ConvexAdapterError,
  type Dream,
  type TimelineEvent,
  type EventFilters,
  type AgentFilters,
} from "./convex-adapter";

// ============================================================================
// Mock Convex Client
// ============================================================================

const mockMutation = vi.fn();
const mockQuery = vi.fn();

const mockClient = {
  mutation: mockMutation,
  query: mockQuery,
};

// Mock API structure
const mockApi = {
  agents: {
    createAgent: "agents:createAgent",
    getAgent: "agents:getAgent",
    getAgentByStringId: "agents:getAgentByStringId",
    listAgents: "agents:listAgents",
    updateAgent: "agents:updateAgent",
    deleteAgent: "agents:deleteAgent",
    saveDream: "agents:saveDream",
    getDreams: "agents:getDreams",
    saveTimelineEvent: "agents:saveTimelineEvent",
    getTimelineEvents: "agents:getTimelineEvents",
    getTimelineEvent: "agents:getTimelineEvent",
  },
};

function createAdapter(): ConvexAdapter {
  const adapter = new ConvexAdapter({ client: mockClient as any });
  // Inject mock API
  (adapter as any).api = mockApi;
  return adapter;
}

// ============================================================================
// Test Data Factories
// ============================================================================

function makeAgentDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: "agent_123",
    name: "Test Agent",
    description: "A test agent",
    systemPrompt: "You are a helpful assistant",
    model: "claude-opus-4",
    provider: "anthropic",
    temperature: 0.7,
    maxTokens: 4096,
    channels: ["cli", "api"],
    skills: ["web-search"],
    status: "active",
    createdAt: 1700000000000,
    updatedAt: 1700000000000,
    messageCount: 0,
    totalCost: 0,
    ...overrides,
  };
}

function makeDreamDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: "dream_456",
    agentId: "agent_123",
    timestamp: 1700000000000,
    insights: ["Learned about user preferences", "Improved response accuracy"],
    stateSnapshot: { memory: { size: 1024 } },
    approved: false,
    ...overrides,
  };
}

function makeEventDoc(overrides: Record<string, unknown> = {}) {
  return {
    _id: "event_789",
    agentId: "agent_123",
    eventType: "message_sent",
    timestamp: 1700000000000,
    data: { content: "Hello world" },
    cost: 0.005,
    ...overrides,
  };
}

// ============================================================================
// Tests
// ============================================================================

describe("ConvexAdapter", () => {
  let adapter: ConvexAdapter;

  beforeEach(() => {
    vi.clearAllMocks();
    adapter = createAdapter();
  });

  // --------------------------------------------------------------------------
  // Constructor
  // --------------------------------------------------------------------------

  describe("constructor", () => {
    it("accepts an injected client", () => {
      const a = new ConvexAdapter({ client: mockClient as any });
      expect(a).toBeInstanceOf(ConvexAdapter);
    });

    it("creates a client from URL", () => {
      const a = new ConvexAdapter({ url: "https://test.convex.cloud" });
      expect(a).toBeInstanceOf(ConvexAdapter);
    });

    it("falls back to env variable", () => {
      const origEnv = process.env.CONVEX_URL;
      process.env.CONVEX_URL = "https://env.convex.cloud";
      const a = new ConvexAdapter();
      expect(a).toBeInstanceOf(ConvexAdapter);
      process.env.CONVEX_URL = origEnv;
    });

    it("warns when using placeholder URL", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const origEnv = process.env.CONVEX_URL;
      delete process.env.CONVEX_URL;
      new ConvexAdapter();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining("CONVEX_URL not set"),
      );
      warnSpy.mockRestore();
      process.env.CONVEX_URL = origEnv;
    });
  });

  // --------------------------------------------------------------------------
  // Agent CRUD
  // --------------------------------------------------------------------------

  describe("createAgent", () => {
    it("creates an agent and returns the ID", async () => {
      mockMutation.mockResolvedValue("agent_new_123");

      const id = await adapter.createAgent({
        name: "New Agent",
        description: "Test",
        systemPrompt: "Be helpful",
        model: "claude-opus-4",
        temperature: 0.5,
        maxTokens: 2048,
        active: true,
        channels: ["cli"],
        skills: ["web-search"],
      });

      expect(id).toBe("agent_new_123");
      expect(mockMutation).toHaveBeenCalledWith(
        mockApi.agents.createAgent,
        expect.objectContaining({
          name: "New Agent",
          model: "claude-opus-4",
          provider: "anthropic",
        }),
      );
    });

    it("detects provider from model name (openai)", async () => {
      mockMutation.mockResolvedValue("agent_oai");

      await adapter.createAgent({
        name: "GPT Agent",
        description: "",
        systemPrompt: "Be helpful",
        model: "gpt-4o",
        temperature: 0.7,
        maxTokens: 4096,
        active: true,
        channels: [],
        skills: [],
      });

      expect(mockMutation).toHaveBeenCalledWith(
        mockApi.agents.createAgent,
        expect.objectContaining({ provider: "openai" }),
      );
    });

    it("detects provider from model name (google)", async () => {
      mockMutation.mockResolvedValue("agent_gem");

      await adapter.createAgent({
        name: "Gemini Agent",
        description: "",
        systemPrompt: "Be helpful",
        model: "gemini-pro",
        temperature: 0.7,
        maxTokens: 4096,
        active: true,
        channels: [],
        skills: [],
      });

      expect(mockMutation).toHaveBeenCalledWith(
        mockApi.agents.createAgent,
        expect.objectContaining({ provider: "google" }),
      );
    });

    it("defaults to ollama for unknown models", async () => {
      mockMutation.mockResolvedValue("agent_oll");

      await adapter.createAgent({
        name: "Local Agent",
        description: "",
        systemPrompt: "Be helpful",
        model: "llama-3-70b",
        temperature: 0.7,
        maxTokens: 4096,
        active: true,
        channels: [],
        skills: [],
      });

      expect(mockMutation).toHaveBeenCalledWith(
        mockApi.agents.createAgent,
        expect.objectContaining({ provider: "ollama" }),
      );
    });

    it("throws ConvexAdapterError on failure", async () => {
      mockMutation.mockRejectedValue(new Error("DB error"));

      await expect(
        adapter.createAgent({
          name: "Fail",
          description: "",
          systemPrompt: "x",
          model: "claude-opus-4",
          temperature: 0.7,
          maxTokens: 4096,
          active: true,
          channels: [],
          skills: [],
        }),
      ).rejects.toThrow(ConvexAdapterError);
    });
  });

  describe("getAgent", () => {
    it("returns an agent when found", async () => {
      mockQuery.mockResolvedValue(makeAgentDoc());

      const agent = await adapter.getAgent("agent_123");

      expect(agent).not.toBeNull();
      expect(agent!.id).toBe("agent_123");
      expect(agent!.name).toBe("Test Agent");
      expect(agent!.active).toBe(true);
      expect(agent!.createdAt).toBeInstanceOf(Date);
    });

    it("returns null when not found", async () => {
      mockQuery.mockResolvedValue(null);

      const agent = await adapter.getAgent("nonexistent");
      expect(agent).toBeNull();
    });

    it("converts doc status to active boolean", async () => {
      mockQuery.mockResolvedValue(makeAgentDoc({ status: "inactive" }));

      const agent = await adapter.getAgent("agent_123");
      expect(agent!.active).toBe(false);
    });

    it("handles missing optional fields", async () => {
      mockQuery.mockResolvedValue(
        makeAgentDoc({
          description: undefined,
          temperature: undefined,
          maxTokens: undefined,
        }),
      );

      const agent = await adapter.getAgent("agent_123");
      expect(agent!.description).toBe("");
      expect(agent!.temperature).toBe(0.7);
      expect(agent!.maxTokens).toBe(4096);
    });

    it("throws ConvexAdapterError on failure", async () => {
      mockQuery.mockRejectedValue(new Error("Network error"));

      await expect(adapter.getAgent("agent_123")).rejects.toThrow(
        ConvexAdapterError,
      );
    });
  });

  describe("listAgents", () => {
    it("returns all agents without filters", async () => {
      mockQuery.mockResolvedValue([makeAgentDoc(), makeAgentDoc({ _id: "agent_456", name: "Agent 2" })]);

      const agents = await adapter.listAgents();

      expect(agents).toHaveLength(2);
      expect(agents[0].name).toBe("Test Agent");
      expect(agents[1].name).toBe("Agent 2");
    });

    it("passes filters to query", async () => {
      mockQuery.mockResolvedValue([]);

      const filters: AgentFilters = {
        status: "active",
        model: "claude-opus-4",
        limit: 10,
      };
      await adapter.listAgents(filters);

      expect(mockQuery).toHaveBeenCalledWith(
        mockApi.agents.listAgents,
        expect.objectContaining({
          status: "active",
          model: "claude-opus-4",
          limit: 10,
        }),
      );
    });

    it("returns empty array when no agents match", async () => {
      mockQuery.mockResolvedValue([]);

      const agents = await adapter.listAgents({ status: "paused" });
      expect(agents).toEqual([]);
    });

    it("throws ConvexAdapterError on failure", async () => {
      mockQuery.mockRejectedValue(new Error("Timeout"));

      await expect(adapter.listAgents()).rejects.toThrow(ConvexAdapterError);
    });
  });

  describe("updateAgent", () => {
    it("updates agent fields", async () => {
      mockMutation.mockResolvedValue("agent_123");

      await adapter.updateAgent("agent_123", {
        name: "Updated Name",
        temperature: 0.9,
      });

      expect(mockMutation).toHaveBeenCalledWith(
        mockApi.agents.updateAgent,
        expect.objectContaining({
          id: "agent_123",
          name: "Updated Name",
          temperature: 0.9,
        }),
      );
    });

    it("converts active boolean to status string", async () => {
      mockMutation.mockResolvedValue("agent_123");

      await adapter.updateAgent("agent_123", { active: false });

      expect(mockMutation).toHaveBeenCalledWith(
        mockApi.agents.updateAgent,
        expect.objectContaining({
          status: "inactive",
        }),
      );
    });

    it("throws ConvexAdapterError on failure", async () => {
      mockMutation.mockRejectedValue(new Error("Not found"));

      await expect(
        adapter.updateAgent("bad_id", { name: "X" }),
      ).rejects.toThrow(ConvexAdapterError);
    });
  });

  describe("deleteAgent", () => {
    it("deletes an agent", async () => {
      mockMutation.mockResolvedValue({ success: true });

      await adapter.deleteAgent("agent_123");

      expect(mockMutation).toHaveBeenCalledWith(mockApi.agents.deleteAgent, {
        id: "agent_123",
      });
    });

    it("throws ConvexAdapterError on failure", async () => {
      mockMutation.mockRejectedValue(new Error("Agent not found"));

      await expect(adapter.deleteAgent("bad_id")).rejects.toThrow(
        ConvexAdapterError,
      );
    });
  });

  // --------------------------------------------------------------------------
  // Dreams
  // --------------------------------------------------------------------------

  describe("saveDream", () => {
    it("saves a dream and returns the ID", async () => {
      mockMutation.mockResolvedValue("dream_new");

      const id = await adapter.saveDream("agent_123", {
        timestamp: Date.now(),
        insights: ["Insight 1", "Insight 2"],
        stateSnapshot: { memory: { items: 42 } },
        approved: false,
      });

      expect(id).toBe("dream_new");
      expect(mockMutation).toHaveBeenCalledWith(
        mockApi.agents.saveDream,
        expect.objectContaining({
          agentId: "agent_123",
          insights: ["Insight 1", "Insight 2"],
          approved: false,
        }),
      );
    });

    it("handles null stateSnapshot", async () => {
      mockMutation.mockResolvedValue("dream_null");

      const id = await adapter.saveDream("agent_123", {
        timestamp: Date.now(),
        insights: [],
        stateSnapshot: undefined,
        approved: true,
      });

      expect(id).toBe("dream_null");
      expect(mockMutation).toHaveBeenCalledWith(
        mockApi.agents.saveDream,
        expect.objectContaining({
          stateSnapshot: null,
        }),
      );
    });

    it("throws ConvexAdapterError on failure", async () => {
      mockMutation.mockRejectedValue(new Error("DB full"));

      await expect(
        adapter.saveDream("agent_123", {
          timestamp: Date.now(),
          insights: [],
          stateSnapshot: null,
          approved: false,
        }),
      ).rejects.toThrow(ConvexAdapterError);
    });
  });

  describe("getDreams", () => {
    it("returns dreams for an agent", async () => {
      mockQuery.mockResolvedValue([makeDreamDoc(), makeDreamDoc({ _id: "dream_2" })]);

      const dreams = await adapter.getDreams("agent_123", 10);

      expect(dreams).toHaveLength(2);
      expect(dreams[0].id).toBe("dream_456");
      expect(dreams[0].insights).toEqual([
        "Learned about user preferences",
        "Improved response accuracy",
      ]);
    });

    it("uses default limit of 50", async () => {
      mockQuery.mockResolvedValue([]);

      await adapter.getDreams("agent_123");

      expect(mockQuery).toHaveBeenCalledWith(
        mockApi.agents.getDreams,
        expect.objectContaining({ limit: 50 }),
      );
    });

    it("returns empty array when no dreams exist", async () => {
      mockQuery.mockResolvedValue([]);

      const dreams = await adapter.getDreams("agent_no_dreams");
      expect(dreams).toEqual([]);
    });

    it("throws ConvexAdapterError on failure", async () => {
      mockQuery.mockRejectedValue(new Error("Timeout"));

      await expect(adapter.getDreams("agent_123")).rejects.toThrow(
        ConvexAdapterError,
      );
    });
  });

  // --------------------------------------------------------------------------
  // Timeline Events
  // --------------------------------------------------------------------------

  describe("saveEvent", () => {
    it("saves a timeline event and returns the ID", async () => {
      mockMutation.mockResolvedValue("event_new");

      const id = await adapter.saveEvent({
        agentId: "agent_123",
        eventType: "message_sent",
        timestamp: Date.now(),
        data: { content: "Test message" },
        cost: 0.01,
      });

      expect(id).toBe("event_new");
      expect(mockMutation).toHaveBeenCalledWith(
        mockApi.agents.saveTimelineEvent,
        expect.objectContaining({
          agentId: "agent_123",
          eventType: "message_sent",
          cost: 0.01,
        }),
      );
    });

    it("handles null data", async () => {
      mockMutation.mockResolvedValue("event_null");

      await adapter.saveEvent({
        agentId: "agent_123",
        eventType: "ping",
        timestamp: Date.now(),
        data: undefined,
        cost: 0,
      });

      expect(mockMutation).toHaveBeenCalledWith(
        mockApi.agents.saveTimelineEvent,
        expect.objectContaining({ data: null }),
      );
    });

    it("throws ConvexAdapterError on failure", async () => {
      mockMutation.mockRejectedValue(new Error("Write failed"));

      await expect(
        adapter.saveEvent({
          agentId: "agent_123",
          eventType: "test",
          timestamp: Date.now(),
          data: null,
          cost: 0,
        }),
      ).rejects.toThrow(ConvexAdapterError);
    });
  });

  describe("getEvents", () => {
    it("returns events matching filters", async () => {
      mockQuery.mockResolvedValue([
        makeEventDoc(),
        makeEventDoc({ _id: "event_2", eventType: "tool_call" }),
      ]);

      const events = await adapter.getEvents({
        agentId: "agent_123",
        limit: 10,
      });

      expect(events).toHaveLength(2);
      expect(events[0].eventType).toBe("message_sent");
      expect(events[1].eventType).toBe("tool_call");
    });

    it("passes all filter fields", async () => {
      mockQuery.mockResolvedValue([]);

      const filters: EventFilters = {
        agentId: "agent_123",
        eventType: "message_sent",
        startTime: 1700000000000,
        endTime: 1700100000000,
        limit: 5,
      };
      await adapter.getEvents(filters);

      expect(mockQuery).toHaveBeenCalledWith(
        mockApi.agents.getTimelineEvents,
        expect.objectContaining(filters),
      );
    });

    it("returns empty array when no events match", async () => {
      mockQuery.mockResolvedValue([]);

      const events = await adapter.getEvents({ agentId: "no_agent" });
      expect(events).toEqual([]);
    });

    it("throws ConvexAdapterError on failure", async () => {
      mockQuery.mockRejectedValue(new Error("Query failed"));

      await expect(adapter.getEvents({})).rejects.toThrow(ConvexAdapterError);
    });
  });

  describe("replayFromEvent", () => {
    it("replays events from an anchor point", async () => {
      const anchorEvent = makeEventDoc({
        _id: "event_anchor",
        timestamp: 1700000000000,
      });
      const laterEvents = [
        makeEventDoc({ _id: "event_1", timestamp: 1700000001000, cost: 0.01 }),
        makeEventDoc({ _id: "event_2", timestamp: 1700000002000, cost: 0.02 }),
        makeEventDoc({ _id: "event_3", timestamp: 1700000003000, cost: 0.03, data: { final: true } }),
      ];

      mockQuery
        .mockResolvedValueOnce(anchorEvent) // getTimelineEvent
        .mockResolvedValueOnce(laterEvents); // getTimelineEvents

      const result = await adapter.replayFromEvent("event_anchor");

      expect(result.events).toHaveLength(3);
      expect(result.totalCost).toBe(0.06);
      expect(result.duration).toBe(2000);
      expect(result.startState).toEqual({ content: "Hello world" });
      expect(result.endState).toEqual({ final: true });
    });

    it("throws when event not found", async () => {
      mockQuery.mockResolvedValueOnce(null);

      await expect(adapter.replayFromEvent("bad_id")).rejects.toThrow(
        "not found",
      );
    });

    it("handles single-event replay (duration = 0)", async () => {
      const singleEvent = makeEventDoc({ timestamp: 1700000000000 });

      mockQuery
        .mockResolvedValueOnce(singleEvent)
        .mockResolvedValueOnce([singleEvent]);

      const result = await adapter.replayFromEvent("event_789");

      expect(result.events).toHaveLength(1);
      expect(result.duration).toBe(0);
    });

    it("handles empty event list after anchor", async () => {
      const anchorEvent = makeEventDoc();

      mockQuery
        .mockResolvedValueOnce(anchorEvent)
        .mockResolvedValueOnce([]);

      const result = await adapter.replayFromEvent("event_789");

      expect(result.events).toHaveLength(0);
      expect(result.totalCost).toBe(0);
      expect(result.duration).toBe(0);
      expect(result.endState).toEqual(anchorEvent.data);
    });

    it("throws ConvexAdapterError on query failure", async () => {
      mockQuery.mockRejectedValue(new Error("Network failure"));

      await expect(adapter.replayFromEvent("event_789")).rejects.toThrow(
        ConvexAdapterError,
      );
    });
  });

  // --------------------------------------------------------------------------
  // Error Handling
  // --------------------------------------------------------------------------

  describe("ConvexAdapterError", () => {
    it("captures the cause", () => {
      const cause = new Error("original");
      const err = new ConvexAdapterError("wrapper", cause);

      expect(err.message).toBe("wrapper");
      expect(err.name).toBe("ConvexAdapterError");
      expect(err.cause).toBe(cause);
    });

    it("works without a cause", () => {
      const err = new ConvexAdapterError("no cause");
      expect(err.cause).toBeUndefined();
    });
  });

  // --------------------------------------------------------------------------
  // API Not Initialized
  // --------------------------------------------------------------------------

  describe("API not initialized", () => {
    let uninitAdapter: ConvexAdapter;

    beforeEach(() => {
      uninitAdapter = new ConvexAdapter({ client: mockClient as any });
      (uninitAdapter as any).api = null;
    });

    it("throws on createAgent", async () => {
      await expect(
        uninitAdapter.createAgent({
          name: "X",
          description: "",
          systemPrompt: "x",
          model: "claude-opus-4",
          temperature: 0.7,
          maxTokens: 4096,
          active: true,
          channels: [],
          skills: [],
        }),
      ).rejects.toThrow("Convex API not initialized");
    });

    it("throws on getAgent", async () => {
      await expect(uninitAdapter.getAgent("x")).rejects.toThrow(
        "Convex API not initialized",
      );
    });

    it("throws on listAgents", async () => {
      await expect(uninitAdapter.listAgents()).rejects.toThrow(
        "Convex API not initialized",
      );
    });

    it("throws on updateAgent", async () => {
      await expect(
        uninitAdapter.updateAgent("x", { name: "Y" }),
      ).rejects.toThrow("Convex API not initialized");
    });

    it("throws on deleteAgent", async () => {
      await expect(uninitAdapter.deleteAgent("x")).rejects.toThrow(
        "Convex API not initialized",
      );
    });

    it("throws on saveDream", async () => {
      await expect(
        uninitAdapter.saveDream("x", {
          timestamp: 0,
          insights: [],
          stateSnapshot: null,
          approved: false,
        }),
      ).rejects.toThrow("Convex API not initialized");
    });

    it("throws on getDreams", async () => {
      await expect(uninitAdapter.getDreams("x")).rejects.toThrow(
        "Convex API not initialized",
      );
    });

    it("throws on saveEvent", async () => {
      await expect(
        uninitAdapter.saveEvent({
          agentId: "x",
          eventType: "test",
          timestamp: 0,
          data: null,
          cost: 0,
        }),
      ).rejects.toThrow("Convex API not initialized");
    });

    it("throws on getEvents", async () => {
      await expect(uninitAdapter.getEvents({})).rejects.toThrow(
        "Convex API not initialized",
      );
    });

    it("throws on replayFromEvent", async () => {
      await expect(uninitAdapter.replayFromEvent("x")).rejects.toThrow(
        "Convex API not initialized",
      );
    });
  });
});
