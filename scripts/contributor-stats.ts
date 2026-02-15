#!/usr/bin/env bun
/**
 * Contributor Stats Generator
 *
 * Fetches contributor statistics from GitHub API and updates CONTRIBUTORS.md
 * Run: bun run scripts/contributor-stats.ts
 */

import { Octokit } from '@octokit/rest';

interface Contributor {
  username: string;
  name?: string;
  avatarUrl: string;
  contributions: {
    commits: number;
    prs: number;
    issues: number;
    reviews: number;
    comments: number;
  };
  types: string[]; // code, docs, design, etc.
}

interface ContributorBadge {
  name: string;
  emoji: string;
  requirement: string;
  earned: boolean;
}

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = 'agentik-os';
const REPO_NAME = 'agentik-os';

if (!GITHUB_TOKEN) {
  console.error('❌ GITHUB_TOKEN environment variable is required');
  console.error('Get a token at: https://github.com/settings/tokens');
  process.exit(1);
}

const octokit = new Octokit({ auth: GITHUB_TOKEN });

/**
 * Fetch all contributors from GitHub API
 */
async function fetchContributors(): Promise<Contributor[]> {
  console.log('📊 Fetching contributors from GitHub API...');

  const contributors = new Map<string, Contributor>();

  // Fetch commit authors
  console.log('  → Fetching commits...');
  const { data: commits } = await octokit.repos.listCommits({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    per_page: 100,
  });

  for (const commit of commits) {
    if (!commit.author) continue;

    const username = commit.author.login;
    if (!contributors.has(username)) {
      contributors.set(username, {
        username,
        name: commit.commit.author?.name,
        avatarUrl: commit.author.avatar_url,
        contributions: {
          commits: 0,
          prs: 0,
          issues: 0,
          reviews: 0,
          comments: 0,
        },
        types: [],
      });
    }

    const contributor = contributors.get(username)!;
    contributor.contributions.commits++;
  }

  // Fetch pull requests
  console.log('  → Fetching pull requests...');
  const { data: prs } = await octokit.pulls.list({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: 'all',
    per_page: 100,
  });

  for (const pr of prs) {
    const username = pr.user?.login;
    if (!username) continue;

    if (!contributors.has(username)) {
      contributors.set(username, {
        username,
        name: pr.user?.name,
        avatarUrl: pr.user?.avatar_url || '',
        contributions: {
          commits: 0,
          prs: 0,
          issues: 0,
          reviews: 0,
          comments: 0,
        },
        types: [],
      });
    }

    const contributor = contributors.get(username)!;
    contributor.contributions.prs++;
  }

  // Fetch issues
  console.log('  → Fetching issues...');
  const { data: issues } = await octokit.issues.listForRepo({
    owner: REPO_OWNER,
    repo: REPO_NAME,
    state: 'all',
    per_page: 100,
  });

  for (const issue of issues) {
    if (issue.pull_request) continue; // Skip PRs (already counted)

    const username = issue.user?.login;
    if (!username) continue;

    if (!contributors.has(username)) {
      contributors.set(username, {
        username,
        name: issue.user?.name,
        avatarUrl: issue.user?.avatar_url || '',
        contributions: {
          commits: 0,
          prs: 0,
          issues: 0,
          reviews: 0,
          comments: 0,
        },
        types: [],
      });
    }

    const contributor = contributors.get(username)!;
    contributor.contributions.issues++;
  }

  console.log(`✅ Found ${contributors.size} contributors`);
  return Array.from(contributors.values());
}

/**
 * Classify contributor types based on their contributions
 */
function classifyContributorTypes(contributor: Contributor): string[] {
  const types: string[] = [];

  if (contributor.contributions.commits > 0 || contributor.contributions.prs > 0) {
    types.push('code');
  }

  // Detect doc contributors by checking file patterns (would need PR file data)
  // For now, add placeholder logic
  if (contributor.contributions.commits > 10) {
    types.push('docs');
  }

  if (contributor.contributions.issues > 5) {
    types.push('bug');
  }

  if (contributor.contributions.reviews > 10) {
    types.push('review');
  }

  return types;
}

