/**
 * AI Studio API Routes
 *
 * Provides REST API endpoints for AI Studio functionality
 */

const express = require('express');
const router = express.Router();

const agentRegistry = require('../services/ai-studio/agentRegistry');
const workflowEngine = require('../services/ai-studio/workflowEngine');
const taskQueue = require('../services/ai-studio/taskQueue');
const activityBroadcaster = require('../services/ai-studio/activityBroadcaster');

// ============================================================================
// AGENTS
// ============================================================================

/**
 * GET /api/ai-studio/agents
 * Get all agents with their current status
 */
router.get('/agents', (req, res) => {
  try {
    const agents = agentRegistry.getAllAgents();
    const stats = agentRegistry.getStatistics();

    res.json({
      success: true,
      agents,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-studio/agents/:agentId
 * Get specific agent details
 */
router.get('/agents/:agentId', (req, res) => {
  try {
    const agent = agentRegistry.getAgent(req.params.agentId);

    if (!agent) {
      return res.status(404).json({
        success: false,
        error: 'Agent not found'
      });
    }

    // Get agent's recent activities
    const activities = activityBroadcaster.getActivitiesByAgent(req.params.agentId, 20);

    // Get agent's tasks
    const tasks = taskQueue.getTasksByAgent(req.params.agentId);

    res.json({
      success: true,
      agent,
      activities,
      tasks
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/ai-studio/agents/:agentId/status
 * Update agent status
 */
router.put('/agents/:agentId/status', (req, res) => {
  try {
    const { status, task, workflow, mode } = req.body;

    const agent = agentRegistry.updateAgentStatus(
      req.params.agentId,
      status,
      task,
      workflow,
      mode
    );

    // Broadcast activity
    if (mode) {
      activityBroadcaster.recordModeChange(agent, mode, task);
    }

    res.json({
      success: true,
      agent
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// WORKFLOWS
// ============================================================================

/**
 * GET /api/ai-studio/workflows/templates
 * Get available workflow templates
 */
router.get('/workflows/templates', (req, res) => {
  try {
    const templates = workflowEngine.getTemplates();

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-studio/workflows/start
 * Start a new workflow
 */
router.post('/workflows/start', async (req, res) => {
  try {
    const { templateId, params } = req.body;

    if (!templateId) {
      return res.status(400).json({
        success: false,
        error: 'templateId is required'
      });
    }

    const workflow = await workflowEngine.startWorkflow(templateId, params);

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-studio/workflows/:workflowId
 * Get workflow status
 */
router.get('/workflows/:workflowId', (req, res) => {
  try {
    const workflow = workflowEngine.getWorkflowStatus(req.params.workflowId);

    if (!workflow) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      workflow
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-studio/workflows
 * Get all active workflows
 */
router.get('/workflows', (req, res) => {
  try {
    const active = workflowEngine.getActiveWorkflows();
    const history = workflowEngine.getHistory(50);
    const stats = workflowEngine.getStatistics();

    res.json({
      success: true,
      active,
      history,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/ai-studio/workflows/:workflowId
 * Cancel a workflow
 */
router.delete('/workflows/:workflowId', (req, res) => {
  try {
    const success = workflowEngine.cancelWorkflow(req.params.workflowId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Workflow not found'
      });
    }

    res.json({
      success: true,
      message: 'Workflow cancelled'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// TASKS
// ============================================================================

/**
 * POST /api/ai-studio/tasks
 * Create a new task
 */
router.post('/tasks', (req, res) => {
  try {
    const task = taskQueue.createTask(req.body);

    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-studio/tasks/:taskId/assign
 * Assign task to agent(s)
 */
router.post('/tasks/:taskId/assign', (req, res) => {
  try {
    const { agentIds } = req.body;

    if (!agentIds) {
      return res.status(400).json({
        success: false,
        error: 'agentIds is required'
      });
    }

    const task = taskQueue.assignTask(req.params.taskId, agentIds);

    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-studio/tasks/:taskId/start
 * Start task execution
 */
router.post('/tasks/:taskId/start', (req, res) => {
  try {
    const task = taskQueue.startTask(req.params.taskId);

    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/ai-studio/tasks/:taskId/progress
 * Update task progress
 */
router.put('/tasks/:taskId/progress', (req, res) => {
  try {
    const { progress, output } = req.body;

    const task = taskQueue.updateProgress(req.params.taskId, progress, output);

    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-studio/tasks/:taskId/complete
 * Mark task as completed
 */
router.post('/tasks/:taskId/complete', (req, res) => {
  try {
    const { output, artifacts } = req.body;

    const task = taskQueue.completeTask(req.params.taskId, output, artifacts);

    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-studio/tasks/board
 * Get Kanban board view of tasks
 */
router.get('/tasks/board', (req, res) => {
  try {
    const board = taskQueue.getKanbanBoard();
    const stats = taskQueue.getStatistics();

    res.json({
      success: true,
      board,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-studio/tasks/:taskId
 * Get task details
 */
router.get('/tasks/:taskId', (req, res) => {
  try {
    const task = taskQueue.getTask(req.params.taskId);

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/ai-studio/tasks/:taskId
 * Delete a task
 */
router.delete('/tasks/:taskId', (req, res) => {
  try {
    const success = taskQueue.deleteTask(req.params.taskId);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      message: 'Task deleted'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// ACTIVITY
// ============================================================================

/**
 * GET /api/ai-studio/activity
 * Get recent activity feed
 */
router.get('/activity', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activities = activityBroadcaster.getRecentActivities(limit);
    const stats = activityBroadcaster.getStatistics();

    res.json({
      success: true,
      activities,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-studio/activity/agent/:agentId
 * Get activity for specific agent
 */
router.get('/activity/agent/:agentId', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const activities = activityBroadcaster.getActivitiesByAgent(req.params.agentId, limit);

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ============================================================================
// STATISTICS & MONITORING
// ============================================================================

/**
 * GET /api/ai-studio/stats
 * Get overall AI Studio statistics
 */
router.get('/stats', (req, res) => {
  try {
    const stats = {
      agents: agentRegistry.getStatistics(),
      workflows: workflowEngine.getStatistics(),
      tasks: taskQueue.getStatistics(),
      activity: activityBroadcaster.getStatistics()
    };

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ===== Scheduling Routes =====

const schedulingCoordinator = require('../services/ai-studio/schedulingCoordinator');

/**
 * Create new scheduled workflow
 * POST /api/ai-studio/schedule/create
 */
router.post('/schedule/create', async (req, res) => {
  try {
    const scheduleConfig = req.body;
    const schedule = await schedulingCoordinator.createSchedule(scheduleConfig);

    res.json({
      success: true,
      schedule
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get scheduling statistics
 * GET /api/ai-studio/schedule/stats
 */
router.get('/schedule/stats', (req, res) => {
  try {
    const stats = schedulingCoordinator.getStatistics();

    res.json({
      success: true,
      statistics: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List all schedules
 * GET /api/ai-studio/schedule/list
 */
router.get('/schedule/list', (req, res) => {
  try {
    const schedules = schedulingCoordinator.getAllSchedules();

    res.json({
      success: true,
      schedules
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get schedule by ID
 * GET /api/ai-studio/schedule/:scheduleId
 */
router.get('/schedule/:scheduleId', (req, res) => {
  try {
    const { scheduleId } = req.params;
    const schedule = schedulingCoordinator.getSchedule(scheduleId);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: 'Schedule not found'
      });
    }

    res.json({
      success: true,
      schedule
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update schedule
 * PUT /api/ai-studio/schedule/:scheduleId
 */
router.put('/schedule/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const updates = req.body;

    const schedule = await schedulingCoordinator.updateSchedule(scheduleId, updates);

    res.json({
      success: true,
      schedule
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete schedule
 * DELETE /api/ai-studio/schedule/:scheduleId
 */
router.delete('/schedule/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;

    await schedulingCoordinator.deleteSchedule(scheduleId);

    res.json({
      success: true,
      message: 'Schedule deleted successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Enable schedule
 * POST /api/ai-studio/schedule/:scheduleId/enable
 */
router.post('/schedule/:scheduleId/enable', async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await schedulingCoordinator.enableSchedule(scheduleId);

    res.json({
      success: true,
      schedule
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Disable schedule
 * POST /api/ai-studio/schedule/:scheduleId/disable
 */
router.post('/schedule/:scheduleId/disable', async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const schedule = await schedulingCoordinator.disableSchedule(scheduleId);

    res.json({
      success: true,
      schedule
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Manually trigger schedule
 * POST /api/ai-studio/schedule/:scheduleId/trigger
 */
router.post('/schedule/:scheduleId/trigger', async (req, res) => {
  try {
    const { scheduleId } = req.params;

    await schedulingCoordinator.triggerSchedule(scheduleId);

    res.json({
      success: true,
      message: 'Schedule triggered successfully'
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get execution history
 * GET /api/ai-studio/schedule/:scheduleId/history
 */
router.get('/schedule/:scheduleId/history', (req, res) => {
  try {
    const { scheduleId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const history = schedulingCoordinator.getExecutionHistory(scheduleId, limit);

    res.json({
      success: true,
      history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
