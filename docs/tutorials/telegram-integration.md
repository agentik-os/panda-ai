# Telegram Bot Integration

> **12-minute tutorial: Build a Telegram bot powered by your Agentik OS agents**

Learn by creating a Telegram bot that connects to your Agentik agents, enabling conversations via Telegram with full OS mode support, skill access, and streaming responses.

---

## What You'll Build

By the end of this tutorial, you'll have:

- ✅ Telegram bot connected to Agentik OS
- ✅ Per-user agent sessions with memory
- ✅ OS mode switching via commands
- ✅ Streaming message responses
- ✅ File upload/download support
- ✅ Production-ready webhook integration

**Time:** 12 minutes
**Difficulty:** Intermediate
**Prerequisites:** Agentik OS running, Telegram account

---

## Architecture

```
Telegram User
     │
     ▼
Telegram Servers
     │
     ▼ (webhook)
Your Bot Server (Node.js/Bun)
     │
     ├─► Session Manager (user → agent mapping)
     │
     ▼
Agentik OS Runtime
     │
     ├─► Agent (per user)
     ├─► Skills
     └─► Convex (persistent memory)
```

---

## Step 1: Create Telegram Bot (2 minutes)

### Talk to BotFather

1. Open Telegram and search for **@BotFather**
2. Send `/newbot`
3. Choose a name: `Agentik Assistant`
4. Choose a username: `agentik_assistant_bot`
5. **Save the API token** (looks like `123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11`)

### Configure Bot

Send these commands to BotFather:

```
/setdescription
AI assistant powered by Agentik OS

/setabouttext
Your personal AI agent with access to multiple AI models, skills, and OS modes.

/setcommands
start - Start conversation
mode - Switch OS mode (focus/creative/research)
clear - Clear conversation history
help - Show help
```

---

## Step 2: Set Up Bot Server (3 minutes)

### Install Dependencies

```bash
mkdir agentik-telegram-bot
cd agentik-telegram-bot

bun init -y

bun add telegraf @agentik/sdk dotenv
```

### Create Bot Server

Create `bot.ts`:

```typescript
import { Telegraf } from 'telegraf';
import { Agentik } from '@agentik/sdk';
import 'dotenv/config';

// Initialize clients
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!);
const agentik = new Agentik({ apiKey: process.env.AGENTIK_API_KEY! });

// Session management: user_id → agent_id
const sessions = new Map<number, string>();

// Get or create agent for user
async function getAgentForUser(userId: number, username?: string) {
  // Check if user already has an agent
  if (sessions.has(userId)) {
    return sessions.get(userId)!;
  }

  // Create new agent for user
  const agent = await agentik.agents.create({
    name: `Telegram User: ${username || userId}`,
    model: 'claude-sonnet-4-5',
    mode: 'focus',
    metadata: {
      platform: 'telegram',
      userId: userId.toString(),
      username,
    },
  });

  // Store session
  sessions.set(userId, agent.id);

  return agent.id;
}

// Commands
bot.command('start', async (ctx) => {
  const agentId = await getAgentForUser(ctx.from.id, ctx.from.username);

  await ctx.reply(
    `👋 Hello ${ctx.from.first_name}!\n\n` +
      `I'm your Agentik assistant powered by Claude AI.\n\n` +
      `Send me any message to start chatting.\n\n` +
      `Commands:\n` +
      `/mode - Switch OS mode\n` +
      `/clear - Clear conversation\n` +
      `/help - Get help`
  );
});

bot.command('mode', async (ctx) => {
  await ctx.reply(
    'Choose OS mode:',
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🎯 Focus', callback_data: 'mode:focus' },
            { text: '🎨 Creative', callback_data: 'mode:creative' },
          ],
          [
            { text: '🔍 Research', callback_data: 'mode:research' },
          ],
        ],
      },
    }
  );
});

bot.command('clear', async (ctx) => {
  const agentId = sessions.get(ctx.from.id);

  if (agentId) {
    // Clear agent memory
    await agentik.agents.sessions.clear(agentId);
    await ctx.reply('✅ Conversation cleared!');
  } else {
    await ctx.reply('No active conversation to clear.');
  }
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    `**Agentik Telegram Bot**\n\n` +
      `I'm an AI assistant with access to:\n` +
      `• Multiple AI models (Claude, GPT, Gemini)\n` +
      `• Skills and tools\n` +
      `• Persistent memory\n` +
      `• Different OS modes\n\n` +
      `**Commands:**\n` +
      `/start - Start conversation\n` +
      `/mode - Switch OS mode\n` +
      `/clear - Clear history\n` +
      `/help - Show this message\n\n` +
      `Just send me a message to chat!`,
    { parse_mode: 'Markdown' }
  );
});