/**
 * Determine contributor level based on contributions
 */
function getContributorLevel(contributor: Contributor): string {
  const totalContributions =
    contributor.contributions.commits +
    contributor.contributions.prs +
    contributor.contributions.issues +
    contributor.contributions.reviews;

  if (totalContributions >= 50) {
    return 'Core Team';
  } else if (totalContributions >= 20) {
    return 'Major Contributor';
  } else if (totalContributions >= 10) {
    return 'Active Contributor';
  } else {
    return 'Contributor';
  }
}

/**
 * Calculate badges earned by contributor
 */
function calculateBadges(contributor: Contributor): ContributorBadge[] {
  const badges: ContributorBadge[] = [
    {
      name: 'First PR',
      emoji: '🥇',
      requirement: 'Merged first PR',
      earned: contributor.contributions.prs >= 1,
    },
    {
      name: '10 PRs',
      emoji: '🔟',
      requirement: '10 merged PRs',
      earned: contributor.contributions.prs >= 10,
    },
    {
      name: '100 PRs',
      emoji: '💯',
      requirement: '100 merged PRs',
      earned: contributor.contributions.prs >= 100,
    },
    {
      name: 'Documentarian',
      emoji: '📚',
      requirement: '10+ doc PRs',
      earned: contributor.types.includes('docs'),
    },
    {
      name: 'Bug Crusher',
      emoji: '🐛',
      requirement: '20+ bugs fixed',
      earned: contributor.contributions.issues >= 20,
    },
  ];

  return badges.filter((b) => b.earned);
}

/**
 * Generate markdown for all-contributors format
 */
function generateAllContributorsMarkdown(contributors: Contributor[]): string {
  let markdown = '<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->\n';
  markdown += '<!-- prettier-ignore-start -->\n';
  markdown += '<!-- markdownlint-disable -->\n';
  markdown += '<table>\n';

  // Split contributors into rows of 7
  const rows = Math.ceil(contributors.length / 7);

  for (let i = 0; i < rows; i++) {
    markdown += '  <tr>\n';

    const rowContributors = contributors.slice(i * 7, (i + 1) * 7);

    for (const contributor of rowContributors) {
      const types = classifyContributorTypes(contributor);
      const typeEmojis = types.map((t) => {
        switch (t) {
          case 'code': return '💻';
          case 'docs': return '📖';
          case 'bug': return '🐛';
          case 'review': return '👀';
          default: return '📢';
        }
      }).join('');

      markdown += `    <td align="center" valign="top" width="14.28%">`;
      markdown += `<a href="https://github.com/${contributor.username}">`;
      markdown += `<img src="${contributor.avatarUrl}" width="100px;" alt="${contributor.username}"/>`;
      markdown += `<br /><sub><b>${contributor.name || contributor.username}</b></sub>`;
      markdown += `</a><br />`;
      markdown += `<a href="https://github.com/${REPO_OWNER}/${REPO_NAME}/commits?author=${contributor.username}" title="Code">${typeEmojis}</a>`;
      markdown += `</td>\n`;
    }

    markdown += '  </tr>\n';
  }

  markdown += '</table>\n\n';
  markdown += '<!-- markdownlint-restore -->\n';
  markdown += '<!-- prettier-ignore-end -->\n';
  markdown += '<!-- ALL-CONTRIBUTORS-LIST:END -->\n';

  return markdown;
}

/**
 * Generate top contributors section
 */
