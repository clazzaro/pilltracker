#!/usr/bin/env node

import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';
import fs from 'fs';
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
}

const octokit = new Octokit(octokitConfig);

const owner = process.env.GITHUB_OWNER;
const repo = process.env.GITHUB_REPO;
const POLL_INTERVAL = 15000; // 15 seconds
const TASKS_DIR = path.join(process.cwd(), '../../.bob-tasks');
const PROCESSED_FILE = path.join(TASKS_DIR, 'processed-reviews.json');

// Ensure tasks directory exists
if (!fs.existsSync(TASKS_DIR)) {
  fs.mkdirSync(TASKS_DIR, { recursive: true });
}

// Load processed reviews
function loadProcessedReviews() {
  if (fs.existsSync(PROCESSED_FILE)) {
    return JSON.parse(fs.readFileSync(PROCESSED_FILE, 'utf8'));
  }
  return {};
}

// Save processed reviews
function saveProcessedReviews(processed) {
  fs.writeFileSync(PROCESSED_FILE, JSON.stringify(processed, null, 2));
}

// Create task file for review
function createReviewTask(pr, reviews, comments, reviewComments) {
  const prNumber = pr.number;
  const ticketId = pr.title.match(/\[(KAN-\d+)\]/)?.[1] || `PR-${prNumber}`;
  
  // Count existing review task files for this ticket
  const existingReviews = fs.readdirSync(TASKS_DIR)
    .filter(f => f.startsWith(`${ticketId}-review-`))
    .length;
  
  const reviewNumber = existingReviews + 1;
  const taskFile = path.join(TASKS_DIR, `${ticketId}-review-${reviewNumber}.md`);
  
  // Combine all feedback
  const allFeedback = [];
  
  // Add review comments (general reviews)
  reviews.forEach(review => {
    if (review.body && review.state !== 'APPROVED') {
      allFeedback.push({
        type: 'Review',
        user: review.user.login,
        state: review.state,
        body: review.body,
        submitted_at: review.submitted_at,
      });
    }
  });
  
  // Add general PR comments
  comments.forEach(comment => {
    allFeedback.push({
      type: 'Comment',
      user: comment.user.login,
      body: comment.body,
      created_at: comment.created_at,
    });
  });
  
  // Add inline code review comments
  reviewComments.forEach(comment => {
    allFeedback.push({
      type: 'Code Review',
      user: comment.user.login,
      file: comment.path,
      line: comment.line,
      body: comment.body,
      created_at: comment.created_at,
    });
  });
  
  if (allFeedback.length === 0) {
    return null; // No actionable feedback
  }
  
  // Create task file content
  const content = `
# PR Review Feedback: ${ticketId} (Review #${reviewNumber})

**PR #${prNumber}**: ${pr.title}
**PR URL**: ${pr.html_url}
**Branch**: ${pr.head.ref}

## Review Feedback to Address:

${allFeedback.map((feedback, idx) => `
### Feedback ${idx + 1} - ${feedback.type}
**From**: ${feedback.user}
${feedback.file ? `**File**: ${feedback.file} (Line ${feedback.line})` : ''}
${feedback.state ? `**Review State**: ${feedback.state}` : ''}

${feedback.body}

---
`).join('\n')}

## Your Task:
1. Read all the review feedback above
2. Fetch the current PR details using github_get_pr_details
3. Check out the branch: ${pr.head.ref}
4. Address each piece of feedback by making necessary code changes
5. Run tests to ensure changes work correctly
6. Commit and push changes to the same branch
7. Add a comment to the PR using github_add_pr_comment explaining what was fixed
8. Update the Jira ticket with progress using jira_add_comment

## Commands:
\`\`\`bash
# Checkout the PR branch
git checkout ${pr.head.ref}

# After making changes
git add .
git commit -m "${ticketId}: Address review feedback - [brief description]"
git push origin ${pr.head.ref}
\`\`\`

Start addressing this review feedback now!
`;
  
  fs.writeFileSync(taskFile, content.trim());
  console.log(`✅ Created review task: ${taskFile}`);
  return taskFile;
}

// Check for new reviews on open PRs
async function checkForReviews() {
  try {
    console.log(`[${new Date().toISOString()}] Checking for PR reviews...`);
    
    // Get all open PRs
    const { data: prs } = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
    });
    
    if (prs.length === 0) {
      console.log('No open PRs found');
      return;
    }
    
    console.log(`Found ${prs.length} open PR(s)`);
    
    const processed = loadProcessedReviews();
    
    for (const pr of prs) {
      const prKey = `pr-${pr.number}`;
      
      // Get all reviews
      const { data: reviews } = await octokit.pulls.listReviews({
        owner,
        repo,
        pull_number: pr.number,
      });
      
      // Get general comments
      const { data: comments } = await octokit.issues.listComments({
        owner,
        repo,
        issue_number: pr.number,
      });
      
      // Get inline code comments
      const { data: reviewComments } = await octokit.pulls.listReviewComments({
        owner,
        repo,
        pull_number: pr.number,
      });
      
      // Calculate hash of all feedback
      const feedbackHash = JSON.stringify({
        reviews: reviews.map(r => ({ id: r.id, body: r.body, state: r.state })),
        comments: comments.map(c => ({ id: c.id, body: c.body })),
        reviewComments: reviewComments.map(rc => ({ id: rc.id, body: rc.body })),
      });
      
      // Check if we've already processed this feedback
      if (processed[prKey] === feedbackHash) {
        console.log(`PR #${pr.number}: No new feedback`);
        continue;
      }
      
      // Filter for actionable feedback (not from bot, not approved)
      const actionableReviews = reviews.filter(r => 
        r.user.login !== 'github-actions[bot]' && 
        r.state !== 'APPROVED' &&
        r.body
      );
      
      const actionableComments = comments.filter(c => 
        c.user.login !== 'github-actions[bot]'
      );
      
      const actionableReviewComments = reviewComments.filter(rc => 
        rc.user.login !== 'github-actions[bot]'
      );
      
      if (actionableReviews.length > 0 || actionableComments.length > 0 || actionableReviewComments.length > 0) {
        console.log(`PR #${pr.number}: Found new feedback!`);
        console.log(`  - ${actionableReviews.length} review(s)`);
        console.log(`  - ${actionableComments.length} comment(s)`);
        console.log(`  - ${actionableReviewComments.length} inline comment(s)`);
        
        const taskFile = createReviewTask(pr, actionableReviews, actionableComments, actionableReviewComments);
        
        if (taskFile) {
          // Mark as processed
          processed[prKey] = feedbackHash;
          saveProcessedReviews(processed);
          
          console.log(`🎯 New review task created! Tell Bob: "Address review in ${path.basename(taskFile)}"`);
        }
      } else {
        console.log(`PR #${pr.number}: No actionable feedback`);
      }
    }
    
  } catch (error) {
    console.error('Error checking reviews:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

// Start polling
console.log('🔍 GitHub Review Watcher Started');
console.log(`Repository: ${owner}/${repo}`);
console.log(`Polling every ${POLL_INTERVAL / 1000} seconds`);
console.log(`Task files will be created in: ${TASKS_DIR}`);
console.log('---');

// Initial check
checkForReviews();

// Poll regularly
setInterval(checkForReviews, POLL_INTERVAL);

// Made with Bob
