/**
 * Example: Send Messages
 *
 * Description: Send messages to agents and receive responses
 * Difficulty: Beginner
 * Prerequisites: AGENTIK_API_KEY, existing agent ID
 */

import { Agentik } from '@agentik/sdk';

const agentik = new Agentik({
  apiKey: process.env.AGENTIK_API_KEY!,
});

async function main() {
  try {
    // Create an agent
    const agent = await agentik.agents.create({
      name: 'Chat Agent',
      model: 'claude-sonnet-4-5',
      systemPrompt: 'You are a helpful assistant. Keep responses concise.',
    });

    console.log(`✅ Agent created: ${agent.id}\n`);

    // Send a simple message
    console.log('Sending message: "Hello! What can you do?"\n');

    const response1 = await agentik.agents.messages.create(agent.id, {
      content: 'Hello! What can you do?',
    });

    console.log('Agent response:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(response1.content);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Send a follow-up message (maintains context)
    console.log('Sending follow-up: "Can you write code?"\n');

    const response2 = await agentik.agents.messages.create(agent.id, {
      content: 'Can you write code?',
    });

    console.log('Agent response:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(response2.content);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get message history
    const messages = await agentik.agents.messages.list(agent.id, {
      limit: 10,
    });

    console.log(`📋 Conversation history (${messages.data.length} messages):`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    messages.data.forEach((msg, index) => {
      const role = msg.role === 'user' ? '👤 You' : '🤖 Agent';
      const preview =
        msg.content.length > 50
          ? msg.content.substring(0, 50) + '...'
          : msg.content;

      console.log(`${index + 1}. ${role}: ${preview}`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Send message with metadata
    const response3 = await agentik.agents.messages.create(agent.id, {
      content: 'Write a haiku about AI',
      metadata: {
        source: 'example-script',
        category: 'creative-writing',
      },
    });

    console.log('Creative response:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(response3.content);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get specific message
    const message = await agentik.agents.messages.get(agent.id, response3.id);

    console.log('Message details:');
    console.log(`ID: ${message.id}`);
    console.log(`Tokens used: ${message.usage.totalTokens}`);
    console.log(`Cost: $${message.usage.cost.toFixed(4)}`);
    console.log(`Timestamp: ${new Date(message.createdAt).toLocaleString()}\n`);

    // Clean up
    await agentik.agents.delete(agent.id);
    console.log('✅ Example completed and cleaned up!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

/*
Example Output:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Agent created: agent_1234567890_chat-agent

Sending message: "Hello! What can you do?"

Agent response:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
I'm an AI assistant powered by Claude. I can help with:

- Answering questions
- Writing and analyzing code
- Creative writing
- Research and analysis
- Problem-solving
- And much more!

What would you like help with?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Sending follow-up: "Can you write code?"

Agent response:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Yes! I can write code in many programming languages including:
- Python, JavaScript, TypeScript
- Java, C++, Rust, Go
- HTML/CSS, SQL
- And many others

I can help with algorithms, debugging, code review, and more.
What would you like me to code?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📋 Conversation history (4 messages):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. 👤 You: Hello! What can you do?
2. 🤖 Agent: I'm an AI assistant powered by Claude. I can hel...
3. 👤 You: Can you write code?
4. 🤖 Agent: Yes! I can write code in many programming langua...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Creative response:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Silicon dreams awake,
Algorithms learn and grow—
Future thinking now.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Message details:
ID: msg_abc123def456
Tokens used: 847
Cost: $0.0042
Timestamp: 2/14/2026, 12:05:30 PM

✅ Example completed and cleaned up!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
