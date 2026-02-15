import type { ModelResponse, RawMessage } from "@agentik-os/shared";
import { normalizeMessage } from "./normalize";
import { routeMessage, type RouteConfig } from "./route";
import { MemoryLoader } from "./load-memory";
import { ShortTermMemory } from "../memory/short-term";
import { SessionMemory } from "../memory/session";
import { selectModelForMessage, type ModelSelectConfig } from "./model-select";
import { resolveTools } from "./tool-resolution";
import { executeModel, type ExecuteConfig } from "./execute";
import { saveMemory } from "./save-memory";
import { createCostEvent, trackCost } from "./track-cost";
import { sendResponse, type ResponseMessage } from "./send-response";

export interface PipelineConfig {
  route: RouteConfig;
  modelSelect: ModelSelectConfig;
  execute: ExecuteConfig;
}

export interface PipelineResult {
  agentId: string;
  modelUsed: string;
  response: string;
  cost: number;
  responseMessage: ResponseMessage;
}

export class MessagePipeline {
  private memoryLoader: MemoryLoader;

  constructor(private config: PipelineConfig) {
    const shortTerm = new ShortTermMemory();
    const session = new SessionMemory();
    this.memoryLoader = new MemoryLoader(shortTerm, session);
  }

  async process(raw: RawMessage): Promise<PipelineResult> {
    // Stage 1: Normalize
    const message = normalizeMessage(raw);

    // Stage 2: Route
    const agentId = routeMessage(message, this.config.route);

    // Stage 3: Load Memory
    const context = await this.memoryLoader.loadContext(message, agentId);

    // Stage 4: Model Select
    const { selection } = await selectModelForMessage(
      message,
      this.config.modelSelect
    );

    // Stage 5: Tool Resolution
    resolveTools(message, agentId);

    // Stage 6: Execute
    const modelResponse: ModelResponse = await executeModel(
      message,
      context,
      selection,
      this.config.execute
    );

    // Stage 7: Save Memory
    await saveMemory(
      this.memoryLoader,
      agentId,
      message.userId,
      message,
      modelResponse.content
    );

    // Stage 8: Track Cost
    const costEvent = createCostEvent(
      agentId,
      message.userId,
      selection,
      modelResponse
    );
    await trackCost(costEvent);

    // Stage 9: Send Response
    const responseMessage = await sendResponse(message, modelResponse.content);

    return {
      agentId,
      modelUsed: modelResponse.model,
      response: modelResponse.content,
      cost: costEvent.cost,
      responseMessage,
    };
  }
}
