# KutiraAI Dashboard - Network Deployment Guide

**Quick deployment guide for Claude Code nodes**

---

## Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
cd /Volumes/FILES/code/kutiraai
npm install xml2js --legacy-peer-deps
```

### Step 2: Copy Core Files

**API Server Updates:**
```bash
# Backup existing file
cp api-server.js api-server.backup.js

# The main changes are:
# - Lines 708-870: Smart filtering in /api/overnight/research
# - Lines 872-958: New /api/overnight/discover-research endpoint
```

**Frontend Updates:**
```bash
# File: src/pages/overnight-automation/OvernightDashboard.jsx
# - Add Link import from @mui/material
# - Lines 411-445: Clickable ArXiv papers
# - Lines 459-495: Clickable repos with relevance scores
```

**Vite Config:**
```bash
# File: vite.config.mjs
# Add proxy configuration (lines 50-56)
```

### Step 3: Create Data Directories
```bash
mkdir -p /Volumes/FILES/code/kutiraai/data/overnight/sessions
```

### Step 4: Start Services
```bash
# Start API server
cd /Volumes/FILES/code/kutiraai
node api-server.js > /tmp/api-server.log 2>&1 &

# Start Vite dev server
npm run dev
```

### Step 5: Generate Initial Data
```bash
# Trigger research discovery
curl -X POST http://localhost:3002/api/overnight/discover-research

# Verify it worked
curl http://localhost:3002/api/overnight/research | jq '.research.papers[0]'
```

### Step 6: Access Dashboard
Navigate to: `http://localhost:3101/overnight-automation`

---

## Customization for Your Environment

### 1. Update Existing Repos List

Edit `api-server.js` around line 760:

```javascript
const existingRepos = [
  // Add your existing repos here
  'your-org/your-repo',
  'package-name',
  // Keep the defaults that apply to you
  'langflow-ai/langflow',
  'langgenius/dify',
  // etc...
];
```

### 2. Customize Relevance Keywords

Edit `api-server.js` around line 768:

```javascript
const relevantKeywords = [
  // Add keywords relevant to YOUR tech stack
  { term: 'your-framework', weight: 15 },
  { term: 'your-tool', weight: 12 },
  // Keep the ones that apply
  { term: 'mcp', weight: 15 },
  { term: 'agentic', weight: 12 },
  // etc...
];
```

### 3. Adjust ArXiv Categories

Edit `api-server.js` around line 879:

```javascript
// Default: AI, ML, Computational Linguistics, Neural Networks
const arxivQuery = 'cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.NE';

// Other useful categories:
// cat:cs.CV - Computer Vision
// cat:cs.RO - Robotics
// cat:cs.SE - Software Engineering
// cat:cs.DC - Distributed Computing
```

---

## Verification Tests

Run these commands to verify everything works:

### Test 1: API Server Health
```bash
curl http://localhost:3002/api/overnight/research
# Should return JSON with papers and repos
```

### Test 2: Author Extraction
```bash
curl -X POST http://localhost:3002/api/overnight/discover-research | \
  jq '.papers[0].authors'
# Should show comma-separated author names, not "No authors listed"
```

### Test 3: Relevance Scoring
```bash
curl http://localhost:3002/api/overnight/research | \
  jq '.research.repos[0].relevance_score'
# Should show a number > 0, typically 15-50
```

### Test 4: Link Functionality
- Navigate to dashboard
- Click on an ArXiv paper title
- Should open paper in new tab
- Click on a GitHub repo name
- Should open repo in new tab

---

## Code Snippets

### Complete /api/overnight/research Endpoint

