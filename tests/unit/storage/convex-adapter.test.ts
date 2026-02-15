import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  ConvexAdapter,
  ConvexAdapterError,
  type ConvexAdapterConfig,
  type Dream,
  type TimelineEvent,
  type ConversationMessage,
  type CostEntry,
} from "../../../packages/runtime/src/storage/convex-adapter";

// Mock ConvexHttpClient
vi.mock("convex/browser", () => ({
  ConvexHttpClient: vi.fn().mockImplementation(() => ({
    query: vi.fn(),
    mutation: vi.fn(),
  })),
}));

describe("ConvexAdapter", () => {
  let adapter: ConvexAdapter;
  let mockClient: { query: ReturnType<typeof vi.fn>; mutation: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    const { ConvexHttpClient } = require("convex/browser");
    mockClient = {
      query: vi.fn(),
      mutation: vi.fn(),
    };
    ConvexHttpClient.mockImplementation(() => mockClient);
    adapter = new ConvexAdapter({ url: "https://test.convex.cloud" });

    // Inject mock API
    (adapter as any).api = {
      agents: {
        createAgent: "agents:createAgent",
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
      mutations: {
        conversations: {
          create: "mutations/conversations:create",
          remove: "mutations/conversations:remove",
          removeSession: "mutations/conversations:removeSession",
        },
        memory: {
          storeEmbedding: "mutations/memory:storeEmbedding",
        },
        costs: {
          create: "mutations/costs:create",
        },
      },
      queries: {
        conversations: {
          getById: "queries/conversations:getById",
          listByAgent: "queries/conversations:listByAgent",
          listBySession: "queries/conversations:listBySession",
        },
        memory: {
          search: "queries/memory:search",
          stats: "queries/memory:stats",
          recentConversations: "queries/memory:recentConversations",
        },
        costs: {
          summary: "queries/costs:summary",
          byAgent: "queries/costs:byAgent",
          byModel: "queries/costs:byModel",
          history: "queries/costs:history",
        },
      },
    };
  });

  // --------------------------------------------------------------------------
  // Agent CRUD
  // --------------------------------------------------------------------------

  describe("Agent CRUD", () => {
    it("should create an agent", async () => {
      mockClient.mutation.mockResolvedValue("agent_123");

      const id = await adapter.createAgent({
        name: "Test Agent",
        description: "A test agent",
        systemPrompt: "You are helpful",
        model: "claude-opus-4",
        temperature: 0.7,
        maxTokens: 4096,
        active: true,
        channels: ["cli"],
        skills: ["web-search"],
      });

      expect(id).toBe("agent_123");
      expect(mockClient.mutation).toHaveBeenCalledWith(
        "agents:createAgent",
        expect.objectContaining({
          name: "Test Agent",
          provider: "anthropic",
        }),
      );
    });

    it("should detect provider from model name", async () => {
      mockClient.mutation.mockResolvedValue("agent_123");

      await adapter.createAgent({
        name: "GPT Agent",
        description: "",
        systemPrompt: "You are helpful",
        model: "gpt-4o",
        temperature: 0.7,
        maxTokens: 4096,
        active: true,
        channels: [],
        skills: [],
      });

      expect(mockClient.mutation).toHaveBeenCalledWith(
        "agents:createAgent",
        expect.objectContaining({ provider: "openai" }),
      );
    });

    it("should get an agent by id", async () => {
      mockClient.query.mockResolvedValue({
        _id: "agent_123",
        name: "Test",
        description: "desc",
        systemPrompt: "prompt",
        model: "claude-opus-4",
        temperature: 0.7,
        maxTokens: 4096,
        status: "active",
        channels: [],
        skills: [],
        createdAt: 1000,
        updatedAt: 2000,
      });

      const agent = await adapter.getAgent("agent_123");
      expect(agent).not.toBeNull();
      expect(agent!.name).toBe("Test");
      expect(agent!.active).toBe(true);
    });

    it("should return null for missing agent", async () => {
      mockClient.query.mockResolvedValue(null);
      const agent = await adapter.getAgent("nonexistent");
      expect(agent).toBeNull();
    });

    it("should list agents with filters", async () => {
      mockClient.query.mockResolvedValue([
        {
          _id: "a1",
          name: "Agent 1",
          description: "",
          systemPrompt: "p",
          model: "claude-opus-4",
          temperature: 0.7,
          maxTokens: 4096,
          status: "active",
          channels: [],
          skills: [],
          createdAt: 1000,
          updatedAt: 2000,
        },
      ]);

      const agents = await adapter.listAgents({ status: "active", limit: 10 });
      expect(agents).toHaveLength(1);
      expect(agents[0].name).toBe("Agent 1");
    });

    it("should update an agent", async () => {
      await adapter.updateAgent("agent_123", { name: "Updated" });
      expect(mockClient.mutation).toHaveBeenCalledWith(
        "agents:updateAgent",
        expect.objectContaining({ id: "agent_123", name: "Updated" }),
      );
    });

    it("should delete an agent", async () => {
      await adapter.deleteAgent("agent_123");
      expect(mockClient.mutation).toHaveBeenCalledWith("agents:deleteAgent", { id: "agent_123" });
    });
  });

  // --------------------------------------------------------------------------
  // Conversations
  // --------------------------------------------------------------------------

  describe("Conversations", () => {
    it("should create a conversation message", async () => {
      mockClient.mutation.mockResolvedValue("conv_123");

      const id = await adapter.createConversation({
        agentId: "agent_1",
        channel: "cli",
        role: "user",
        content: "Hello",
        sessionId: "session_1",
      });

      expect(id).toBe("conv_123");
      expect(mockClient.mutation).toHaveBeenCalledWith(
        "mutations/conversations:create",
        expect.objectContaining({
          agentId: "agent_1",
          channel: "cli",
          content: "Hello",
        }),
      );
    });

    it("should get a conversation by id", async () => {
      mockClient.query.mockResolvedValue({
        _id: "conv_123",
        agentId: "agent_1",
        channel: "cli",
        role: "user",
        content: "Hello",
        timestamp: 1000,
      });

      const conv = await adapter.getConversation("conv_123");
      expect(conv).not.toBeNull();
      expect(conv!.content).toBe("Hello");
    });

    it("should list conversations by agent", async () => {
      mockClient.query.mockResolvedValue([
        {
          _id: "c1",
          agentId: "a1",
          channel: "cli",
          role: "user",
          content: "Hi",
          timestamp: 1000,
        },
      ]);

      const convs = await adapter.listConversations({ agentId: "a1", limit: 10 });
      expect(convs).toHaveLength(1);
    });

    it("should list conversations by session", async () => {
      mockClient.query.mockResolvedValue([]);

      const convs = await adapter.listConversations({
        agentId: "a1",
        sessionId: "s1",
      });

      expect(mockClient.query).toHaveBeenCalledWith(
        "queries/conversations:listBySession",
        expect.objectContaining({ agentId: "a1", sessionId: "s1" }),
      );
    });

    it("should delete a conversation", async () => {
      await adapter.deleteConversation("conv_123");
      expect(mockClient.mutation).toHaveBeenCalledWith("mutations/conversations:remove", {
        id: "conv_123",
      });
    });

    it("should delete a session", async () => {
      mockClient.mutation.mockResolvedValue({ success: true, deletedCount: 5 });

      const count = await adapter.deleteSession("agent_1", "session_1");
      expect(count).toBe(5);
    });
  });

  // --------------------------------------------------------------------------
  // Memory / Search
  // --------------------------------------------------------------------------

  describe("Memory", () => {
    it("should store an embedding", async () => {
      await adapter.storeEmbedding("msg_123", [0.1, 0.2, 0.3]);
      expect(mockClient.mutation).toHaveBeenCalledWith("mutations/memory:storeEmbedding", {
        messageId: "msg_123",
        embedding: [0.1, 0.2, 0.3],
      });
    });

    it("should search memory", async () => {
      mockClient.query.mockResolvedValue([
        {
          _id: "c1",
          agentId: "a1",
          channel: "cli",
          role: "assistant",
          content: "Found result",
          timestamp: 1000,
        },
      ]);

      const results = await adapter.searchMemory("test query", [0.1, 0.2], "a1", 5);
      expect(results).toHaveLength(1);
      expect(results[0].content).toBe("Found result");
    });

    it("should get memory stats", async () => {
      mockClient.query.mockResolvedValue({
        total: 100,
        withEmbeddings: 80,
        byRole: { user: 50, assistant: 50 },
        indexingProgress: 80,
      });

      const stats = await adapter.getMemoryStats("agent_1");
      expect(stats.total).toBe(100);
      expect(stats.indexingProgress).toBe(80);
    });
  });

  // --------------------------------------------------------------------------
  // Cost Tracking
  // --------------------------------------------------------------------------

  describe("Cost Tracking", () => {
    it("should track a cost entry", async () => {
      mockClient.mutation.mockResolvedValue("cost_123");

      const id = await adapter.trackCost({
        agentId: "agent_1",
        model: "claude-opus-4",
        provider: "anthropic",
        inputTokens: 100,
        outputTokens: 200,
        totalTokens: 300,
        inputCost: 0.01,
        outputCost: 0.02,
        totalCost: 0.03,
        channel: "cli",
      });

      expect(id).toBe("cost_123");
    });

    it("should get cost summary", async () => {
      mockClient.query.mockResolvedValue({
        today: 1.5,
        month: 45.0,
        total: 120.0,
        modelBreakdown: [{ model: "claude-opus-4", cost: 30.0 }],
      });

      const summary = await adapter.getCostSummary();
      expect(summary.today).toBe(1.5);
      expect(summary.modelBreakdown).toHaveLength(1);
    });

    it("should get costs by agent", async () => {
      mockClient.query.mockResolvedValue([
        { agentId: "a1", totalCost: 10, totalTokens: 5000, requestCount: 50 },
      ]);

      const costs = await adapter.getCostsByAgent({ agentId: "a1" });
      expect(costs).toHaveLength(1);
      expect(costs[0].totalCost).toBe(10);
    });

    it("should get costs by model", async () => {
      mockClient.query.mockResolvedValue([
        {
          model: "claude-opus-4",
          provider: "anthropic",
          totalCost: 30,
          totalTokens: 15000,
          requestCount: 100,
          avgCostPerRequest: 0.3,
        },
      ]);

      const costs = await adapter.getCostsByModel();
      expect(costs).toHaveLength(1);
      expect(costs[0].model).toBe("claude-opus-4");
    });

    it("should get cost history", async () => {
      mockClient.query.mockResolvedValue([
        { timestamp: 1000, totalCost: 5, totalTokens: 2500, requestCount: 25 },
      ]);

      const history = await adapter.getCostHistory(undefined, "day");
      expect(history).toHaveLength(1);
    });
  });

  // --------------------------------------------------------------------------
  // Dreams
  // --------------------------------------------------------------------------

  describe("Dreams", () => {
    it("should save a dream", async () => {
      mockClient.mutation.mockResolvedValue("dream_123");

      const id = await adapter.saveDream("agent_1", {
        timestamp: Date.now(),
        insights: ["Agent learned about TypeScript"],
        stateSnapshot: { memory: "state" },
        approved: false,
      });

      expect(id).toBe("dream_123");
    });

    it("should get dreams for agent", async () => {
      mockClient.query.mockResolvedValue([
        {
          _id: "d1",
          agentId: "a1",
          timestamp: 1000,
          insights: ["Insight 1"],
          stateSnapshot: null,
          approved: true,
        },
      ]);

      const dreams = await adapter.getDreams("a1", 10);
      expect(dreams).toHaveLength(1);
      expect(dreams[0].insights).toContain("Insight 1");
    });
  });

  // --------------------------------------------------------------------------
  // Timeline Events
  // --------------------------------------------------------------------------

  describe("Timeline Events", () => {
    it("should save an event", async () => {
      mockClient.mutation.mockResolvedValue("event_123");

      const id = await adapter.saveEvent({
        agentId: "agent_1",
        eventType: "message_sent",
        timestamp: Date.now(),
        data: { content: "Hello" },
        cost: 0.01,
      });

      expect(id).toBe("event_123");
    });

    it("should get events with filters", async () => {
      mockClient.query.mockResolvedValue([
        {
          _id: "e1",
          agentId: "a1",
          eventType: "message_sent",
          timestamp: 1000,
          data: {},
          cost: 0.01,
        },
      ]);

      const events = await adapter.getEvents({ agentId: "a1", limit: 10 });
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe("message_sent");
    });

    it("should replay from event", async () => {
      mockClient.query
        .mockResolvedValueOnce({
          _id: "e1",
          agentId: "a1",
          eventType: "start",
          timestamp: 1000,
          data: { state: "initial" },
          cost: 0,
        })
        .mockResolvedValueOnce([
          {
            _id: "e1",
            agentId: "a1",
            eventType: "start",
            timestamp: 1000,
            data: { state: "initial" },
            cost: 0,
          },
          {
            _id: "e2",
            agentId: "a1",
            eventType: "end",
            timestamp: 2000,
            data: { state: "final" },
            cost: 0.05,
          },
        ]);

      const result = await adapter.replayFromEvent("e1");
      expect(result.events).toHaveLength(2);
      expect(result.totalCost).toBe(0.05);
      expect(result.duration).toBe(1000);
    });

    it("should throw on replay of nonexistent event", async () => {
      mockClient.query.mockResolvedValue(null);

      await expect(adapter.replayFromEvent("nonexistent")).rejects.toThrow("not found");
    });
  });

  // --------------------------------------------------------------------------
  // Error Handling
  // --------------------------------------------------------------------------

  describe("Error Handling", () => {
    it("should throw ConvexAdapterError on mutation failure", async () => {
      mockClient.mutation.mockRejectedValue(new Error("Network error"));

      await expect(
        adapter.createAgent({
          name: "Test",
          description: "",
          systemPrompt: "p",
          model: "claude-opus-4",
          temperature: 0.7,
          maxTokens: 4096,
          active: true,
          channels: [],
          skills: [],
        }),
      ).rejects.toThrow(ConvexAdapterError);
    });

    it("should throw when API not initialized", async () => {
      (adapter as any).api = null;

      await expect(adapter.getAgent("id")).rejects.toThrow("Convex API not initialized");
    });

    it("ConvexAdapterError preserves cause", () => {
      const cause = new Error("root cause");
      const error = new ConvexAdapterError("wrapper", cause);
      expect(error.cause).toBe(cause);
      expect(error.name).toBe("ConvexAdapterError");
    });
  });
});
