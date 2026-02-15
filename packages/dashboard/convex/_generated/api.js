/**
 * Runtime stub for Convex API
 * Generated to allow Next.js builds without running Convex dev server
 *
 * IMPORTANT: This is a build-time stub only.
 * In production, this file will be replaced by actual Convex code generation.
 */

// Create stub function references that throw helpful errors if accidentally called
const createStubFunction = (name) => {
  const stub = () => {
    throw new Error(
      `Convex function '${name}' called during build. ` +
        `This is a stub for type-checking only. ` +
        `Run 'bunx convex dev' to use real Convex functions.`
    );
  };
  stub._isStub = true;
  return stub;
};

// Agent mutations
const agents_create = createStubFunction("agents.create");
const agents_update = createStubFunction("agents.update");
const agents_remove = createStubFunction("agents.remove");
const agents_updateActivity = createStubFunction("agents.updateActivity");
const agents_updateStats = createStubFunction("agents.updateStats");

// Conversation mutations
const conversations_create = createStubFunction("conversations.create");

// Cost mutations
const costs_create = createStubFunction("costs.create");
const costs_cleanup = createStubFunction("costs.cleanup");
const costs_removeForAgent = createStubFunction("costs.removeForAgent");

// Marketplace mutations
const marketplace_install = createStubFunction("marketplace.install");

// Memory mutations
const memory_store = createStubFunction("memory.store");

// Modes mutations
const modes_set = createStubFunction("modes.set");
const modes_switchMode = createStubFunction("modes.switchMode");

// Budget mutations
const budgets_recordCost = createStubFunction("budgets.recordCost");
const budgets_reset = createStubFunction("budgets.reset");

// Agent queries
const agents_list = createStubFunction("agents.list");
const agents_get = createStubFunction("agents.get");
const agents_stats = createStubFunction("agents.stats");
const agents_search = createStubFunction("agents.search");

// Cost queries
const costs_summary = createStubFunction("costs.summary");
const costs_byAgent = createStubFunction("costs.byAgent");
const costs_byModel = createStubFunction("costs.byModel");
const costs_history = createStubFunction("costs.history");

// Conversation queries
const conversations_getById = createStubFunction("conversations.getById");
const conversations_listByAgent = createStubFunction("conversations.listByAgent");
const conversations_listBySession = createStubFunction("conversations.listBySession");
const conversations_listSessions = createStubFunction("conversations.listSessions");
const conversations_getSession = createStubFunction("conversations.getSession");

// Marketplace queries
const marketplace_skills = createStubFunction("marketplace.skills");
const marketplace_agents = createStubFunction("marketplace.agents");
const marketplace_listAgents = createStubFunction("marketplace.listAgents");
const marketplace_listSkills = createStubFunction("marketplace.listSkills");
const marketplace_getAgent = createStubFunction("marketplace.getAgent");
const marketplace_getSkill = createStubFunction("marketplace.getSkill");
const marketplace_getReviews = createStubFunction("marketplace.getReviews");

// Memory queries
const memory_search = createStubFunction("memory.search");

// Modes queries
const modes_get = createStubFunction("modes.get");
const modes_getCurrentMode = createStubFunction("modes.getCurrentMode");

// Budget queries
const budgets_getByAgent = createStubFunction("budgets.getByAgent");

// Actions
const actions_run = createStubFunction("actions.run");
const actions_memory_semanticSearch = createStubFunction("actions.memory.semanticSearch");

// Export the API object structure
export const api = {
  mutations: {
    agents: {
      create: agents_create,
      update: agents_update,
      remove: agents_remove,
      updateActivity: agents_updateActivity,
      updateStats: agents_updateStats,
    },
    conversations: {
      create: conversations_create,
    },
    costs: {
      create: costs_create,
      cleanup: costs_cleanup,
      removeForAgent: costs_removeForAgent,
    },
    marketplace: {
      install: marketplace_install,
    },
    memory: {
      store: memory_store,
    },
    modes: {
      set: modes_set,
      switchMode: modes_switchMode,
    },
  },
  queries: {
    agents: {
      list: agents_list,
      get: agents_get,
      stats: agents_stats,
      search: agents_search,
    },
    costs: {
      summary: costs_summary,
      byAgent: costs_byAgent,
      byModel: costs_byModel,
      history: costs_history,
    },
    conversations: {
      getById: conversations_getById,
      listByAgent: conversations_listByAgent,
      listBySession: conversations_listBySession,
      listSessions: conversations_listSessions,
      getSession: conversations_getSession,
    },
    marketplace: {
      skills: marketplace_skills,
      agents: marketplace_agents,
      listAgents: marketplace_listAgents,
      listSkills: marketplace_listSkills,
      getAgent: marketplace_getAgent,
      getSkill: marketplace_getSkill,
      getReviews: marketplace_getReviews,
    },
    memory: {
      search: memory_search,
    },
    modes: {
      get: modes_get,
      getCurrentMode: modes_getCurrentMode,
    },
  },
  budgets: {
    getByAgent: budgets_getByAgent,
    recordCost: budgets_recordCost,
    reset: budgets_reset,
  },
  actions: {
    run: actions_run,
    memory: {
      semanticSearch: actions_memory_semanticSearch,
    },
  },
};
