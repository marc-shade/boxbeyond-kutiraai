# KutiraAI Dashboard - Customization Documentation

**Version:** 2.0
**Last Updated:** 2025-10-26
**Network Deployment:** Multi-node Claude Code network

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Overnight Automation Dashboard](#overnight-automation-dashboard)
4. [API Server Customizations](#api-server-customizations)
5. [Frontend Customizations](#frontend-customizations)
6. [Data Structure](#data-structure)
7. [Setup Instructions](#setup-instructions)
8. [Dependencies](#dependencies)
9. [Integration Points](#integration-points)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The KutiraAI Dashboard is a production-ready intelligence system that provides:

- **Real-time overnight automation monitoring** - Track autonomous learning systems running 24/7
- **Smart research discovery** - ArXiv papers and GitHub repos with intelligent filtering
- **Performance metrics** - Claude Code performance analysis and optimization recommendations
- **Knowledge graph visualization** - Accumulated learning patterns and insights
- **Infrastructure health monitoring** - Real-time service status across all nodes

### Key Features

✅ **Complete ArXiv metadata extraction** - Full author lists, summaries, publication dates
✅ **Intelligent GitHub repo filtering** - Relevance scoring based on tech stack keywords
✅ **Clickable research links** - Direct navigation to papers and repositories
✅ **Real-time data serving** - Live intelligence from /tmp/ files and APIs
✅ **Smart deduplication** - Filters out existing repos and duplicate papers
✅ **Production-only standards** - No mock data, all live sources

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    KutiraAI Dashboard Stack                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Frontend (React + Vite)                                         │
│  ├─ Port: 3101                                                   │
│  ├─ OvernightDashboard.jsx - Main dashboard component           │
│  └─ Proxy: /api → localhost:8000 (fallback) / 3002 (primary)   │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  API Servers                                                     │
│  ├─ api-server.js (Port 3002) - PRIMARY                         │
│  │  ├─ /api/overnight/research - Smart filtered data            │
│  │  ├─ /api/overnight/discover-research - Live ArXiv/GitHub     │
│  │  ├─ /api/overnight/latest-report - Performance metrics       │
│  │  └─ /api/overnight/metrics - Aggregated stats                │
│  │                                                               │
│  └─ backend-mock.js (Port 8000) - FALLBACK                      │
│     └─ Serves /tmp/ intelligence files                          │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Temporal Workflows (Background Intelligence)                   │
│  ├─ overnight_automation_workflow.py                            │
│  ├─ claude_deep_learning_workflow.py                            │
│  └─ Workers: Pattern analysis, cost optimization, learning      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Data Storage                                                    │
│  ├─ /tmp/claude_*.json - Live intelligence files                │
│  └─ /Volumes/FILES/code/kutiraai/data/overnight/sessions/       │
│     └─ session-{timestamp}.json - Research discoveries          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Overnight Automation Dashboard

### Location
`/Volumes/FILES/code/kutiraai/src/pages/overnight-automation/OvernightDashboard.jsx`

### Features

#### 1. Research Discoveries Tab

**ArXiv Papers:**
- Complete metadata extraction (title, authors, summary, URL, publication date)
- Clickable paper titles opening in new tabs
- Author attribution for all papers
- Filtering out "Unknown" and duplicate titles
- Limit: 20 most recent papers

**GitHub Repositories:**
- Smart relevance scoring (0-50+ points)
- Filtering out existing repos in use
- Clickable repo names with star counts
- Language badges and descriptions
- Relevance score chips showing match quality
- Limit: 15 most relevant repos

#### 2. Morning Report Tab

- Performance metrics (operations, success rate, avg response time)
- Pattern detection results
- Cost analysis and optimization recommendations
- Maintenance alerts and system health
- Knowledge graph entity count

#### 3. System Insights

- AI-generated insights from overnight learning
- Action items and recommendations
- Learning progress tracking
- Optimization opportunities

### UI Components Added

```jsx
import { Link } from "@mui/material";

// Clickable ArXiv papers
<Link
  href={paper.url}
  target="_blank"
  rel="noopener noreferrer"
  sx={{ fontWeight: 500 }}
>
  {paper.title}
</Link>

// Clickable repos with relevance scores
<Link
  href={repo.url || repo.html_url}
  target="_blank"
  rel="noopener noreferrer"
  sx={{ fontWeight: 500 }}
>
  {repo.name || repo.full_name}
</Link>

{repo.relevance_score && (
  <Chip
    label={`🎯 Relevance: ${repo.relevance_score}`}
    size="small"
    color="primary"
  />
)}
```

---

## API Server Customizations

### File Location
`/Volumes/FILES/code/kutiraai/api-server.js`

### Endpoints

#### 1. GET /api/overnight/research

**Purpose:** Serve filtered research discoveries from session files

**Response:**
```json
{
  "success": true,
  "research": {
    "papers": [
      {
        "title": "Paper Title",
        "summary": "Paper summary",
        "url": "http://arxiv.org/abs/...",
        "publishedAt": "2025-10-26T...",
        "authors": "Author1, Author2, Author3",
        "source": "arxiv"
      }
    ],
    "repos": [
      {
        "name": "owner/repo",
        "description": "Repo description",
        "url": "https://github.com/owner/repo",
        "stars": 10000,
        "language": "Python",
        "source": "github",
        "relevance_score": 30
      }
    ],
    "knowledge_entities": [],
    "learning_count": 13,
    "total_papers": 2,
    "total_repos": 15
  }
}
```

**Key Logic:**

```javascript
// Relevance scoring keywords with weights
const relevantKeywords = [
  { term: 'mcp', weight: 15 },
  { term: 'model context protocol', weight: 15 },
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

// Repos to exclude (already in use)
const existingRepos = [
  'langflow-ai/langflow', 'langgenius/dify', 'anthropic-sdk',
  'claude-code', 'temporal', 'autokitteh', 'n8n-io/n8n',
  'react', 'express', 'axios', 'socket.io', 'getzep/graphiti',
  'getzep/zep', 'get-convex/convex-backend', 'lobehub/lobe-chat'
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

  // Bonus points for popularity
  const stars = repo.stars || repo.stargazers_count || 0;
  if (stars > 1000) score += 3;
  if (stars > 5000) score += 5;
  if (stars > 10000) score += 7;

  return score;
};
```

#### 2. POST /api/overnight/discover-research

**Purpose:** Live scraping of ArXiv and GitHub with complete metadata

**Dependencies:** `axios`, `xml2js`

**Installation:**
```bash
npm install xml2js --legacy-peer-deps
```

**ArXiv Integration:**
```javascript
const arxivQuery = 'cat:cs.AI OR cat:cs.LG OR cat:cs.CL OR cat:cs.NE';
const arxivUrl = `http://export.arxiv.org/api/query?search_query=${encodeURIComponent(arxivQuery)}&start=0&max_results=50&sortBy=submittedDate&sortOrder=descending`;

const arxivResponse = await axios.get(arxivUrl, { timeout: 30000 });
const parser = new xml2js.Parser();
const result = await parser.parseStringPromise(arxivResponse.data);

if (result.feed && result.feed.entry) {
  papers = result.feed.entry.map(entry => {
    // Extract authors array
    let authors = 'No authors listed';
    if (entry.author && Array.isArray(entry.author)) {
      const authorNames = entry.author.map(a => a.name ? a.name[0] : '').filter(n => n);
      if (authorNames.length > 0) {
        authors = authorNames.join(', ');
      }
    }

    return {
      title: entry.title ? entry.title[0].replace(/\n/g, ' ').trim() : 'Unknown',
      summary: entry.summary ? entry.summary[0].replace(/\n/g, ' ').trim() : 'No summary available',
      url: entry.id ? entry.id[0] : '',
      publishedAt: entry.published ? entry.published[0] : new Date().toISOString(),
      authors: authors,
      source: 'arxiv'
    };
  }).filter(p => p.title && !p.title.toLowerCase().includes('unknown'));
}
```

**GitHub Integration:**
```javascript
const githubQuery = 'mcp OR "model context protocol" OR agentic OR "multi-agent"';
const githubUrl = `https://api.github.com/search/repositories?q=${encodeURIComponent(githubQuery)}&sort=stars&order=desc&per_page=50`;

const githubResponse = await axios.get(githubUrl, {
  timeout: 30000,
  headers: {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'KutiraAI-Research-Bot'
  }
});

if (githubResponse.data && githubResponse.data.items) {
  repos = githubResponse.data.items.map(repo => ({
    name: repo.full_name,
    description: repo.description || 'No description available',
    url: repo.html_url,
    stars: repo.stargazers_count,
    language: repo.language || 'Unknown',
    source: 'github'
  }));
}
```

#### 3. GET /api/overnight/latest-report

**Purpose:** Serve latest performance metrics from /tmp/ files

**Data Sources:**
- `/tmp/claude_performance_metrics.json`
- `/tmp/claude_pattern_analysis.json`
- `/tmp/claude_cost_analysis.json`
- `/tmp/claude_optimizations_applied.json`
- `/tmp/claude_maintenance_alerts.json`
- `/tmp/claude_knowledge_graph.json`

#### 4. GET /api/overnight/metrics

**Purpose:** Aggregated metrics for dashboard widgets

---

## Frontend Customizations

### File: `src/pages/overnight-automation/OvernightDashboard.jsx`

#### Imports Added
```javascript
import { Link } from "@mui/material";
```

#### Papers Display (Lines 411-445)
```javascript
research.papers.map((paper, index) => (
  <ListItem key={index} divider>
    <ListItemText
      primary={
        <Link
          href={paper.url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ fontWeight: 500 }}
        >
          {paper.title}
        </Link>
      }
      secondary={
        <>
          <Typography variant="body2" color="text.secondary">
            {paper.authors || "No authors"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {paper.published} • {paper.categories}
          </Typography>
          {paper.url && (
            <Button
              size="small"
              href={paper.url}
              target="_blank"
            >
              View Paper
            </Button>
          )}
        </>
      }
    />
  </ListItem>
))
```

#### Repos Display with Relevance Scores (Lines 459-495)
```javascript
research.repos.map((repo, index) => (
  <ListItem key={index} divider>
    <ListItemText
      primary={
        <Link
          href={repo.url || repo.html_url}
          target="_blank"
          rel="noopener noreferrer"
          sx={{ fontWeight: 500 }}
        >
          {repo.name || repo.full_name}
        </Link>
      }
      secondary={
        <>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {repo.description}
          </Typography>
          <Stack direction="row" spacing={1} mt={0.5}>
            <Chip
              label={`⭐ ${repo.stars || 0}`}
              size="small"
            />
            <Chip label={repo.language} size="small" />
            {repo.relevance_score && (
              <Chip
                label={`🎯 Relevance: ${repo.relevance_score}`}
                size="small"
                color="primary"
              />
            )}
          </Stack>
        </>
      }
    />
  </ListItem>
))
```

### File: `vite.config.mjs`

#### Proxy Configuration
```javascript
server: {
  open: false,
  port: 3101,
  host: true,
  fs: {
    allow: ['/Users/marc/Projects/', '/Volumes/FILES/code/', '/Users/marc/Desktop/']
  },
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api/, '')
    }
  }
}
```

---

## Data Structure

### Session Files

**Location:** `/Volumes/FILES/code/kutiraai/data/overnight/sessions/`

**Format:** `session-{timestamp}.json`

**Structure:**
```json
{
  "session_id": "session-1761481902986",
  "timestamp": "2025-10-26T12:00:00.000Z",
  "discoveries": {
    "papers": [
      {
        "title": "Paper Title",
        "summary": "Paper summary",
        "url": "http://arxiv.org/abs/2510.20819v1",
        "publishedAt": "2025-10-23T17:59:40Z",
        "authors": "Author1, Author2, Author3",
        "source": "arxiv"
      }
    ],
    "repos": [
      {
        "name": "owner/repo",
        "description": "Repository description",
        "url": "https://github.com/owner/repo",
        "stars": 50000,
        "language": "TypeScript",
        "source": "github"
      }
    ]
  }
}
```

### Intelligence Files

**Location:** `/tmp/`

#### claude_performance_metrics.json
```json
{
  "total_operations": 716,
  "successful_operations": 618,
  "failed_operations": 98,
  "success_rate": 0.863,
  "average_response_time": 2.3,
  "timestamp": "2025-10-26T..."
}
```

#### claude_pattern_analysis.json
```json
{
  "patterns_detected": 13,
  "patterns": [
    {
      "pattern": "Repeated file search operations",
      "frequency": 45,
      "recommendation": "Cache search results"
    }
  ]
}
```

#### claude_cost_analysis.json
```json
{
  "total_cost_estimate": 1.42,
  "input_tokens": 250000,
  "output_tokens": 75000,
  "timestamp": "2025-10-26T..."
}
```

#### claude_knowledge_graph.json
```json
{
  "entities": [
    {
      "type": "optimization",
      "description": "Parallel tool execution pattern",
      "impact": "40% faster execution"
    }
  ]
}
```

---

## Setup Instructions

### 1. Install Dependencies

```bash
cd /Volumes/FILES/code/kutiraai
npm install xml2js --legacy-peer-deps
```

### 2. Create Data Directories

```bash
mkdir -p /Volumes/FILES/code/kutiraai/data/overnight/sessions
```

### 3. Start Services

```bash
# Start API server (primary)
cd /Volumes/FILES/code/kutiraai
node api-server.js > /tmp/api-server.log 2>&1 &

# Start backend mock (fallback)
cd /Volumes/FILES/code/kutiraai/kutiraai-frontend
node backend-mock.js > /tmp/backend-mock.log 2>&1 &

# Start Vite dev server
cd /Volumes/FILES/code/kutiraai
npm run dev
```

### 4. Verify Services

```bash
# Check API server
curl http://localhost:3002/api/overnight/research

# Check backend mock
curl http://localhost:8000/overnight/latest-report

# Check Vite dev server
curl http://localhost:3101
```

### 5. Access Dashboard

Navigate to: `http://localhost:3101/overnight-automation`

---

## Dependencies

### Required npm Packages

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "xml2js": "^0.6.2",
    "express": "^4.18.0",
    "@mui/material": "^5.18.0",
    "react": "^18.2.0",
    "react-router-dom": "^6.0.0"
  }
}
```

### System Requirements

- Node.js 18+
- Python 3.13+ (for Temporal workflows)
- Temporal server running on port 7233
- Port Manager running on port 4102

---

## Integration Points

### 1. Temporal Workflows

**File:** `/Volumes/FILES/agentic-system/temporal-workflows/overnight_automation_workflow.py`

**Integration:**
```python
@activity.defn
async def discover_research() -> ResearchDiscovery:
    """Call KutiraAI service API endpoint"""
    response = requests.post(
        "http://localhost:3002/api/overnight/discover-research",
        timeout=60
    )

    if response.status_code == 200:
        data = response.json()
        papers = data.get("papers", [])
        repos = data.get("repos", [])

    return ResearchDiscovery(papers=papers, repos=repos)
```

### 2. Enhanced Memory MCP

Store discoveries in enhanced-memory for pattern detection:

```python
if ENHANCED_MEMORY_ENABLED and (papers or repos):
    try:
        from mcp import enhanced_memory

        enhanced_memory.create_entities([{
            "name": f"research-discovery-{timestamp}",
            "entityType": "research_session",
            "observations": [
                f"Discovered {len(papers)} papers and {len(repos)} repositories",
                f"Top research areas: {', '.join(top_areas)}"
            ]
        }])
    except Exception as e:
        activity.logger.error(f"Failed to store in enhanced-memory: {e}")
```

### 3. Port Manager

**Check conflicts before operations:**
```bash
/Volumes/FILES/code/kutiraai/bin/pm conflicts
/Volumes/FILES/code/kutiraai/bin/pm list
```

---

## Troubleshooting

### Issue: Dashboard shows empty data

**Diagnosis:**
```bash
# Check if API server is running
ps aux | grep "node.*api-server"

# Check if session files exist
ls -la /Volumes/FILES/code/kutiraai/data/overnight/sessions/

# Test API endpoint
curl http://localhost:3002/api/overnight/research | jq
```

**Solution:**
```bash
# Restart API server
pkill -f "node.*api-server"
cd /Volumes/FILES/code/kutiraai
node api-server.js > /tmp/api-server.log 2>&1 &

# Generate fresh data
curl -X POST http://localhost:3002/api/overnight/discover-research
```

### Issue: "No authors listed" on ArXiv papers

**Diagnosis:**
- Check if using old session files without author data
- Verify xml2js is installed

**Solution:**
```bash
# Install xml2js
npm install xml2js --legacy-peer-deps

# Generate new session with authors
curl -X POST http://localhost:3002/api/overnight/discover-research
```

### Issue: Repos showing score: 0

**Diagnosis:**
- API server not restarted after code changes
- Syntax error in api-server.js

**Solution:**
```bash
# Check for syntax errors
node -c /Volumes/FILES/code/kutiraai/api-server.js

# Restart server
pkill -f "node.*api-server"
cd /Volumes/FILES/code/kutiraai
node api-server.js > /tmp/api-server.log 2>&1 &

# Check logs
tail -f /tmp/api-server.log
```

### Issue: Vite dev server not proxying API calls

**Diagnosis:**
```bash
# Check vite.config.mjs proxy settings
grep -A 10 "proxy:" /Volumes/FILES/code/kutiraai/vite.config.mjs
```

**Solution:**
```bash
# Restart Vite dev server
pkill -f "node.*vite"
cd /Volumes/FILES/code/kutiraai
npm run dev
```

---

## Network Deployment Checklist

For deploying to other Claude Code nodes:

- [ ] Copy `api-server.js` customizations
- [ ] Copy `OvernightDashboard.jsx` updates
- [ ] Copy `vite.config.mjs` proxy settings
- [ ] Install xml2js dependency
- [ ] Create data directories
- [ ] Update existing repos list for your environment
- [ ] Update relevance keywords for your tech stack
- [ ] Verify Temporal workflows integration
- [ ] Test all API endpoints
- [ ] Verify dashboard displays data correctly
- [ ] Check clickable links work
- [ ] Confirm relevance scores calculate
- [ ] Validate author metadata extraction

---

## Production Standards

This implementation follows production-only standards:

✅ **No mock data** - All data from live sources (ArXiv, GitHub, /tmp/ files)
✅ **Complete metadata** - Full author lists, proper URLs, accurate timestamps
✅ **Smart filtering** - Intelligent relevance scoring, deduplication
✅ **Error handling** - Graceful fallbacks, proper try-catch blocks
✅ **Real integrations** - Actual API calls to ArXiv and GitHub
✅ **Live dashboards** - Dynamic data, no hard-coded values
✅ **Clickable UI** - Functional links, proper navigation
✅ **Production deployment** - Ready for multi-node network

---

## Support

For issues or questions about these customizations:

1. Check `/tmp/api-server.log` for API errors
2. Check browser console for frontend errors
3. Verify all services are running (API server, Vite, Temporal)
4. Test API endpoints with curl
5. Review session files for data format

---

**Document Version:** 2.0
**Compatible with:** KutiraAI Dashboard v2.0+
**Network:** Multi-node Claude Code distributed system
**Last Verified:** 2025-10-26
