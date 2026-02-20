#!/usr/bin/env node

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

async function listAllTickets() {
  console.log('🔍 Listing ALL tickets in project', JIRA_PROJECT_KEY, '\n');

  try {
    const jql = `project = ${JIRA_PROJECT_KEY} ORDER BY created DESC`;
    
    const response = await jiraClient.post('/search/jql', {
      jql,
      fields: ['summary', 'status', 'assignee'],
      maxResults: 50,
    });

    const tickets = response.data.issues;
    
    if (tickets.length === 0) {
      console.log('⚠️  No tickets found in project', JIRA_PROJECT_KEY);
      console.log('   Create a ticket in Jira first!\n');
    } else {
      console.log(`Found ${tickets.length} ticket(s):\n`);
      tickets.forEach(issue => {
        const assigneeName = issue.fields.assignee?.displayName || 'Unassigned';
        console.log(`${issue.key}: ${issue.fields.summary}`);
        console.log(`   Status: ${issue.fields.status.name}`);
        console.log(`   Assignee: ${assigneeName}`);
        console.log('');
      });
      
      console.log('\n💡 To test with Bob:');
      console.log('   1. Pick a ticket from above');
      console.log('   2. In Jira, assign it to "Bob Dev" (exact name)');
      console.log('   3. Run: node test-connection.js');
      console.log('   4. You should see the ticket!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

listAllTickets();

// Made with Bob
