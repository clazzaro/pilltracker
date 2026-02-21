#!/usr/bin/env node

import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (two levels up)
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Initialize GitHub client with Enterprise support
const octokitConfig = {
  auth: process.env.GITHUB_TOKEN
};

// Add baseUrl for GitHub Enterprise
if (process.env.GITHUB_BASE_URL) {
  octokitConfig.baseUrl = process.env.GITHUB_BASE_URL;
  console.log(`Using GitHub Enterprise: ${process.env.GITHUB_BASE_URL}\n`);
}

const octokit = new Octokit(octokitConfig);

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;

async function testConnection() {
  console.log('Testing GitHub Connection...\n');
  console.log(`Repository: ${owner}/${repo}`);
  console.log('---\n');

  try {
    // Test 1: Get repository info
    console.log('Test 1: Fetching repository info...');
    const { data: repoData } = await octokit.repos.get({
      owner,
      repo,
    });
    console.log('✅ Repository found!');
    console.log(`   Name: ${repoData.name}`);
    console.log(`   Description: ${repoData.description || 'No description'}`);
    console.log(`   Default Branch: ${repoData.default_branch}`);
    console.log(`   Private: ${repoData.private}`);
    console.log();

    // Test 2: List branches
    console.log('Test 2: Listing branches...');
    const { data: branches } = await octokit.repos.listBranches({
      owner,
      repo,
    });
    console.log(`✅ Found ${branches.length} branch(es):`);
    branches.forEach(branch => {
      console.log(`   - ${branch.name}`);
    });
    console.log();

    // Test 3: List open PRs
    console.log('Test 3: Listing open pull requests...');
    const { data: prs } = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
    });
    console.log(`✅ Found ${prs.length} open PR(s):`);
    if (prs.length > 0) {
      prs.forEach(pr => {
        console.log(`   - PR #${pr.number}: ${pr.title}`);
        console.log(`     Branch: ${pr.head.ref} → ${pr.base.ref}`);
        console.log(`     URL: ${pr.html_url}`);
      });
    } else {
      console.log('   (No open PRs)');
    }
    console.log();

    // Test 4: Check authentication
    console.log('Test 4: Verifying authentication...');
    const { data: user } = await octokit.users.getAuthenticated();
    console.log('✅ Authenticated as:');
    console.log(`   Username: ${user.login}`);
    console.log(`   Name: ${user.name || 'Not set'}`);
    console.log(`   Email: ${user.email || 'Not public'}`);
    console.log();

    console.log('🎉 All tests passed! GitHub MCP server is ready to use.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.status === 401) {
      console.error('\n⚠️  Authentication failed. Please check your GITHUB_TOKEN in .env file.');
    } else if (error.status === 404) {
      console.error('\n⚠️  Repository not found. Please check GITHUB_OWNER and GITHUB_REPO in .env file.');
    } else {
      console.error('\nDetails:', error.response?.data || error);
    }
    process.exit(1);
  }
}

testConnection();

// Made with Bob
