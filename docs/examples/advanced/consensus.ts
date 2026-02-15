/**
 * Example: Multi-Agent Consensus
 *
 * Description: Create a consensus system with multiple specialized agents
 * Difficulty: Advanced
 * Prerequisites: AGENTIK_API_KEY
 */

import { Agentik, ConsensusBuilder } from '@agentik/sdk';

const agentik = new Agentik({
  apiKey: process.env.AGENTIK_API_KEY!,
});

async function main() {
  try {
    console.log('🏗️  Setting up multi-agent consensus system...\n');

    // Create specialized agents
    const securityAgent = await agentik.agents.create({
      name: 'Security Reviewer',
      model: 'claude-opus-4-6',
      systemPrompt: `You are a security expert. Your ONLY job: find security issues.

Vote APPROVE or REJECT based on security alone.
Provide severity (CRITICAL/HIGH/MEDIUM/LOW) and explanation.`,
    });

    const performanceAgent = await agentik.agents.create({
      name: 'Performance Reviewer',
      model: 'claude-sonnet-4-5',
      systemPrompt: `You are a performance expert. Your ONLY job: find performance issues.

Vote APPROVE or REJECT based on performance alone.
Provide impact (HIGH/MEDIUM/LOW) and explanation.`,
    });

    const qualityAgent = await agentik.agents.create({
      name: 'Quality Reviewer',
      model: 'claude-sonnet-4-5',
      systemPrompt: `You are a code quality expert. Your ONLY job: assess maintainability.

Vote APPROVE or REJECT based on code quality alone.
Provide priority (HIGH/MEDIUM/LOW) and explanation.`,
    });

    console.log('✅ Created 3 specialized agents:\n');
    console.log(`   🔒 Security: ${securityAgent.id}`);
    console.log(`   ⚡ Performance: ${performanceAgent.id}`);
    console.log(`   📝 Quality: ${qualityAgent.id}\n`);

    // Build consensus system
    const consensus = new ConsensusBuilder()
      .addAgent(securityAgent.id, { weight: 1.5 }) // Security counts 1.5x
      .addAgent(performanceAgent.id, { weight: 1.0 })
      .addAgent(qualityAgent.id, { weight: 1.0 })
      .setVotingRule('2/3') // 2 out of 3 must approve
      .setAutoReject([
        {
          condition: (results) => results.security.severity === 'CRITICAL',
          reason: 'Critical security vulnerability detected',
        },
      ])
      .setTimeout(180000) // 3 minutes
      .build();

    console.log('✅ Consensus system built\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test Case 1: Vulnerable code (should REJECT)
    console.log('📝 Test Case 1: Vulnerable Code\n');

    const vulnerableCode = `
async function login(username, password) {
  const user = await db.query('SELECT * FROM users WHERE username = ' + username);
  return user;
}
    `;

    console.log('Code to review:');
    console.log(vulnerableCode);
    console.log('\n🔄 Running consensus review...\n');

    const result1 = await consensus.execute({
      input: vulnerableCode,
      metadata: {
        pullRequestId: 'PR-123',
        author: 'developer@example.com',
      },
    });

    console.log('CONSENSUS RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    result1.agents.forEach((agent) => {
      const icon = agent.vote === 'APPROVE' ? '✅' : '❌';
      console.log(`${icon} ${agent.name}: ${agent.vote}`);
      console.log(`   ${agent.reasoning}\n`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      `FINAL DECISION: ${result1.decision === 'APPROVE' ? '✅ APPROVE' : '❌ REJECT'}`
    );
    console.log(`Vote Count: ${result1.voteCount}`);
    console.log(`Reasoning: ${result1.reasoning}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test Case 2: Clean code (should APPROVE)
    console.log('📝 Test Case 2: Clean Code\n');

    const cleanCode = `
async function getUser(id: string): Promise<User> {
  try {
    const user = await db.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [id]
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  } catch (error) {
    logger.error('Failed to fetch user', { id, error });
    throw error;
  }
}
    `;

    console.log('Code to review:');
    console.log(cleanCode);
    console.log('\n🔄 Running consensus review...\n');

    const result2 = await consensus.execute({
      input: cleanCode,
      metadata: {
        pullRequestId: 'PR-124',
        author: 'developer@example.com',
      },
    });

    console.log('CONSENSUS RESULTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    result2.agents.forEach((agent) => {
      const icon = agent.vote === 'APPROVE' ? '✅' : '❌';
      console.log(`${icon} ${agent.name}: ${agent.vote}`);
      console.log(`   ${agent.reasoning}\n`);
    });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(
      `FINAL DECISION: ${result2.decision === 'APPROVE' ? '✅ APPROVE' : '❌ REJECT'}`
    );
    console.log(`Vote Count: ${result2.voteCount}`);
    console.log(`Reasoning: ${result2.reasoning}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Metrics
    console.log('📊 Consensus Metrics\n');
    const metrics = await consensus.getMetrics();

    console.log(`Total reviews: ${metrics.totalReviews}`);
    console.log(`Approval rate: ${(metrics.approvalRate * 100).toFixed(1)}%`);
    console.log(`Avg review time: ${metrics.avgReviewTime.toFixed(1)}s`);
    console.log('\nAgent agreement rates:');
    console.log(`  Security ↔ Performance: ${(metrics.agentAgreement.security_performance * 100).toFixed(1)}%`);
    console.log(`  Security ↔ Quality: ${(metrics.agentAgreement.security_quality * 100).toFixed(1)}%`);
    console.log(`  Performance ↔ Quality: ${(metrics.agentAgreement.performance_quality * 100).toFixed(1)}%\n`);

    // Clean up
    await agentik.agents.delete(securityAgent.id);
    await agentik.agents.delete(performanceAgent.id);
    await agentik.agents.delete(qualityAgent.id);

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
🏗️  Setting up multi-agent consensus system...

✅ Created 3 specialized agents:

   🔒 Security: agent_1234567890_security-reviewer
   ⚡ Performance: agent_1234567890_performance-reviewer
   📝 Quality: agent_1234567890_quality-reviewer

✅ Consensus system built

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Test Case 1: Vulnerable Code

Code to review:

async function login(username, password) {
  const user = await db.query('SELECT * FROM users WHERE username = ' + username);
  return user;
}


🔄 Running consensus review...

CONSENSUS RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ Security Reviewer: REJECT
   CRITICAL: SQL injection vulnerability on line 2. User input is
   concatenated directly into query. Use parameterized queries instead.

✅ Performance Reviewer: APPROVE
   No significant performance issues. Query is simple and efficient.

❌ Quality Reviewer: REJECT
   Missing error handling, no input validation, no type safety.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL DECISION: ❌ REJECT
Vote Count: 1/3 APPROVE
Reasoning: Failed to meet 2/3 approval threshold. Critical security issue detected.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📝 Test Case 2: Clean Code

Code to review:

async function getUser(id: string): Promise<User> {
  try {
    const user = await db.query(
      'SELECT id, name, email FROM users WHERE id = $1',
      [id]
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  } catch (error) {
    logger.error('Failed to fetch user', { id, error });
    throw error;
  }
}


🔄 Running consensus review...

CONSENSUS RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Security Reviewer: APPROVE
   Parameterized query prevents SQL injection. Error handling is present.

✅ Performance Reviewer: APPROVE
   Efficient single query with limited fields. Good performance.

✅ Quality Reviewer: APPROVE
   TypeScript types, error handling, logging, and clear naming. Well-structured.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FINAL DECISION: ✅ APPROVE
Vote Count: 3/3 APPROVE
Reasoning: Unanimous approval. Code meets all quality standards.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📊 Consensus Metrics

Total reviews: 2
Approval rate: 50.0%
Avg review time: 45.2s

Agent agreement rates:
  Security ↔ Performance: 50.0%
  Security ↔ Quality: 100.0%
  Performance ↔ Quality: 50.0%

✅ Example completed and cleaned up!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
*/
