# Bob SDLC Demo

**AI-powered end-to-end software development automation**

## What It Does

Bob automates the complete SDLC workflow:
1. Fetches Jira tickets assigned to you
2. Implements features with full testing
3. Creates GitHub PRs with detailed descriptions
4. Responds to PR review comments
5. Updates Jira status throughout

**One command:** `check for new tasks and work on them`

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      Bob AI IDE                          │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │         Custom SDLC Automation Mode            │    │
│  │  • Fetches Jira tickets via MCP                │    │
│  │  • Implements & tests features                 │    │
│  │  • Creates PRs via GitHub MCP                  │    │
│  │  • Handles PR reviews automatically            │    │
│  └────────────────────────────────────────────────┘    │
│                         ↕                                │
│  ┌────────────────────────────────────────────────┐    │
│  │              MCP Servers                       │    │
│  │  • Jira MCP (ticket management)                │    │
│  │  • GitHub MCP (PR operations)                  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              External Services                           │
│  ┌──────────────────┐    ┌──────────────────────────┐  │
│  │   Jira Cloud     │    │   GitHub                 │  │
│  │   (Tickets)      │    │   (PRs & Reviews)        │  │
│  └──────────────────┘    └──────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↕
┌─────────────────────────────────────────────────────────┐
│              Demo Application                            │
│  Frontend (React) ←→ Backend (Node.js) ←→ SQLite        │
└─────────────────────────────────────────────────────────┘
```

## Setup (5 Minutes)

### 1. Clone & Install
```bash
git clone <your-repo-url>
cd jiratodev
chmod +x setup.sh
./setup.sh
```

### 2. Configure `.env`
```env
# Jira
JIRA_DOMAIN=your-domain.atlassian.net
JIRA_EMAIL=your-email@example.com
JIRA_API_TOKEN=<get-from-jira>
JIRA_PROJECT_KEY=YOUR-PROJECT
JIRA_ASSIGNEE=bobdev

# GitHub
GITHUB_TOKEN=<get-from-github>
GITHUB_OWNER=your-username
GITHUB_REPO=your-repo-name
GITHUB_BASE_URL=https://api.github.com
```

**Get Credentials:**
- **Jira Token**: https://id.atlassian.com/manage-profile/security/api-tokens
- **GitHub Token**: Settings → Developer settings → Personal access tokens (needs `repo` scope)

### 3. Start Application

**Option 1: Manual Start**
```bash
npm run dev
```
This command starts both frontend (port 3000) and backend (port 3001) concurrently.

**Option 2: Ask Bob**
Simply ask Bob in the IDE:
```
"Start the application"
```
Bob will automatically run the development servers for you.

## Usage

### Run Full SDLC Workflow
1. Create Jira ticket assigned to `bobdev`
2. In Bob IDE: `check for new tasks and work on them`
3. Bob handles everything automatically

### Handle PR Reviews
1. Add review comments on GitHub PR
2. In Bob IDE: `check for new tasks and work on them`
3. Bob addresses feedback and updates PR

## Custom SDLC Mode

Located in `.bobmodes`, this custom mode:
- **Fetches** Jira tickets via `jira_get_assigned_tickets` MCP tool
- **Implements** features using code editing tools
- **Tests** in browser before creating PR
- **Creates** PRs via `github_create_pr` MCP tool
- **Updates** Jira status via `jira_update_status` MCP tool
- **Responds** to PR reviews automatically

**Key Feature**: Fully automated workflow with zero manual intervention.

## Project Structure

```
jiratodev/
├── .bob/mcp.json          # MCP server config
├── .bobmodes              # Custom SDLC mode
├── frontend/              # React app
├── backend/               # Node.js API
├── mcp-servers/
│   ├── jira-server/       # Jira MCP integration
│   └── github-server/     # GitHub MCP integration
├── .env                   # Your credentials
└── setup.sh               # Setup script
```

## Troubleshooting

**Jira tickets not found?**
- Use exact Jira username in `JIRA_ASSIGNEE` (e.g., "bobdev" not "Bob Dev")
- Check MCP panel shows green status

**MCP tools not working?**
- Verify `.env` credentials
- Restart Bob IDE
- Check `.bob/mcp.json` paths

**Servers won't start?**
```bash
npm install
lsof -i :3000  # Check port 3000
lsof -i :3001  # Check port 3001
```

## Demo Tips

**Good First Tickets:**
- "Add search bar to Orders page"
- "Change button color to blue"
- "Add status filter dropdown"

**Best Practices:**
- Keep ticket descriptions clear
- Start with simple features
- Watch Jira status updates in real-time

## Reset Demo

**Option 1: Manual Reset**
```bash
# Revert changes and return to demo-dev
git checkout demo-dev
git pull origin demo-dev

# Delete feature branch locally
git branch -D feature/branch-name

# Delete feature branch remotely
git push origin --delete feature/branch-name

# Manually close PRs on GitHub
```

**Option 2: Ask Bob**
Simply ask Bob in the IDE:
```
"Revert the changes and delete the feature branch locally and remotely"
```
Bob will automatically handle the cleanup for you.

---

**Built to demonstrate AI-powered SDLC automation with Bob IDE**