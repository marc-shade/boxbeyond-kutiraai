// MCP Integration utility for AI Persona Lab
// This demonstrates how the Persona Lab interfaces with Claude Code's agent system

export class PersonaLabMCP {
  constructor() {
    this.serverUrl = 'http://localhost:9201'; // AI Persona Lab MCP server
    this.agentTools = [
      'persona_manager',
      'experiment_orchestrator', 
      'focus_group_moderator',
      'conversation_analyzer',
      'insight_generator'
    ];
    this.isConnected = false;
  }

  // Initialize MCP connection
  async initialize() {
    try {
      const response = await fetch(`${this.serverUrl}/health`);
      if (response.ok) {
        this.isConnected = true;
        console.log('✅ AI Persona Lab MCP connected');
        return true;
      }
    } catch (error) {
      console.log('⚠️ AI Persona Lab MCP not available - using mock data');
      this.isConnected = false;
      return false;
    }
  }

  // Spawn Claude Code agents for persona management
  async spawnPersonaAgent(personaData) {
    if (!this.isConnected) {
      return this.mockSpawnAgent('persona_manager', personaData);
    }

    try {
      const response = await fetch(`${this.serverUrl}/spawn-agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agent_type: 'persona_manager',
          task: 'manage_persona',
          persona: personaData,
          capabilities: [
            'personality_simulation',
            'behavioral_modeling',
            'response_generation',
            'context_awareness'
          ]
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to spawn persona agent:', error);
      return this.mockSpawnAgent('persona_manager', personaData);
    }
  }

  // Orchestrate marketing experiments using Claude Code swarm
  async orchestrateExperiment(experimentData) {
    if (!this.isConnected) {
      return this.mockOrchestateExperiment(experimentData);
    }

    try {
      const response = await fetch(`${this.serverUrl}/orchestrate-experiment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          experiment: experimentData,
          swarm_config: {
            topology: 'hierarchical',
            coordinator: 'experiment_orchestrator',
            participants: experimentData.target_personas.map(personaId => ({
              agent_type: 'persona_agent',
              persona_id: personaId,
              role: 'participant'
            }))
          }
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to orchestrate experiment:', error);
      return this.mockOrchestateExperiment(experimentData);
    }
  }

  // Run focus group sessions with AI persona agents
  async runFocusGroup(focusGroupData) {
    if (!this.isConnected) {
      return this.mockRunFocusGroup(focusGroupData);
    }

    try {
      const response = await fetch(`${this.serverUrl}/run-focus-group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          focus_group: focusGroupData,
          moderation: {
            style: focusGroupData.moderation_style,
            questions: focusGroupData.questions,
            rounds: focusGroupData.discussion_rounds
          },
          participants: focusGroupData.participant_personas.map(personaId => ({
            agent_type: 'focus_group_participant',
            persona_id: personaId,
            voice_enabled: focusGroupData.voice_enabled
          }))
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to run focus group:', error);
      return this.mockRunFocusGroup(focusGroupData);
    }
  }

  // Analyze conversation data with Claude Code agents
  async analyzeConversation(conversationData) {
    if (!this.isConnected) {
      return this.mockAnalyzeConversation(conversationData);
    }

    try {
      const response = await fetch(`${this.serverUrl}/analyze-conversation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversation: conversationData,
          analysis_types: [
            'sentiment_analysis',
            'theme_extraction',
            'persona_consistency',
            'engagement_metrics',
            'insight_generation'
          ]
        })
      });

      return await response.json();
    } catch (error) {
      console.error('Failed to analyze conversation:', error);
      return this.mockAnalyzeConversation(conversationData);
    }
  }

  // Mock implementations for when MCP is not available
  mockSpawnAgent(agentType, data) {
    return {
      success: true,
      agent_id: `mock_${agentType}_${Date.now()}`,
      status: 'spawned',
      message: `Mock ${agentType} agent spawned successfully`,
      capabilities: ['basic_simulation', 'mock_responses']
    };
  }

  mockOrchestateExperiment(experimentData) {
    return {
      success: true,
      experiment_id: experimentData.id,
      status: 'running',
      estimated_duration: '5-10 minutes',
      participant_agents: experimentData.target_personas.map(id => ({
        agent_id: `mock_persona_${id}`,
        status: 'active',
        persona_id: id
      })),
      message: 'Mock experiment orchestration started'
    };
  }

  mockRunFocusGroup(focusGroupData) {
    return {
      success: true,
      focus_group_id: focusGroupData.id,
      status: 'running',
      session_info: {
        moderator_agent: 'mock_moderator_001',
        participant_agents: focusGroupData.participant_personas.map(id => `mock_participant_${id}`),
        rounds_completed: 0,
        total_rounds: focusGroupData.discussion_rounds
      },
      message: 'Mock focus group session started'
    };
  }

  mockAnalyzeConversation(conversationData) {
    return {
      success: true,
      analysis_id: `mock_analysis_${Date.now()}`,
      results: {
        sentiment: {
          overall: 'positive',
          breakdown: { positive: 0.6, neutral: 0.3, negative: 0.1 }
        },
        themes: ['user experience', 'pricing concerns', 'feature requests'],
        engagement_score: 8.2,
        insights: [
          'Participants showed strong interest in AI-powered features',
          'Price sensitivity varies by persona type',
          'UX clarity is a key concern across all personas'
        ]
      },
      message: 'Mock conversation analysis completed'
    };
  }

  // Get MCP server status
  async getStatus() {
    return {
      connected: this.isConnected,
      server_url: this.serverUrl,
      available_tools: this.agentTools,
      last_check: new Date().toISOString()
    };
  }
}

// Export singleton instance
export const personaLabMCP = new PersonaLabMCP();

// Initialize on module load
personaLabMCP.initialize().catch(console.error);