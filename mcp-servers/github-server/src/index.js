#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (three levels up from src/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Initialize GitHub client with Enterprise support
const octokitConfig = {
  auth: process.env.GITHUB_TOKEN
};

// Add baseUrl for GitHub Enterprise
if (process.env.GITHUB_BASE_URL) {
  octokitConfig.baseUrl = process.env.GITHUB_BASE_URL;
}

const octokit = new Octokit(octokitConfig);

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const baseBranch = process.env.DEFAULT_BASE_BRANCH || 'demo-dev';

// MCP Server
const server = new Server(
  {
    name: 'github-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'github_create_pr',
        description: 'Create a pull request with title, description, branch name, and base branch',
        inputSchema: {
          type: 'object',
          properties: {
            title: {
              type: 'string',
              description: 'PR title (e.g., "[KAN-4] Add Advanced Search to Order History")',
            },
            body: {
              type: 'string',
              description: 'PR description with implementation details, testing notes, and screenshots',
            },
            head: {
              type: 'string',
              description: 'Source branch name (e.g., "feature/KAN-4-advanced-search")',
            },
            base: {
              type: 'string',
              description: 'Target branch name (default: demo-dev)',
            },
          },
          required: ['title', 'body', 'head'],
        },
      },
      {
        name: 'github_get_pr_reviews',
        description: 'Get all review comments for a pull request',
        inputSchema: {
          type: 'object',
          properties: {
            pr_number: {
              type: 'number',
              description: 'Pull request number',
            },
          },
          required: ['pr_number'],
        },
      },
      {
        name: 'github_update_pr',
        description: 'Update pull request title or description',
        inputSchema: {
          type: 'object',
          properties: {
            pr_number: {
              type: 'number',
              description: 'Pull request number',
            },
            title: {
              type: 'string',
              description: 'New PR title (optional)',
            },
            body: {
              type: 'string',
              description: 'New PR description (optional)',
            },
          },
          required: ['pr_number'],
        },
      },
      {
        name: 'github_add_pr_comment',
        description: 'Add a comment to a pull request',
        inputSchema: {
          type: 'object',
          properties: {
            pr_number: {
              type: 'number',
              description: 'Pull request number',
            },
            comment: {
              type: 'string',
              description: 'Comment text',
            },
          },
          required: ['pr_number', 'comment'],
        },
      },
      {
        name: 'github_get_pr_details',
        description: 'Get detailed information about a pull request',
        inputSchema: {
          type: 'object',
          properties: {
            pr_number: {
              type: 'number',
              description: 'Pull request number',
            },
          },
          required: ['pr_number'],
        },
      },
      {
        name: 'github_list_open_prs',
        description: 'List all open pull requests in the repository',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'github_create_pr': {
        const { title, body, head, base = baseBranch } = args;
        
        const pr = await octokit.pulls.create({
          owner,
          repo,
          title,
          body,
          head,
          base,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                pr_number: pr.data.number,
                pr_url: pr.data.html_url,
                title: pr.data.title,
                state: pr.data.state,
                created_at: pr.data.created_at,
              }, null, 2),
            },
          ],
        };
      }

      case 'github_get_pr_reviews': {
        const { pr_number } = args;

        // Get review comments
        const reviews = await octokit.pulls.listReviews({
          owner,
          repo,
          pull_number: pr_number,
        });

        // Get issue comments (general PR comments)
        const comments = await octokit.issues.listComments({
          owner,
          repo,
          issue_number: pr_number,
        });

        // Get review comments (inline code comments)
        const reviewComments = await octokit.pulls.listReviewComments({
          owner,
          repo,
          pull_number: pr_number,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                reviews: reviews.data.map(r => ({
                  id: r.id,
                  user: r.user.login,
                  state: r.state,
                  body: r.body,
                  submitted_at: r.submitted_at,
                })),
                comments: comments.data.map(c => ({
                  id: c.id,
                  user: c.user.login,
                  body: c.body,
                  created_at: c.created_at,
                })),
                review_comments: reviewComments.data.map(rc => ({
                  id: rc.id,
                  user: rc.user.login,
                  body: rc.body,
                  path: rc.path,
                  line: rc.line,
                  created_at: rc.created_at,
                })),
              }, null, 2),
            },
          ],
        };
      }

      case 'github_update_pr': {
        const { pr_number, title, body } = args;

        const updateData = {};
        if (title) updateData.title = title;
        if (body) updateData.body = body;

        const pr = await octokit.pulls.update({
          owner,
          repo,
          pull_number: pr_number,
          ...updateData,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                pr_number: pr.data.number,
                title: pr.data.title,
                updated_at: pr.data.updated_at,
              }, null, 2),
            },
          ],
        };
      }

      case 'github_add_pr_comment': {
        const { pr_number, comment } = args;

        const result = await octokit.issues.createComment({
          owner,
          repo,
          issue_number: pr_number,
          body: comment,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                comment_id: result.data.id,
                comment_url: result.data.html_url,
                created_at: result.data.created_at,
              }, null, 2),
            },
          ],
        };
      }

      case 'github_get_pr_details': {
        const { pr_number } = args;

        const pr = await octokit.pulls.get({
          owner,
          repo,
          pull_number: pr_number,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                number: pr.data.number,
                title: pr.data.title,
                body: pr.data.body,
                state: pr.data.state,
                head: {
                  ref: pr.data.head.ref,
                  sha: pr.data.head.sha,
                },
                base: {
                  ref: pr.data.base.ref,
                },
                user: pr.data.user.login,
                created_at: pr.data.created_at,
                updated_at: pr.data.updated_at,
                html_url: pr.data.html_url,
                mergeable: pr.data.mergeable,
                merged: pr.data.merged,
              }, null, 2),
            },
          ],
        };
      }

      case 'github_list_open_prs': {
        const prs = await octokit.pulls.list({
          owner,
          repo,
          state: 'open',
          sort: 'created',
          direction: 'desc',
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                count: prs.data.length,
                pull_requests: prs.data.map(pr => ({
                  number: pr.number,
                  title: pr.title,
                  state: pr.state,
                  head: pr.head.ref,
                  base: pr.base.ref,
                  user: pr.user.login,
                  created_at: pr.created_at,
                  html_url: pr.html_url,
                })),
              }, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            error: error.message,
            details: error.response?.data || error.stack,
          }, null, 2),
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GitHub MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Made with Bob
