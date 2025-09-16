const express = require('express');
const cors = require('cors');

// Create multiple app instances for different ports
const mainApp = express();
const agenticApp = express();
const finetuneApp = express();

// Enable CORS for all apps
const corsOptions = {
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

[mainApp, agenticApp, finetuneApp].forEach(app => {
  app.use(cors(corsOptions));
  app.use(express.json());
});

// Mock MCP services data
const mockServices = [
  {
    name: 'claude-flow',
    status: 'running',
    port: 4001,
    health: 'healthy',
    tools: ['swarm_init', 'agent_spawn', 'memory_usage'],
    description: 'Swarm coordination and orchestration'
  },
  {
    name: 'enhanced-memory-mcp',
    status: 'running',
    port: 4002,
    health: 'healthy',
    tools: ['create_entities', 'search_nodes', 'get_memory_status'],
    description: 'Knowledge graph and memory management'
  },
  {
    name: 'voice-mode',
    status: 'running',
    port: 4003,
    health: 'healthy',
    tools: ['converse', 'voice_status', 'service'],
    description: 'Voice conversations and TTS/STT'
  },
  {
    name: 'task-manager-mcp',
    status: 'running',
    port: 4004,
    health: 'healthy',
    tools: ['create_task', 'prioritize_tasks', 'get_task_status'],
    description: 'AI-powered task management'
  },
  {
    name: 'quality-assurance-mcp',
    status: 'running',
    port: 4005,
    health: 'healthy',
    tools: ['create_test_case', 'run_tests', 'setup_test_automation'],
    description: 'Quality gates and testing'
  },
  {
    name: 'crypto-investment-mcp',
    status: 'stopped',
    port: 4006,
    health: 'unhealthy',
    tools: ['predict_price_movements', 'optimize_portfolio'],
    description: 'Crypto AI predictions'
  }
];

// Main App (Port 8000) - Core API endpoints
mainApp.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

mainApp.get('/api/dashboard/stats', (req, res) => {
  res.json({
    total_agents: { total: 12, active: 5 },
    process_flows: { total: 8, active: 3 },
    finetune_configs: { total: 15, active: 7 },
    dataset_configs: { total: 10, active: 4 },
    timestamp: new Date().toISOString()
  });
});

mainApp.get('/api/dashboard/chart-data', (req, res) => {
  res.json({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Tasks Completed',
      data: [12, 19, 8, 15, 22, 10, 14]
    }],
    timestamp: new Date().toISOString()
  });
});

mainApp.get('/api/mcp/services', (req, res) => {
  res.json(mockServices);
});

mainApp.get('/api/mcp/metrics', (req, res) => {
  res.json({
    totalServers: mockServices.length,
    activeServers: mockServices.filter(s => s.status === 'running').length,
    cpuUsage: Math.random() * 100,
    memoryUsage: Math.random() * 100,
    networkLatency: Math.random() * 50,
    timestamp: new Date().toISOString()
  });
});

mainApp.get('/api/mcp/health', (req, res) => {
  res.json({
    overall: 'healthy',
    services: mockServices.map(s => ({
      name: s.name,
      status: s.health,
      lastCheck: new Date().toISOString()
    }))
  });
});

mainApp.post('/api/mcp/execute', (req, res) => {
  const { service, tool, params } = req.body;
  res.json({
    success: true,
    result: `Executed ${tool} on ${service} with params: ${JSON.stringify(params)}`,
    timestamp: new Date().toISOString()
  });
});

mainApp.get('/ws/mcp', (req, res) => {
  res.status(501).json({ error: 'WebSocket not implemented in mock server' });
});

// Agentic Workflow App (Port 8100)
agenticApp.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'agentic-workflow', timestamp: new Date().toISOString() });
});

// ===== PERSONA LAB INTEGRATION API =====
agenticApp.get('/personas', (req, res) => {
  res.json({
    success: true,
    personas: [
      {
        id: "persona_1",
        name: "Sarah Chen",
        occupation: "UX Designer",
        age: 28,
        location: "San Francisco, CA",
        personality_traits: ["creative", "analytical", "empathetic"],
        interests: ["design systems", "user research", "sustainability"],
        pain_points: ["tool fragmentation", "stakeholder alignment"],
        goals: ["build impactful products", "mentor junior designers"],
        status: "active"
      },
      {
        id: "persona_2", 
        name: "Marcus Johnson",
        occupation: "Product Manager",
        age: 34,
        location: "New York, NY",
        personality_traits: ["strategic", "collaborative", "data-driven"],
        interests: ["product analytics", "user behavior", "market research"],
        pain_points: ["resource constraints", "competing priorities"],
        goals: ["drive product growth", "optimize user experience"],
        status: "active"
      },
      {
        id: "persona_3",
        name: "Elena Rodriguez",
        occupation: "Marketing Director",
        age: 31,
        location: "Austin, TX",
        personality_traits: ["innovative", "results-oriented", "communicative"],
        interests: ["digital marketing", "brand strategy", "customer insights"],
        pain_points: ["attribution challenges", "channel optimization"],
        goals: ["increase brand awareness", "improve conversion rates"],
        status: "active"
      }
    ],
    total: 3
  });
});

