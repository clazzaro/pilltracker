#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (three levels up from src/)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Jira configuration
const JIRA_DOMAIN = process.env.JIRA_HOST;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY || 'CP';

if (!JIRA_DOMAIN || !JIRA_EMAIL || !JIRA_API_TOKEN) {
  console.error('Error: Missing required Jira environment variables');
  console.error('Required: JIRA_DOMAIN, JIRA_EMAIL, JIRA_API_TOKEN');
  process.exit(1);
}

// Create Jira API client
const jiraClient = axios.create({
  baseURL: `https://${JIRA_DOMAIN}/rest/api/3`,
  auth: {
    username: JIRA_EMAIL,
    password: JIRA_API_TOKEN,
  },
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Create MCP server
const server = new Server(
  {
    name: 'jira-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const TOOLS = [
  {
    name: 'jira_get_assigned_tickets',
    description: 'Get all Jira tickets assigned to a specific user (e.g., "bobdev")',
    inputSchema: {
      type: 'object',
      properties: {
        assignee: {
          type: 'string',
          description: 'The display name of the assignee (e.g., "bobdev")',
        },
        status: {
          type: 'string',
          description: 'Optional: Filter by status (e.g., "To Do", "In Progress")',
        },
      },
      required: ['assignee'],
    },
  },
  {
    name: 'jira_get_ticket_details',
    description: 'Get detailed information about a specific Jira ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_key: {
          type: 'string',
          description: 'The ticket key (e.g., "CP-101")',
        },
      },
      required: ['ticket_key'],
    },
  },
  {
    name: 'jira_update_status',
    description: 'Update the status of a Jira ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_key: {
          type: 'string',
          description: 'The ticket key (e.g., "CP-101")',
        },
        status: {
          type: 'string',
          description: 'The new status (e.g., "In Progress", "In Review", "Done")',
        },
      },
      required: ['ticket_key', 'status'],
    },
  },
  {
    name: 'jira_add_comment',
    description: 'Add a comment to a Jira ticket',
    inputSchema: {
      type: 'object',
      properties: {
        ticket_key: {
          type: 'string',
          description: 'The ticket key (e.g., "CP-101")',
        },
        comment: {
          type: 'string',
          description: 'The comment text to add',
        },
      },
      required: ['ticket_key', 'comment'],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'jira_get_assigned_tickets': {
        const { assignee, status } = args;
        
        // Build JQL query
        let jql = `project = ${JIRA_PROJECT_KEY} AND assignee = "${assignee}"`;
        if (status) {
          jql += ` AND status = "${status}"`;
        }
        jql += ' ORDER BY created DESC';

        const response = await jiraClient.post('/search/jql', {
          jql,
          fields: ['summary', 'status', 'priority', 'assignee', 'created', 'updated', 'description'],
        });

        const tickets = response.data.issues.map(issue => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status.name,
          priority: issue.fields.priority?.name || 'None',
          assignee: issue.fields.assignee?.displayName || 'Unassigned',
          created: issue.fields.created,
          updated: issue.fields.updated,
          description: issue.fields.description || 'No description',
        }));

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                count: tickets.length,
                tickets,
              }, null, 2),
            },
          ],
        };
      }

      case 'jira_get_ticket_details': {
        const { ticket_key } = args;

        const response = await jiraClient.get(`/issue/${ticket_key}`);
        const issue = response.data;

        const details = {
          key: issue.key,
          summary: issue.fields.summary,
          description: issue.fields.description || 'No description',
          status: issue.fields.status.name,
          priority: issue.fields.priority?.name || 'None',
          assignee: issue.fields.assignee?.displayName || 'Unassigned',
          reporter: issue.fields.reporter?.displayName || 'Unknown',
          created: issue.fields.created,
          updated: issue.fields.updated,
          labels: issue.fields.labels || [],
          components: issue.fields.components?.map(c => c.name) || [],
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                ticket: details,
              }, null, 2),
            },
          ],
        };
      }

      case 'jira_update_status': {
        const { ticket_key, status } = args;

        // Get available transitions
        const transitionsResponse = await jiraClient.get(`/issue/${ticket_key}/transitions`);
        const transitions = transitionsResponse.data.transitions;

        // Find the transition that matches the desired status
        const transition = transitions.find(t => 
          t.name.toLowerCase() === status.toLowerCase() ||
          t.to.name.toLowerCase() === status.toLowerCase()
        );

        if (!transition) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: `Status "${status}" not available. Available transitions: ${transitions.map(t => t.name).join(', ')}`,
                }, null, 2),
              },
            ],
          };
        }

        // Perform the transition
        await jiraClient.post(`/issue/${ticket_key}/transitions`, {
          transition: {
            id: transition.id,
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Ticket ${ticket_key} status updated to "${status}"`,
                ticket_key,
                new_status: status,
              }, null, 2),
            },
          ],
        };
      }

      case 'jira_add_comment': {
        const { ticket_key, comment } = args;

        await jiraClient.post(`/issue/${ticket_key}/comment`, {
          body: {
            type: 'doc',
            version: 1,
            content: [
              {
                type: 'paragraph',
                content: [
                  {
                    type: 'text',
                    text: comment,
                  },
                ],
              },
            ],
          },
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Comment added to ticket ${ticket_key}`,
                ticket_key,
              }, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                error: `Unknown tool: ${name}`,
              }, null, 2),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    console.error(`Error executing ${name}:`, error.message);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            details: error.response?.data || 'No additional details',
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
  console.error('Jira MCP Server running on stdio');
  console.error(`Connected to: ${JIRA_DOMAIN}`);
  console.error(`Project: ${JIRA_PROJECT_KEY}`);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Made with Bob
