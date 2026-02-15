/**
 * Example: Streaming Responses
 *
 * Description: Stream agent responses token-by-token for real-time UX
 * Difficulty: Intermediate
 * Prerequisites: AGENTIK_API_KEY
 */

import { Agentik } from '@agentik/sdk';

const agentik = new Agentik({
  apiKey: process.env.AGENTIK_API_KEY!,
});

async function main() {
  try {
    // Create agent
    const agent = await agentik.agents.create({
      name: 'Streaming Agent',
      model: 'claude-sonnet-4-5',
      systemPrompt: 'You are a helpful assistant. Provide detailed explanations.',
    });

    console.log(`✅ Agent created: ${agent.id}\n`);
    console.log('Requesting response (streaming)...\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    // Stream response
    const stream = await agentik.agents.messages.create(agent.id, {
      content: 'Explain how neural networks work in 3 paragraphs',
      stream: true, // Enable streaming
    });

    let fullResponse = '';
    let tokenCount = 0;

    // Process stream chunks
    for await (const chunk of stream) {
      if (chunk.type === 'content_block_start') {
        // First chunk - response starting
        console.log('🚀 Response starting...\n');
      } else if (chunk.type === 'content_block_delta') {
        // Text chunk - print immediately
        process.stdout.write(chunk.delta.text);
        fullResponse += chunk.delta.text;
        tokenCount++;
      } else if (chunk.type === 'message_start') {
        // Metadata about the message
        console.log(`📊 Message ID: ${chunk.message.id}`);
      } else if (chunk.type === 'message_stop') {
        // Response complete
        console.log('\n\n✅ Response complete!');
        console.log(`Tokens: ${tokenCount}`);
        console.log(`Cost: $${chunk.usage.cost.toFixed(4)}`);
      }
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Example 2: Streaming with progress callback
    console.log('Example 2: Streaming with progress callback\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    const stream2 = await agentik.agents.messages.create(agent.id, {
      content: 'Write a short story about a robot (50 words)',
      stream: true,
    });

    let wordCount = 0;

    for await (const chunk of stream2) {
      if (chunk.type === 'content_block_delta') {
        process.stdout.write(chunk.delta.text);

        // Count words
        const words = chunk.delta.text.split(/\s+/).filter((w) => w.length > 0);
        wordCount += words.length;

        // Show progress every 10 words
        if (wordCount % 10 === 0) {
          process.stdout.write(` [${wordCount} words]`);
        }
      }
    }

    console.log('\n\n✅ Story complete!');
    console.log(`Total words: ${wordCount}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Clean up
    await agentik.agents.delete(agent.id);
    console.log('✅ Example completed!');
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  }
}

main();

/*
Example Output:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Agent created: agent_1234567890_streaming-agent

Requesting response (streaming)...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Message ID: msg_abc123def456
🚀 Response starting...

Neural networks are computational models inspired by biological neural
networks in the human brain. They consist of interconnected layers of
nodes (neurons) that process information through weighted connections,
with each connection representing the strength of influence one neuron
has on another...

[Response continues streaming in real-time...]

✅ Response complete!
Tokens: 247
Cost: $0.0012

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Example 2: Streaming with progress callback

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Unit-7, a maintenance robot, gazed at Earth's sunrise—his first in
three centuries [10 words] of solitude. His circuits hummed with an
unexpected emotion: hope [10 words] for the humans who might one day
return [10 words].

✅ Story complete!
Total words: 32

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Example completed!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
