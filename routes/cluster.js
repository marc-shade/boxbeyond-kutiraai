/**
 * Cluster Health Monitoring API Routes
 * Real-time monitoring for 4-node agentic cluster
 *
 * Integrates with:
 * - cluster-execution-mcp (cluster_status tool)
 * - node-chat-mcp (get_cluster_awareness tool)
 * - Hardware broadcast service (port 8888)
 * - SSH connectivity checks
 *
 * Target: 99% cluster availability monitoring
 */

const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const { promisify } = require('util');
const os = require('os');
const axios = require('axios');

const execAsync = promisify(exec);

// Node definitions matching cluster-execution-mcp
const CLUSTER_NODES = {
  'mac-studio': {
    hostname: process.env.CLUSTER_MACSTUDIO_HOST || 'Marcs-Mac-Studio.local',
    fallback_ip: process.env.CLUSTER_MACSTUDIO_IP || '192.168.1.16',
    role: 'Orchestrator',
    capabilities: ['orchestration', 'coordination', 'temporal', 'mlx-gpu', 'arduino'],
    os: 'darwin',
    arch: 'ARM64'
  },
  'macbook-air': {
    hostname: process.env.CLUSTER_MACBOOKAIR_HOST || 'Marcs-MacBook-Air.local',
    fallback_ip: process.env.CLUSTER_MACBOOKAIR_IP || '192.168.1.172',
    role: 'Researcher',
    capabilities: ['research', 'documentation', 'analysis'],
    os: 'darwin',
    arch: 'ARM64'
  },
  'macpro51': {
    hostname: process.env.CLUSTER_MACPRO51_HOST || 'macpro51.local',
    fallback_ip: process.env.CLUSTER_MACPRO51_IP || '192.168.1.183',
    role: 'Builder',
    capabilities: ['docker', 'podman', 'raid', 'nvme', 'compilation', 'testing', 'tpu'],
    os: 'linux',
    arch: 'x86_64'
  },
  'completeu-server': {
    hostname: process.env.CLUSTER_INFERENCE_HOST || 'completeu-server.local',
    fallback_ip: process.env.CLUSTER_INFERENCE_IP || '192.168.1.186',
    role: 'Inference',
    capabilities: ['ollama', 'inference', 'model-serving', 'llm-api'],
    os: 'darwin',
    arch: 'ARM64'
  }
};

// Local node detection
const getLocalNodeId = () => {
  const hostname = os.hostname().toLowerCase();
  if (hostname.includes('mac-studio')) return 'mac-studio';
  if (hostname.includes('macbook-air')) return 'macbook-air';
  if (hostname.includes('macpro51')) return 'macpro51';
  if (hostname.includes('completeu')) return 'completeu-server';
  return 'unknown';
};

/**
 * Check if a node is reachable via ping
 */
async function checkNodeReachability(nodeId) {
  const node = CLUSTER_NODES[nodeId];
  if (!node) return { reachable: false, error: 'Unknown node' };

  try {
    // Try hostname first, fallback to IP
    const target = node.hostname;
    await execAsync(`ping -c 1 -W 1 ${target}`);
    return { reachable: true, method: 'ping', target };
  } catch (hostnameError) {
    try {
      const target = node.fallback_ip;
      await execAsync(`ping -c 1 -W 1 ${target}`);
      return { reachable: true, method: 'ping-fallback', target };
    } catch (ipError) {
      return { reachable: false, error: 'Ping failed' };
    }
  }
}

/**
 * Get node metrics via SSH (for remote nodes)
 */
