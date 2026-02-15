# CLI Channel Adapter - Implementation Plan

**Step:** step-027
**Estimated Hours:** 14h
**Depends On:** step-021 (Pipeline Orchestrator)
**Status:** Planning

---

## Overview

The CLI channel adapter provides an interactive terminal interface for chatting with agents. Users run `panda chat` and can have real-time conversations with their configured agents.

---

## Technical Design

### Libraries

```bash
pnpm add inquirer chalk ora
```

- **inquirer** - Interactive CLI prompts
- **chalk** - Terminal colors and styling
- **ora** - Loading spinners

### Architecture

```
User Terminal
     ↓
CLI Channel (inquirer input loop)
     ↓
RawMessage → Pipeline
     ↓
Agent Response
     ↓
CLI Channel (chalk formatted output)
     ↓
User Terminal
```

### Implementation File

`packages/runtime/src/channels/cli.ts`

---

## Interface Implementation

```typescript
import type { ChannelAdapter, ChannelConfig, RawMessage, ResponseContent } from "@agentik-os/shared";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";

export class CLIChannel implements ChannelAdapter {
  readonly name = "cli" as const;
  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private spinner = ora();

  async connect(config: ChannelConfig): Promise<void> {
    // Validate config
    // Set up terminal state
    // Display welcome banner
    this.connected = true;
  }

  async disconnect(): Promise<void> {
    // Clean up terminal
    // Exit gracefully
    this.connected = false;
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(to: string, content: ResponseContent): Promise<void> {
    // Format with chalk
    // Display in terminal
    // Handle richContent (buttons → text list, code blocks → syntax highlighting)
  }

  async sendFile(to: string, file: Buffer, caption?: string): Promise<void> {
    // Save file to /tmp or Downloads
    // Display file path
    // Open file if supported
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Private method - the main chat loop
  async startChatLoop(userId: string, agentId: string): Promise<void> {
    while (this.connected) {
      const { message } = await inquirer.prompt([
        {
          type: "input",
          name: "message",
          message: chalk.blue("You:"),
        },
      ]);

      if (message === "/exit") {
        await this.disconnect();
        break;
      }

      // Send to pipeline
      const rawMessage: RawMessage = {
        channel: "cli",
        channelMessageId: `cli_${Date.now()}`,
        userId,
        content: message,
        timestamp: new Date(),
      };

      this.spinner.start(chalk.yellow("Agent is thinking..."));
      await this.messageHandler?.(rawMessage);
      this.spinner.stop();
    }
  }
}
```

---

## Features

### Core
- [x] Interactive prompt loop
- [x] Send message to pipeline
- [x] Receive and display responses
- [x] Graceful exit (/exit command)

### Enhanced
- [ ] Command history (up/down arrows)
- [ ] Multi-line input (shift+enter)
- [ ] Agent switching (/agent <name>)
- [ ] Context clearing (/clear)
- [ ] File attachment (/attach <path>)
- [ ] Export conversation (/export chat.txt)

### Display Features
- [ ] Markdown rendering (bold, italic, code)
- [ ] Syntax highlighting for code blocks
- [ ] Table rendering
- [ ] Spinner while agent thinks
- [ ] Typing animation for responses

---

## Configuration

```json
{
  "type": "cli",
  "options": {
    "userId": "cli_user",
    "defaultAgentId": "default",
    "theme": "dark",
    "enableHistory": true,
    "maxHistorySize": 100
  },
  "enabled": true
}
```

---

## Testing

### Unit Tests (`cli.test.ts`)

```typescript
describe("CLIChannel", () => {
  it("should implement ChannelAdapter interface", () => {});
  it("should connect and set up terminal", () => {});
  it("should handle user input and send to pipeline", () => {});
  it("should format and display agent responses", () => {});
  it("should handle /exit command", () => {});
  it("should handle file attachments", () => {});
});
```

### Manual Testing

```bash
# Run the CLI
panda chat

# Test commands
You: Hello
Agent: Hi! How can I help you?

You: /agent nova
Switched to agent: nova

You: /exit
Goodbye!
```

---

## Error Handling

| Error | Handling |
|-------|----------|
| Pipeline timeout | Show "Agent is taking too long..." |
| Message handler not set | Throw error on connect |
| Invalid input | Show validation message, retry |
| File not found | Show error, continue |
| Keyboard interrupt (Ctrl+C) | Graceful shutdown |

---

## Dependencies

**Blocks:**
- Step-028 (API Channel) - can be done in parallel
- Phase 1 work - blocked until CLI channel works

**Blocked By:**
- Step-021 (Pipeline Orchestrator) - MUST complete first

---

## Implementation Checklist

- [ ] Create `packages/runtime/src/channels/cli.ts`
- [ ] Implement ChannelAdapter interface
- [ ] Add inquirer input loop
- [ ] Format responses with chalk
- [ ] Handle /exit and other commands
- [ ] Create `cli.test.ts`
- [ ] Write unit tests
- [ ] Manual testing
- [ ] Update channels/index.ts export
- [ ] Document in README

---

**Estimated Time:** 14 hours
**Ready to implement:** When step-021 completes ✅