// Mode switching
bot.action(/mode:(.+)/, async (ctx) => {
  const mode = ctx.match[1] as 'focus' | 'creative' | 'research';
  const agentId = await getAgentForUser(ctx.from.id, ctx.from.username);

  // Update agent mode
  await agentik.agents.update(agentId, { mode });

  const modeEmoji = {
    focus: '🎯',
    creative: '🎨',
    research: '🔍',
  };

  await ctx.answerCbQuery();
  await ctx.editMessageText(
    `${modeEmoji[mode]} Switched to **${mode}** mode!`,
    { parse_mode: 'Markdown' }
  );
});

// Message handler with streaming
bot.on('text', async (ctx) => {
  const agentId = await getAgentForUser(ctx.from.id, ctx.from.username);

  // Show typing indicator
  await ctx.sendChatAction('typing');

  try {
    // Send message to agent with streaming
    const stream = await agentik.agents.messages.create(agentId, {
      content: ctx.message.text,
      stream: true,
    });

    let fullResponse = '';
    let lastMessageId: number | undefined;
    let lastUpdateTime = Date.now();

    // Stream response
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_start') {
        // Send initial message
        const msg = await ctx.reply('...');
        lastMessageId = msg.message_id;
      } else if (chunk.type === 'content_block_delta') {
        fullResponse += chunk.delta.text;

        // Update message every 500ms to avoid rate limits
        const now = Date.now();
        if (now - lastUpdateTime > 500) {
          await ctx.telegram.editMessageText(
            ctx.chat.id,
            lastMessageId,
            undefined,
            fullResponse.slice(0, 4096) // Telegram limit
          );
          lastUpdateTime = now;
        }
      } else if (chunk.type === 'message_stop') {
        // Final update
        await ctx.telegram.editMessageText(
          ctx.chat.id,
          lastMessageId,
          undefined,
          fullResponse.slice(0, 4096)
        );
      }
    }
  } catch (error) {
    console.error('Error processing message:', error);
    await ctx.reply('Sorry, I encountered an error. Please try again.');
  }
});

// File handling
bot.on('document', async (ctx) => {
  const agentId = await getAgentForUser(ctx.from.id, ctx.from.username);

  await ctx.sendChatAction('typing');

  try {
    // Download file
    const file = await ctx.telegram.getFile(ctx.message.document.file_id);
    const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

    const response = await fetch(fileUrl);
    const fileContent = await response.text();

    // Send to agent
    const result = await agentik.agents.messages.create(agentId, {
      content: `User uploaded a file: ${ctx.message.document.file_name}\n\nContent:\n${fileContent}`,
    });

    await ctx.reply(result.content);
  } catch (error) {
    console.error('Error processing file:', error);
    await ctx.reply('Sorry, I could not process this file.');
  }
});

// Error handling
bot.catch((err, ctx) => {
  console.error('Bot error:', err);
  ctx.reply('An error occurred. Please try again later.');
});

// Start bot
bot.launch();

console.log('🤖 Telegram bot started!');

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
```

### Environment Variables

Create `.env`:

```bash
TELEGRAM_BOT_TOKEN=123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11
AGENTIK_API_KEY=your_agentik_api_key
```

### Run Bot

```bash
bun run bot.ts
```

✅ **Your bot is now running!**

---

## Step 3: Test the Bot (2 minutes)

### Test Basic Conversation

1. Open Telegram and search for your bot
2. Send `/start`
3. Send a message: "Hello! What can you do?"
4. Watch the streaming response appear

### Test Mode Switching

1. Send `/mode`
2. Click **Creative**
3. Send: "Write a haiku about AI"
4. Notice different creative behavior

### Test File Upload

1. Upload a text file or code file
2. Bot will process and analyze it
3. Ask follow-up questions about the file

---

## Step 4: Production Webhook Setup (3 minutes)

**Polling (development)** works but isn't production-ready.
**Webhooks (production)** are more efficient and reliable.

### Install Express

```bash
bun add express
```

### Webhook Server

Update `bot.ts` to use webhooks:

```typescript
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3000;
const WEBHOOK_URL = process.env.WEBHOOK_URL; // e.g., https://yourdomain.com/webhook