function generateTopContributors(contributors: Contributor[]): string {
  const sorted = contributors
    .sort((a, b) => {
      const aTotal = a.contributions.commits + a.contributions.prs + a.contributions.issues;
      const bTotal = b.contributions.commits + b.contributions.prs + b.contributions.issues;
      return bTotal - aTotal;
    })
    .slice(0, 10);

  let markdown = '<!-- TOP-CONTRIBUTORS:START -->\n';
  markdown += '| Rank | Contributor | Commits | PRs | Issues | Total |\n';
  markdown += '|------|-------------|---------|-----|--------|-------|\n';

  sorted.forEach((contributor, index) => {
    const total = contributor.contributions.commits + contributor.contributions.prs + contributor.contributions.issues;
    const level = getContributorLevel(contributor);

    let rankEmoji = '';
    if (index === 0) rankEmoji = '🥇';
    else if (index === 1) rankEmoji = '🥈';
    else if (index === 2) rankEmoji = '🥉';
    else rankEmoji = `${index + 1}`;

    markdown += `| ${rankEmoji} | [@${contributor.username}](https://github.com/${contributor.username}) | ${contributor.contributions.commits} | ${contributor.contributions.prs} | ${contributor.contributions.issues} | ${total} |\n`;
  });

  markdown += '<!-- TOP-CONTRIBUTORS:END -->\n';

  return markdown;
}

/**
 * Update CONTRIBUTORS.md with latest data
 */
async function updateContributorsFile(contributors: Contributor[]) {
  console.log('📝 Updating CONTRIBUTORS.md...');

  const contributorsMarkdown = generateAllContributorsMarkdown(contributors);
  const topContributorsMarkdown = generateTopContributors(contributors);

  // Read current CONTRIBUTORS.md
  const currentContent = await Bun.file('CONTRIBUTORS.md').text();

  // Replace all-contributors section
  let newContent = currentContent.replace(
    /<!-- ALL-CONTRIBUTORS-LIST:START -->[\s\S]*<!-- ALL-CONTRIBUTORS-LIST:END -->/,
    contributorsMarkdown
  );

  // Replace top contributors section
  newContent = newContent.replace(
    /<!-- TOP-CONTRIBUTORS:START -->[\s\S]*<!-- TOP-CONTRIBUTORS:END -->/,
    topContributorsMarkdown
  );

  // Write updated content
  await Bun.write('CONTRIBUTORS.md', newContent);

  console.log('✅ CONTRIBUTORS.md updated!');
}

/**
 * Generate statistics summary
 */
function printStatistics(contributors: Contributor[]) {
  console.log('\n📈 Contributor Statistics\n');

  const totalCommits = contributors.reduce((sum, c) => sum + c.contributions.commits, 0);
  const totalPRs = contributors.reduce((sum, c) => sum + c.contributions.prs, 0);
  const totalIssues = contributors.reduce((sum, c) => sum + c.contributions.issues, 0);

  console.log(`Total Contributors: ${contributors.length}`);
  console.log(`Total Commits: ${totalCommits}`);
  console.log(`Total PRs: ${totalPRs}`);
  console.log(`Total Issues: ${totalIssues}`);

  // Level breakdown
  const levels = {
    'Core Team': 0,
    'Major Contributor': 0,
    'Active Contributor': 0,
    'Contributor': 0,
  };

  contributors.forEach((c) => {
    const level = getContributorLevel(c);
    levels[level as keyof typeof levels]++;
  });

  console.log('\nBy Level:');
  Object.entries(levels).forEach(([level, count]) => {
    console.log(`  ${level}: ${count}`);
  });
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Agentik OS Contributor Stats Generator\n');

  try {
    const contributors = await fetchContributors();

    if (contributors.length === 0) {
      console.log('⚠️  No contributors found yet. This is expected for new projects!');
      return;
    }

    await updateContributorsFile(contributors);
    printStatistics(contributors);

    console.log('\n✨ Done! CONTRIBUTORS.md has been updated.\n');
    console.log('💡 Tip: Run this script weekly via GitHub Actions to keep it fresh.');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

main();