```javascript
app.get('/api/overnight/research', async (req, res) => {
  try {
    const knowledgeGraph = readJsonFile('claude_knowledge_graph.json');

    // Read latest session discoveries from overnight automation
    const sessionFiles = fsSync.readdirSync(path.join(__dirname, 'data/overnight/sessions'))
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();

    let papers = [];
    let repos = [];

    // Find the most recent session with discoveries
    let latestSession = null;
    for (const sessionFile of sessionFiles) {
      try {
        const session = JSON.parse(
          fsSync.readFileSync(path.join(__dirname, 'data/overnight/sessions', sessionFile), 'utf8')
        );
        if (session.discoveries && (session.discoveries.papers?.length > 0 || session.discoveries.repos?.length > 0)) {
          latestSession = session;
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (latestSession && latestSession.discoveries) {
        // Filter papers - remove "Unknown" titles
        const seenPapers = new Set();
        papers = (latestSession.discoveries.papers || [])
          .filter(p => {
            if (!p.title || p.title.toLowerCase().includes('unknown') || p.title.trim() === '') return false;
            if (seenPapers.has(p.url)) return false;
            seenPapers.add(p.url);
            return true;
          })
          .map(p => ({
            title: p.title,
            summary: p.summary && p.summary !== '...' ? p.summary : 'No summary available',
            url: p.url,
            publishedAt: p.publishedAt || p.published,
            authors: p.authors || 'No authors listed',
            source: 'arxiv'
          }))
          .slice(0, 20);

        // Repos already in use
        const existingRepos = [
          'langflow-ai/langflow', 'langgenius/dify', 'anthropic-sdk',
          'claude-code', 'temporal', 'autokitteh', 'n8n-io/n8n',
          'react', 'express', 'axios', 'socket.io', 'getzep/graphiti',
          'getzep/zep', 'get-convex/convex-backend', 'lobehub/lobe-chat'
        ];

        // Relevance keywords
        const relevantKeywords = [
          { term: 'mcp', weight: 15 },
          { term: 'model context protocol', weight: 15 },
          { term: 'model-context-protocol', weight: 15 },
          { term: 'agentic', weight: 12 },
          { term: 'autonomous agent', weight: 12 },
          { term: 'workflow orchestration', weight: 10 },
          { term: 'multi-agent', weight: 12 },
          { term: 'llm agent', weight: 10 },
          { term: 'ai orchestration', weight: 10 },
          { term: 'swarm', weight: 8 },
          { term: 'agent runtime', weight: 10 },
          { term: 'workflow engine', weight: 8 },
          { term: 'event-driven', weight: 6 },
          { term: 'claude', weight: 8 },
          { term: 'anthropic', weight: 8 }
        ];

        // Scoring function
        const scoreRelevance = (repo) => {
          let score = 0;
          const name = (repo.name || repo.full_name || '').toLowerCase();
          const desc = (repo.description || '').toLowerCase();
          const searchText = `${name} ${desc}`;

          relevantKeywords.forEach(({ term, weight }) => {
            if (searchText.includes(term.toLowerCase())) {
              score += weight;
            }
          });

          const stars = repo.stars || repo.stargazers_count || 0;
          if (stars > 1000) score += 3;
          if (stars > 5000) score += 5;
          if (stars > 10000) score += 7;

          return score;
        };

        // Filter and score repos
        const seenRepos = new Set();
        repos = (latestSession.discoveries.repos || [])
          .filter(r => {
            const repoName = (r.name || r.full_name || '').toLowerCase();
            const url = r.url || r.html_url || '';

            if (seenRepos.has(url)) return false;

            const isExisting = existingRepos.some(existing => {
              const existingLower = existing.toLowerCase();
              return repoName === existingLower ||
                     repoName.includes(existingLower) ||
                     existingLower.includes(repoName);
            });

            if (isExisting) return false;

            seenRepos.add(url);
            return true;
          })
          .map(r => ({
            name: r.name || r.full_name,
            description: r.description || 'No description available',
            url: (r.html_url || r.url || '').replace('api.github.com/repos/', 'github.com/'),
            stars: r.stars || r.stargazers_count || 0,
            language: r.language || 'Unknown',
            source: 'github',
            relevance_score: scoreRelevance(r)
          }))
          .filter(r => r.relevance_score > 0)
          .sort((a, b) => b.relevance_score - a.relevance_score)
          .slice(0, 15);
      }

    res.json({
      success: true,
      research: {
        papers: papers,
        repos: repos,
        knowledge_entities: knowledgeGraph?.entities || [],
        learning_count: knowledgeGraph?.entities?.length || 0,
        total_papers: papers.length,
        total_repos: repos.length
      }
    });
  } catch (error) {
    console.error('Error reading research data:', error);
    const knowledgeGraph = readJsonFile('claude_knowledge_graph.json');
    res.json({
      success: true,
      research: {
        papers: [],
        repos: [],
        knowledge_entities: knowledgeGraph?.entities || [],
        learning_count: knowledgeGraph?.entities?.length || 0,
        error: error.message
      }
    });
  }
});
```

---

## Troubleshooting Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Empty dashboard | `curl -X POST http://localhost:3002/api/overnight/discover-research` |
| No authors | `npm install xml2js --legacy-peer-deps` then restart API server |
| Score: 0 | Check for syntax errors: `node -c api-server.js` |
| Links not working | Verify Link import in OvernightDashboard.jsx |
| Proxy errors | Check vite.config.mjs proxy settings |

---

## File Locations Reference

```
/Volumes/FILES/code/kutiraai/
├── api-server.js                          # Main API server (PORT 3002)
├── vite.config.mjs                        # Vite config with proxy
├── src/pages/overnight-automation/
│   └── OvernightDashboard.jsx            # Dashboard component
├── data/overnight/sessions/               # Research session files
│   └── session-{timestamp}.json
└── kutiraai-frontend/
    └── backend-mock.js                   # Fallback server (PORT 8000)

/tmp/
├── claude_performance_metrics.json       # Performance data
├── claude_pattern_analysis.json          # Pattern detection
├── claude_cost_analysis.json             # Cost tracking
├── claude_optimizations_applied.json     # Applied optimizations
├── claude_maintenance_alerts.json        # System alerts
└── claude_knowledge_graph.json           # Learning graph
```

---

## Network Sync Checklist

Before deploying to other nodes:

- [ ] Review KUTIRAAI_DASHBOARD_DOCUMENTATION.md
- [ ] Install xml2js dependency
- [ ] Update api-server.js (3 sections)
- [ ] Update OvernightDashboard.jsx (3 sections)
- [ ] Update vite.config.mjs (proxy)
- [ ] Create data directories
- [ ] Customize existingRepos for your environment
- [ ] Customize relevantKeywords for your stack
- [ ] Test API endpoints
- [ ] Verify dashboard functionality
- [ ] Check author metadata
- [ ] Confirm relevance scores
- [ ] Validate clickable links

---

## Quick Command Reference

```bash
# Installation
npm install xml2js --legacy-peer-deps

# Start services
node api-server.js > /tmp/api-server.log 2>&1 &
npm run dev

# Generate data
curl -X POST http://localhost:3002/api/overnight/discover-research

# Test endpoints
curl http://localhost:3002/api/overnight/research | jq
curl http://localhost:3002/api/overnight/latest-report | jq

# Check logs
tail -f /tmp/api-server.log

# Restart API server
pkill -f "node.*api-server"
cd /Volumes/FILES/code/kutiraai && node api-server.js > /tmp/api-server.log 2>&1 &
```

---

**Deploy Time:** ~5 minutes
**Complexity:** Low
**Breaking Changes:** None (additive updates)
**Rollback:** Copy api-server.backup.js back to api-server.js