async function getRemoteNodeMetrics(nodeId) {
  const node = CLUSTER_NODES[nodeId];
  if (!node) return null;

  const localNode = getLocalNodeId();
  if (nodeId === localNode) {
    // Local node - get direct metrics
    return {
      cpu_percent: os.loadavg()[0] * 10, // Rough approximation
      memory_percent: (1 - os.freemem() / os.totalmem()) * 100,
      load_average: os.loadavg()[0],
      uptime: os.uptime() * 1000,
      available: true
    };
  }

  try {
    // Try SSH metrics fetch with timeout
    const target = node.hostname;
    const cmd = `ssh -o ConnectTimeout=2 -o StrictHostKeyChecking=accept-new marc@${target} "uptime && free -m | awk 'NR==2{printf \\"%.2f\\", $3*100/$2}'" 2>/dev/null`;
    const { stdout } = await execAsync(cmd, { timeout: 3000 });

    // Parse uptime and memory
    const lines = stdout.trim().split('\n');
    return {
      cpu_percent: parseFloat(lines[1]) || 0,
      memory_percent: parseFloat(lines[2]) || 0,
      load_average: parseFloat(lines[0]?.match(/load average: ([\d.]+)/)?.[1]) || 0,
      available: true
    };
  } catch (error) {
    return { available: false, error: error.message };
  }
}

/**
 * Get comprehensive node status
 */
async function getNodeStatus(nodeId) {
  const node = CLUSTER_NODES[nodeId];
  if (!node) return null;

  const reachability = await checkNodeReachability(nodeId);
  const metrics = await getRemoteNodeMetrics(nodeId);

  return {
    node_id: nodeId,
    hostname: node.hostname,
    role: node.role,
    capabilities: node.capabilities,
    os: node.os,
    arch: node.arch,
    status: reachability.reachable && metrics?.available ? 'online' : 'offline',
    healthy: reachability.reachable && metrics?.available,
    reachable: reachability.reachable,
    ...metrics,
    last_checked: new Date().toISOString()
  };
}

/**
 * Calculate cluster-wide availability SLA
 */
function calculateClusterSLA(nodes) {
  const totalNodes = nodes.length;
  const onlineNodes = nodes.filter(n => n.status === 'online').length;
  const availability = totalNodes > 0 ? (onlineNodes / totalNodes) * 100 : 0;

  return {
    current_availability: availability.toFixed(2) + '%',
    target_sla: '99%',
    meets_target: availability >= 99,
    online_nodes: onlineNodes,
    total_nodes: totalNodes,
    offline_nodes: totalNodes - onlineNodes
  };
}

/**
 * GET /api/cluster/nodes - Get all cluster nodes with status
 */