agenticApp.get('/personas/:id', (req, res) => {
  const personaId = req.params.id;
  const personas = {
    "persona_1": {
      id: "persona_1",
      name: "Sarah Chen",
      occupation: "UX Designer",
      age: 28,
      location: "San Francisco, CA",
      personality_traits: ["creative", "analytical", "empathetic"],
      interests: ["design systems", "user research", "sustainability"],
      pain_points: ["tool fragmentation", "stakeholder alignment"],
      goals: ["build impactful products", "mentor junior designers"],
      preferred_communication_style: "casual",
      buying_behavior: "research-driven",
      technology_comfort: "expert",
      income_level: "upper-middle",
      education_level: "graduate",
      values: ["innovation", "sustainability", "collaboration"],
      shopping_preferences: ["online research", "peer reviews", "eco-friendly"],
      media_consumption: ["design blogs", "linkedin", "podcasts"],
      created_at: "2024-01-01T00:00:00Z",
      status: "active"
    }
  };
  
  const persona = personas[personaId];
  if (persona) {
    res.json({ success: true, persona });
  } else {
    res.status(404).json({ success: false, error: "Persona not found" });
  }
});

agenticApp.post('/personas', (req, res) => {
  const personaData = req.body;
  res.json({
    success: true,
    persona: {
      id: `persona_${Date.now()}`,
      ...personaData,
      created_at: new Date().toISOString(),
      status: "active"
    },
    message: "Persona created successfully"
  });
});

agenticApp.put('/personas/:id', (req, res) => {
  const personaId = req.params.id;
  const personaData = req.body;
  res.json({
    success: true,
    persona: {
      id: personaId,
      ...personaData,
      updated_at: new Date().toISOString(),
      status: 'active'
    },
    message: "Persona updated successfully"
  });
});

agenticApp.get('/experiments', (req, res) => {
  res.json({
    success: true,
    experiments: [
      {
        id: "exp_1",
        name: "SaaS Product Launch Test",
        description: "Test messaging for new project management tool",
        hypothesis: "Technical personas will respond better to feature-focused messaging",
        status: "completed",
        persona_count: 3,
        scenario_count: 2,
        created_at: "2024-01-10T00:00:00Z",
        completed_at: "2024-01-10T02:30:00Z"
      },
      {
        id: "exp_2", 
        name: "Mobile App UX Testing",
        description: "Evaluate user experience for fitness app concept",
        hypothesis: "Health-conscious personas prefer simple, goal-oriented interfaces",
        status: "running",
        persona_count: 5,
        scenario_count: 4,
        created_at: "2024-01-12T00:00:00Z"
      },
      {
        id: "exp_3",
        name: "Pricing Strategy Analysis", 
        description: "Test price sensitivity across different persona segments",
        hypothesis: "Budget-conscious personas show higher price sensitivity",
        status: "draft",
        persona_count: 0,
        scenario_count: 3,
        created_at: "2024-01-14T00:00:00Z"
      }
    ],
    total: 3
  });
});

agenticApp.get('/experiments/:id', (req, res) => {
  const expId = req.params.id;
  res.json({
    success: true,
    experiment: {
      id: expId,
      name: "SaaS Product Launch Test",
      description: "Test messaging for new project management tool",
      hypothesis: "Technical personas will respond better to feature-focused messaging", 
      status: "completed",
      persona_ids: ["persona_1", "persona_2", "persona_3"],
      test_scenarios: [
        {
          type: "marketing_researcher",
          prompt: "What's your first impression of ProjectHub - a tool that uses AI to automatically organize your tasks?",
          product: "ProjectHub SaaS"
        },
        {
          type: "product_tester", 
          prompt: "Would you pay $29/month for an AI project management tool?",
          product: "ProjectHub SaaS"
        }
      ],
      results: {
        responses: [
          { persona: "Sarah Chen", scenario: 1, response: "As a UX designer, I'm intrigued by AI organization but concerned about transparency..." },
          { persona: "Marcus Johnson", scenario: 1, response: "From a product perspective, AI task organization could solve real pain points..." },
          { persona: "Elena Rodriguez", scenario: 1, response: "For marketing teams, this could streamline campaign planning..." }
        ],
        insights: [
          "Technical personas responded positively to AI features",
          "Price sensitivity varies by role and company size",
          "UX professionals emphasized need for transparency"
        ]
      },
      created_at: "2024-01-10T00:00:00Z",
      completed_at: "2024-01-10T02:30:00Z"
    }
  });
});

agenticApp.post('/experiments', (req, res) => {
  const experimentData = req.body;
  res.json({
    success: true,
    experiment: {
      id: `exp_${Date.now()}`,
      ...experimentData,
      status: "draft",
      created_at: new Date().toISOString()
    },
    message: "Experiment created successfully"
  });
});

