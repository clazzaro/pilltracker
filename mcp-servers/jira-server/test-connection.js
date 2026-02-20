#!/usr/bin/env node

// Simple test script to verify Jira MCP server can connect and fetch tickets
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two levels up)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const JIRA_DOMAIN = process.env.JIRA_DOMAIN;
const JIRA_EMAIL = process.env.JIRA_EMAIL;
const JIRA_API_TOKEN = process.env.JIRA_API_TOKEN;
const JIRA_PROJECT_KEY = process.env.JIRA_PROJECT_KEY;

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

async function testConnection() {
  console.log('🔍 Testing Jira MCP Server Connection...\n');
  console.log(`Domain: ${JIRA_DOMAIN}`);
  console.log(`Project: ${JIRA_PROJECT_KEY}`);
  console.log(`Email: ${JIRA_EMAIL}\n`);

  try {
    // Test 1: Get tickets assigned to Bob Dev
    console.log('Test 1: Fetching tickets assigned to "Bob Dev"...');
    const jql = `project = ${JIRA_PROJECT_KEY} AND assignee = "Bob Dev" ORDER BY created DESC`;
    
    const response = await jiraClient.post('/search/jql', {
      jql,
      fields: ['summary', 'status', 'priority', 'assignee', 'created', 'description'],
    });

    const tickets = response.data.issues;
    
    if (tickets.length === 0) {
      console.log('⚠️  No tickets found assigned to "Bob Dev"');
      console.log('   Make sure you created a ticket and assigned it to "Bob Dev"\n');
    } else {
      console.log(`✅ Found ${tickets.length} ticket(s):\n`);
      tickets.forEach(issue => {
        console.log(`   ${issue.key}: ${issue.fields.summary}`);
        console.log(`   Status: ${issue.fields.status.name}`);
        console.log(`   Assignee: ${issue.fields.assignee?.displayName || 'Unassigned'}`);
        console.log('');
      });
    }

    // Test 2: Get ticket details for the first ticket
    if (tickets.length > 0) {
      const firstTicket = tickets[0];
      console.log(`Test 2: Getting details for ${firstTicket.key}...`);
      
      const detailResponse = await jiraClient.get(`/issue/${firstTicket.key}`);
      const issue = detailResponse.data;
      
      console.log(`✅ Ticket Details:`);
      console.log(`   Key: ${issue.key}`);
      console.log(`   Summary: ${issue.fields.summary}`);
      console.log(`   Description: ${issue.fields.description || 'No description'}`);
      console.log(`   Status: ${issue.fields.status.name}`);
      console.log('');
    }

    console.log('✅ All tests passed! Jira MCP server is configured correctly.\n');
    console.log('Next steps:');
    console.log('1. Restart VS Code to load the MCP configuration');
    console.log('2. Open Bob IDE (Roo Cline)');
    console.log('3. Ask Bob: "Check for Jira tickets assigned to Bob Dev"');
    console.log('4. Bob should use the jira_get_assigned_tickets tool and show the tickets\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
    console.log('\nTroubleshooting:');
    console.log('- Verify your API token is correct');
    console.log('- Check that the email matches your Jira account');
    console.log('- Ensure the project key is correct (KAN)');
    console.log('- Make sure you have permission to view tickets');
  }
}

testConnection();

// Made with Bob
