#!/usr/bin/env node

/**
 * Jira Auto-Watcher for Bob Demo
 * 
 * This script continuously polls Jira for new tickets assigned to bobdev
 * and automatically triggers Bob to start working on them.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two levels up)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const execAsync = promisify(exec);

const JIRA_DOMAIN = process.env.JIRA_HOST;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;
const JIRA_ASSIGNEE = process.env.JIRA_ASSIGNEE || 'bobdev';
const POLL_INTERVAL = 10000; // 10 seconds

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

// Track tickets we've already processed
const processedTickets = new Set();

/**
 * Extract plain text from Jira's Atlassian Document Format (ADF)
 * @param {Object} adfContent - The ADF content object
 * @returns {string} Plain text representation
 */
function extractTextFromADF(adfContent) {
  if (!adfContent) return 'No description provided';
  
  // If it's already a string, return it
  if (typeof adfContent === 'string') return adfContent;
  
  // If it's an ADF object, extract text recursively
  let text = '';
  
  function traverse(node) {
    if (!node) return;
    
    // Handle text nodes
    if (node.type === 'text') {
      text += node.text || '';
    }
    
    // Handle different block types
    if (node.type === 'paragraph' || node.type === 'heading') {
      if (text && !text.endsWith('\n')) text += '\n';
    }
    
    if (node.type === 'hardBreak') {
      text += '\n';
    }
    
    if (node.type === 'listItem') {
      text += '• ';
    }
    
    // Traverse content array
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
      if (node.type === 'paragraph' || node.type === 'listItem') {
        text += '\n';
      }
    }
  }
  
  traverse(adfContent);
  return text.trim() || 'No description provided';
}

async function getNewTickets() {
  try {
    const jql = `project = ${JIRA_PROJECT_KEY} AND assignee = ${JIRA_ASSIGNEE} AND status = "To Do" ORDER BY created DESC`;
    
    const response = await jiraClient.post('/search/jql', {
      jql,
      fields: ['summary', 'status', 'description', 'priority'],
      maxResults: 10,
    });

    const tickets = response.data.issues;
    const newTickets = tickets.filter(ticket => !processedTickets.has(ticket.key));
    
    return newTickets;
  } catch (error) {
    console.error('❌ Error fetching tickets:', error.message);
    return [];
  }
}

async function triggerBobToWork(ticket) {
  console.log(`\n🤖 NEW TICKET DETECTED: ${ticket.key}`);
  console.log(`   Summary: ${ticket.fields.summary}`);
  console.log(`   Status: ${ticket.fields.status.name}`);
  console.log(`   Priority: ${ticket.fields.priority?.name || 'None'}`);
  console.log(`\n🚀 Triggering Bob to start working...\n`);

  // Mark as processed
  processedTickets.add(ticket.key);

  // Create a task file that Bob can pick up
  const taskDescription = `
# New Jira Ticket Assigned: ${ticket.key}

**Summary**: ${ticket.fields.summary}
**Status**: ${ticket.fields.status.name}
**Priority**: ${ticket.fields.priority?.name || 'None'}

**Description**:
${extractTextFromADF(ticket.fields.description)}

## Your Task:
1. Read the ticket details from Jira using jira_get_ticket_details
2. Update the ticket status to "In Progress" using jira_update_status
3. Analyze the codebase to understand what needs to be implemented
4. Implement the feature according to the acceptance criteria
5. Write comprehensive tests
6. Run the application locally and capture screenshots
7. Create a feature branch
8. Create a pull request with description and screenshots
9. Update the ticket status to "In Review"

## Jira Ticket Link:
https://${JIRA_DOMAIN}/browse/${ticket.key}

Start working on this ticket now!
`;

  // Write task to a file that can be monitored
  const fs = await import('fs');
  const path = await import('path');
  const taskFile = path.default.join(process.cwd(), '../../.bob-tasks', `${ticket.key}.md`);
  
  // Create directory if it doesn't exist
  const taskDir = path.default.dirname(taskFile);
  if (!fs.default.existsSync(taskDir)) {
    fs.default.mkdirSync(taskDir, { recursive: true });
  }
  
  fs.default.writeFileSync(taskFile, taskDescription);
  
  console.log(`✅ Task file created: ${taskFile}`);
  console.log(`\n📋 Bob should now:`);
  console.log(`   1. Detect the new task`);
  console.log(`   2. Read ticket ${ticket.key} from Jira`);
  console.log(`   3. Update status to "In Progress"`);
  console.log(`   4. Start implementing the feature`);
  console.log(`\n⏳ Watching for next ticket...\n`);
}

async function watchJira() {
  console.log('👀 Jira Auto-Watcher Started');
  console.log(`   Domain: ${JIRA_DOMAIN}`);
  console.log(`   Project: ${JIRA_PROJECT_KEY}`);
  console.log(`   Assignee: ${JIRA_ASSIGNEE}`);
  console.log(`   Poll Interval: ${POLL_INTERVAL / 1000} seconds`);
  console.log(`\n🔍 Watching for new tickets...\n`);

  // Initial check
  const initialTickets = await getNewTickets();
  if (initialTickets.length > 0) {
    console.log(`📋 Found ${initialTickets.length} existing ticket(s) in "To Do" status`);
    initialTickets.forEach(ticket => {
      console.log(`   - ${ticket.key}: ${ticket.fields.summary}`);
    });
    console.log(`\n💡 These tickets are ready to be worked on.`);
    console.log(`   Assign a NEW ticket to ${JIRA_ASSIGNEE} to see auto-detection!\n`);
  }

  // Start polling
  setInterval(async () => {
    const newTickets = await getNewTickets();
    
    if (newTickets.length > 0) {
      for (const ticket of newTickets) {
        await triggerBobToWork(ticket);
      }
    } else {
      // Silent polling - only show dots to indicate it's working
      process.stdout.write('.');
    }
  }, POLL_INTERVAL);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Stopping Jira Auto-Watcher...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\n👋 Stopping Jira Auto-Watcher...');
  process.exit(0);
});

// Start watching
watchJira().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

// Made with Bob