agenticApp.post('/experiments/:id/run', (req, res) => {
  const expId = req.params.id;
  res.json({
    success: true,
    experiment_id: expId,
    status: "running", 
    message: "Experiment started successfully",
    estimated_duration: "5-10 minutes"
  });
});

agenticApp.get('/experiments/:id/results', (req, res) => {
  const expId = req.params.id;
  res.json({
    success: true,
    experiment_id: expId,
    results: {
      scenario_responses: [
        {
          scenario: "AI task organization impression",
          responses: [
            { persona: "Sarah Chen", sentiment: "curious", engagement: 8, key_points: ["transparency concerns", "UX potential"] },
            { persona: "Marcus Johnson", sentiment: "optimistic", engagement: 9, key_points: ["efficiency gains", "adoption challenges"] },
            { persona: "Elena Rodriguez", sentiment: "interested", engagement: 7, key_points: ["marketing applications", "team collaboration"] }
          ]
        }
      ],
      analysis: {
        overall_sentiment: "positive",
        engagement_score: 8.0,
        key_insights: [
          "Technical personas show strong interest in AI features",
          "Transparency and control are key concerns",
          "Price point needs segment-specific consideration"
        ],
        recommendations: [
          "Emphasize transparency in AI decision-making",
          "Create tiered pricing for different market segments", 
          "Develop use-case specific marketing messages"
        ]
      }
    }
  });
});

agenticApp.get('/focus-groups', (req, res) => {
  res.json({
    success: true,
    focus_groups: [
      {
        id: "fg_1",
        topic: "Remote work productivity tools",
        participants: ["Sarah Chen", "Marcus Johnson", "Elena Rodriguez"],
        status: "completed",
        rounds: 3,
        created_at: "2024-01-11T00:00:00Z",
        completed_at: "2024-01-11T01:45:00Z"
      },
      {
        id: "fg_2",
        topic: "Sustainable packaging preferences",
        participants: ["Sarah Chen", "Elena Rodriguez"],
        status: "running",
        rounds: 2,
        created_at: "2024-01-13T00:00:00Z"
      }
    ],
    total: 2
  });
});

agenticApp.post('/focus-groups', (req, res) => {
  const focusGroupData = req.body;
  res.json({
    success: true,
    focus_group: {
      id: `fg_${Date.now()}`,
      ...focusGroupData,
      status: "draft",
      created_at: new Date().toISOString()
    },
    message: "Focus group created successfully"
  });
});

agenticApp.put('/focus-groups/:id', (req, res) => {
  const focusGroupId = req.params.id;
  const focusGroupData = req.body;
  res.json({
    success: true,
    focus_group: {
      id: focusGroupId,
      ...focusGroupData,
      updated_at: new Date().toISOString(),
      status: 'draft'
    },
    message: "Focus group updated successfully"
  });
});

// ===== WORKFLOW SERVICES API =====
agenticApp.get('/workflows', (req, res) => {
  res.json([
    { id: 1, name: 'Data Processing', status: 'active', lastRun: new Date().toISOString() },
    { id: 2, name: 'Model Training', status: 'completed', lastRun: new Date().toISOString() }
  ]);
});

agenticApp.get('/workflows/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'Sample Workflow',
    status: 'active',
    steps: ['Initialize', 'Process', 'Complete'],
    timestamp: new Date().toISOString()
  });
});

agenticApp.post('/workflows/execute', (req, res) => {
  res.json({
    success: true,
    workflowId: Math.floor(Math.random() * 1000),
    status: 'started',
    timestamp: new Date().toISOString()
  });
});

agenticApp.post('/workflows/train', (req, res) => {
  res.json({
    success: true,
    trainingId: Math.floor(Math.random() * 1000),
    status: 'training_started',
    timestamp: new Date().toISOString()
  });
});

agenticApp.get('/models', (req, res) => {
  res.json([
    { id: 1, name: 'GPT-4', status: 'available' },
    { id: 2, name: 'Claude-3', status: 'available' },
    { id: 3, name: 'Custom Model', status: 'training' }
  ]);
});

// Fine-tune App (Port 8400)
finetuneApp.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'fine-tune-api', timestamp: new Date().toISOString() });
});

// Start all servers with unique port numbers to avoid conflicts
const MAIN_PORT = 8000;
const AGENTIC_PORT = 9201;
const FINETUNE_PORT = 9202;

mainApp.listen(MAIN_PORT, () => {
  console.log(`Main API server running on http://localhost:${MAIN_PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /api/health');
  console.log('  GET  /api/mcp/services');
  console.log('  GET  /api/mcp/metrics');
  console.log('  GET  /api/mcp/health');
  console.log('  POST /api/mcp/execute');
});

agenticApp.listen(AGENTIC_PORT, () => {
  console.log(`Agentic Workflow server running on http://localhost:${AGENTIC_PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /workflows');
  console.log('  POST /workflows/execute');
});

finetuneApp.listen(FINETUNE_PORT, () => {
  console.log(`Fine-tune API server running on http://localhost:${FINETUNE_PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /health');
});