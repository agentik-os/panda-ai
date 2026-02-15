/**
 * Example: Create an Agent
 *
 * Description: Create and configure a new AI agent with custom settings
 * Difficulty: Beginner
 * Prerequisites: AGENTIK_API_KEY environment variable
 */

import { Agentik } from '@agentik/sdk';

// Initialize SDK
const agentik = new Agentik({
  apiKey: process.env.AGENTIK_API_KEY!,
});

async function main() {
  try {
    console.log('Creating a new agent...\n');

    // Create agent with basic configuration
    const agent = await agentik.agents.create({
      name: 'My First Agent',
      model: 'claude-sonnet-4-5', // or 'gpt-4o', 'gemini-2.0-flash-exp'
      temperature: 0.7,
      maxTokens: 4096,
      mode: 'focus', // or 'creative', 'research'
      systemPrompt: `You are a helpful AI assistant.

Be concise, accurate, and friendly in your responses.`,
    });

    console.log('✅ Agent created successfully!');
    console.log('\nAgent Details:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`ID: ${agent.id}`);
    console.log(`Name: ${agent.name}`);
    console.log(`Model: ${agent.model}`);
    console.log(`Mode: ${agent.mode}`);
    console.log(`Created: ${new Date(agent.createdAt).toLocaleString()}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Update agent configuration
    console.log('Updating agent configuration...');

    const updated = await agentik.agents.update(agent.id, {
      temperature: 0.5, // Make more deterministic
      maxTokens: 8192, // Increase max output
    });

    console.log('✅ Agent updated!');
    console.log(`New temperature: ${updated.temperature}`);
    console.log(`New max tokens: ${updated.maxTokens}\n`);

    // Get agent details
    const retrieved = await agentik.agents.get(agent.id);

    console.log('✅ Agent retrieved successfully!');
    console.log(`Retrieved: ${retrieved.name} (${retrieved.id})\n`);

    // List all agents
    const agents = await agentik.agents.list({
      limit: 10,
    });

    console.log(`📋 Total agents: ${agents.data.length}`);

    // Clean up (optional - delete the agent)
    // Uncomment to delete:
    // await agentik.agents.delete(agent.id);
    // console.log('🗑️ Agent deleted');

    console.log('\n✅ Example completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();

/*
Example Output:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Creating a new agent...

✅ Agent created successfully!

Agent Details:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ID: agent_1234567890_my-first-agent
Name: My First Agent
Model: claude-sonnet-4-5
Mode: focus
Created: 2/14/2026, 12:00:00 PM
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Updating agent configuration...
✅ Agent updated!
New temperature: 0.5
New max tokens: 8192

✅ Agent retrieved successfully!
Retrieved: My First Agent (agent_1234567890_my-first-agent)

📋 Total agents: 5

✅ Example completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