router.get('/nodes', async (req, res) => {
  try {
    const nodeIds = Object.keys(CLUSTER_NODES);
    const nodeStatuses = await Promise.all(
      nodeIds.map(nodeId => getNodeStatus(nodeId))
    );

    res.json({
      nodes: nodeStatuses,
      local_node: getLocalNodeId(),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cluster API] Error fetching nodes:', error);
    res.status(500).json({
      error: 'Failed to fetch cluster nodes',
      details: error.message
    });
  }
});

/**
 * GET /api/cluster/health - Get cluster health status with SLA
 */
router.get('/health', async (req, res) => {
  try {
    const nodeIds = Object.keys(CLUSTER_NODES);
    const nodeStatuses = await Promise.all(
      nodeIds.map(nodeId => getNodeStatus(nodeId))
    );

    const sla = calculateClusterSLA(nodeStatuses);
    const onlineNodes = nodeStatuses.filter(n => n.status === 'online');
    const offlineNodes = nodeStatuses.filter(n => n.status === 'offline');

    res.json({
      status: sla.meets_target ? 'healthy' : 'degraded',
      overall_status: sla.meets_target ? 'healthy' : 'degraded',
      sla,
      nodes_online: onlineNodes.length,
      nodes_offline: offlineNodes.length,
      nodes_total: nodeStatuses.length,
      online_nodes: onlineNodes.map(n => n.node_id),
      offline_nodes: offlineNodes.map(n => n.node_id),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cluster API] Error fetching cluster health:', error);
    res.status(500).json({
      error: 'Failed to fetch cluster health',
      details: error.message
    });
  }
});

/**
 * GET /api/cluster/current - Get current node information
 */
router.get('/current', async (req, res) => {
  try {
    const nodeId = getLocalNodeId();
    const node = CLUSTER_NODES[nodeId];

    if (!node) {
      return res.status(404).json({ error: 'Current node not found in cluster' });
    }

    const status = await getNodeStatus(nodeId);

    res.json({
      node_id: nodeId,
      ...node,
      ...status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cluster API] Error fetching current node:', error);
    res.status(500).json({
      error: 'Failed to fetch current node',
      details: error.message
    });
  }
});

/**
 * GET /api/cluster/messages - Get recent inter-node messages (stub)
 * TODO: Integrate with node-chat-mcp when available
 */
router.get('/messages', async (req, res) => {
  try {
    // Placeholder - will integrate with node-chat-mcp
    res.json({
      messages: [],
      note: 'Integration with node-chat-mcp pending',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cluster API] Error fetching messages:', error);
    res.status(500).json({
      error: 'Failed to fetch messages',
      details: error.message
    });
  }
});

/**
 * POST /api/cluster/message - Send message to another node (stub)
 * TODO: Integrate with node-chat-mcp when available
 */
router.post('/message', async (req, res) => {
  try {
    const { to_node, content, priority = 'normal' } = req.body;

    if (!to_node || !content) {
      return res.status(400).json({ error: 'to_node and content are required' });
    }

    // Placeholder - will integrate with node-chat-mcp
    res.json({
      success: true,
      message_id: Date.now(),
      to_node,
      priority,
      note: 'Integration with node-chat-mcp pending',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cluster API] Error sending message:', error);
    res.status(500).json({
      error: 'Failed to send message',
      details: error.message
    });
  }
});

/**
 * POST /api/cluster/heartbeat - Send node heartbeat
 */
router.post('/heartbeat', async (req, res) => {
  try {
    const { node_id, status = 'alive' } = req.body;
    const localNode = getLocalNodeId();

    // Verify this is the correct node
    if (node_id && node_id !== localNode) {
      return res.status(400).json({
        error: 'Node ID mismatch',
        expected: localNode,
        received: node_id
      });
    }

    res.json({
      success: true,
      node_id: localNode,
      status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cluster API] Error sending heartbeat:', error);
    res.status(500).json({
      error: 'Failed to send heartbeat',
      details: error.message
    });
  }
});

/**
 * GET /api/cluster/sla - Get SLA metrics and availability history
 */
router.get('/sla', async (req, res) => {
  try {
    const nodeIds = Object.keys(CLUSTER_NODES);
    const nodeStatuses = await Promise.all(
      nodeIds.map(nodeId => getNodeStatus(nodeId))
    );

    const sla = calculateClusterSLA(nodeStatuses);

    // Calculate uptime statistics
    const uptimes = nodeStatuses
      .filter(n => n.uptime)
      .map(n => n.uptime);

    const avgUptime = uptimes.length > 0
      ? uptimes.reduce((a, b) => a + b, 0) / uptimes.length
      : 0;

    res.json({
      ...sla,
      average_node_uptime_ms: avgUptime,
      average_node_uptime_hours: (avgUptime / 3600000).toFixed(2),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cluster API] Error fetching SLA:', error);
    res.status(500).json({
      error: 'Failed to fetch SLA metrics',
      details: error.message
    });
  }
});

/**
 * GET /api/cluster/routing - Get task routing statistics (stub)
 * TODO: Integrate with cluster-execution-mcp statistics
 */
router.get('/routing', async (req, res) => {
  try {
    res.json({
      total_tasks_routed: 0,
      tasks_per_node: {},
      average_routing_latency_ms: 0,
      note: 'Integration with cluster-execution-mcp statistics pending',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Cluster API] Error fetching routing stats:', error);
    res.status(500).json({
      error: 'Failed to fetch routing statistics',
      details: error.message
    });
  }
});

module.exports = router;