// Webhook endpoint
app.use(await bot.createWebhook({ domain: WEBHOOK_URL }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Webhook server running on port ${PORT}`);
  console.log(`📡 Webhook URL: ${WEBHOOK_URL}`);
});

// Remove bot.launch() - webhook handles updates
```

### Deploy Webhook

```bash
# Set webhook URL
curl -X POST "https://api.telegram.org/bot<YOUR_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://yourdomain.com/webhook"}'

# Verify webhook
curl "https://api.telegram.org/bot<YOUR_TOKEN>/getWebhookInfo"
```

**Deploy options:**
- **Railway**: `railway up`
- **Vercel**: Deploy as serverless function
- **AWS Lambda**: Use Lambda + API Gateway
- **Kubernetes**: Deploy as pod (see previous tutorial)

---

## Advanced Features

### 1. Voice Message Support

```typescript
bot.on('voice', async (ctx) => {
  const agentId = await getAgentForUser(ctx.from.id, ctx.from.username);

  await ctx.sendChatAction('typing');

  // Download voice message
  const file = await ctx.telegram.getFile(ctx.message.voice.file_id);
  const voiceUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

  // Send to agent with transcription skill
  const result = await agentik.agents.messages.create(agentId, {
    content: '[Voice message]',
    attachments: [
      {
        type: 'audio',
        url: voiceUrl,
      },
    ],
    skills: ['voice-transcription'],
  });

  await ctx.reply(result.content);
});
```

### 2. Image Analysis

```typescript
bot.on('photo', async (ctx) => {
  const agentId = await getAgentForUser(ctx.from.id, ctx.from.username);

  await ctx.sendChatAction('typing');

  // Get highest quality photo
  const photo = ctx.message.photo[ctx.message.photo.length - 1];
  const file = await ctx.telegram.getFile(photo.file_id);
  const photoUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;

  // Send to agent with vision
  const result = await agentik.agents.messages.create(agentId, {
    content: ctx.message.caption || 'What do you see in this image?',
    attachments: [
      {
        type: 'image',
        url: photoUrl,
      },
    ],
  });

  await ctx.reply(result.content);
});
```

### 3. Inline Keyboard Actions

```typescript
// Show skill menu
bot.command('skills', async (ctx) => {
  const agentId = await getAgentForUser(ctx.from.id, ctx.from.username);
  const agent = await agentik.agents.get(agentId);

  const skillButtons = agent.skills.map((skill) => [
    { text: `${skill.enabled ? '✅' : '⬜'} ${skill.name}`, callback_data: `skill:${skill.id}` },
  ]);

  await ctx.reply('Manage skills:', {
    reply_markup: { inline_keyboard: skillButtons },
  });
});

// Toggle skill
bot.action(/skill:(.+)/, async (ctx) => {
  const skillId = ctx.match[1];
  const agentId = sessions.get(ctx.from.id)!;

  // Toggle skill
  await agentik.agents.skills.toggle(agentId, skillId);

  await ctx.answerCbQuery('Skill toggled!');
  // Refresh menu
  ctx.editMessageReplyMarkup({ inline_keyboard: [] });
});
```

### 4. Group Chat Support

```typescript
bot.on('text', async (ctx) => {
  // In groups, only respond when mentioned
  if (ctx.chat.type === 'group' || ctx.chat.type === 'supergroup') {
    const botUsername = ctx.botInfo.username;
    const text = ctx.message.text;

    // Check if bot was mentioned
    if (!text.includes(`@${botUsername}`) && !ctx.message.reply_to_message?.from?.is_bot) {
      return; // Ignore message
    }

    // Remove bot mention
    const cleanText = text.replace(`@${botUsername}`, '').trim();
    ctx.message.text = cleanText;
  }

  // Continue with normal message handler
  // ...
});
```

### 5. Admin Commands

```typescript
const ADMIN_IDS = [123456789]; // Your Telegram user ID

// Admin-only command
bot.command('stats', async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('❌ Admin only');
  }

  const stats = {
    activeSessions: sessions.size,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
  };

  await ctx.reply(
    `📊 **Bot Statistics**\n\n` +
      `Active sessions: ${stats.activeSessions}\n` +
      `Uptime: ${Math.floor(stats.uptime / 60)} minutes\n` +
      `Memory: ${Math.floor(stats.memory.rss / 1024 / 1024)} MB`,
    { parse_mode: 'Markdown' }
  );
});

// Broadcast message
bot.command('broadcast', async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('❌ Admin only');
  }

  const message = ctx.message.text.replace('/broadcast', '').trim();

  let sent = 0;
  for (const [userId] of sessions) {
    try {
      await ctx.telegram.sendMessage(userId, message);
      sent++;
    } catch (error) {
      console.error(`Failed to send to ${userId}:`, error);
    }
  }

  await ctx.reply(`✅ Broadcast sent to ${sent} users`);
});
```

---

## Multi-Tenant Support

For SaaS applications where each customer has their own agents:

```typescript
import { Agentik } from '@agentik/sdk';

// Create Agentik client per tenant
const tenantClients = new Map<string, Agentik>();

function getAgentikForTenant(tenantId: string) {
  if (!tenantClients.has(tenantId)) {
    tenantClients.set(
      tenantId,
      new Agentik({
        apiKey: process.env[`AGENTIK_API_KEY_${tenantId}`]!,
      })
    );
  }
  return tenantClients.get(tenantId)!;
}

// User metadata includes tenant
async function getAgentForUser(userId: number, tenantId: string) {
  const agentik = getAgentikForTenant(tenantId);

  // Create agent scoped to tenant
  const agent = await agentik.agents.create({
    name: `Telegram User ${userId}`,
    metadata: {
      platform: 'telegram',
      userId: userId.toString(),
      tenantId,
    },
  });

  return agent.id;
}
```

---

## Monitoring and Analytics

### Track Usage

```typescript
import { ConvexClient } from 'convex/browser';

const convex = new ConvexClient(process.env.CONVEX_URL!);

// Log message
async function logMessage(userId: number, message: string, response: string) {
  await convex.mutation('telegram:logMessage', {
    userId,
    message,
    response,
    timestamp: Date.now(),
  });
}

// Get analytics
bot.command('analytics', async (ctx) => {
  if (!ADMIN_IDS.includes(ctx.from.id)) {
    return ctx.reply('❌ Admin only');
  }

  const stats = await convex.query('telegram:getStats');

  await ctx.reply(
    `📈 **Analytics**\n\n` +
      `Total users: ${stats.totalUsers}\n` +
      `Messages today: ${stats.messagesToday}\n` +
      `Avg response time: ${stats.avgResponseTime}ms`,
    { parse_mode: 'Markdown' }
  );
});
```

---

## Troubleshooting

### Bot Not Responding

```bash
# Check if bot is running
curl https://api.telegram.org/bot<TOKEN>/getMe

# Check webhook status
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Check logs
tail -f bot.log
```

### Webhook Issues

```bash
# Delete webhook and use polling for debugging
curl -X POST "https://api.telegram.org/bot<TOKEN>/deleteWebhook"

# Then run bot with polling
bun run bot.ts
```

### Rate Limits

Telegram limits:
- **Messages:** 30/second per chat
- **Global:** 30/second across all chats
- **Edits:** Avoid editing messages more than once per second

**Solution:** Batch updates and add delays:

```typescript
let lastEdit = 0;
const MIN_EDIT_INTERVAL = 1000; // 1 second

async function editMessage(chatId, messageId, text) {
  const now = Date.now();
  if (now - lastEdit < MIN_EDIT_INTERVAL) {
    await new Promise((r) => setTimeout(r, MIN_EDIT_INTERVAL - (now - lastEdit)));
  }

  await ctx.telegram.editMessageText(chatId, messageId, undefined, text);
  lastEdit = Date.now();
}
```

---

## Summary

You've learned:

- ✅ How to create a Telegram bot with BotFather
- ✅ How to connect the bot to Agentik OS
- ✅ How to manage per-user agent sessions
- ✅ How to implement streaming responses
- ✅ How to set up production webhooks
- ✅ How to handle files, voice, and images
- ✅ How to add admin commands and analytics
- ✅ How to troubleshoot common issues

**Resources:**

- 📚 [Telegram Bot API](https://core.telegram.org/bots/api)
- 🛠️ [Telegraf Documentation](https://telegraf.js.org/)
- 📖 [Agentik SDK Reference](../api/sdk.md)
- 💬 Discord: [discord.gg/agentik-os](https://discord.gg/agentik-os)

---

*Last updated: February 14, 2026*
*Agentik OS Tutorial Team*
