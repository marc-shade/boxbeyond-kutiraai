/**
 * System Event Notifier
 * Monitors system activities and broadcasts real-time notifications
 *
 * Integrates with:
 * - AutoKitteh sessions and deployments
 * - Overnight automation workers
 * - MCP service status
 * - Port conflicts
 * - System errors
 */

const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class SystemEventNotifier {
  constructor(broadcastFn) {
    this.broadcastNotification = broadcastFn;
    this.lastCheckState = {
      autokitteh: {
        sessions: [],
        deployments: []
      },
      overnight: {
        lastReport: null
      },
      ports: {
        conflicts: []
      }
    };
    this.monitoringInterval = null;
  }

  /**
   * Start monitoring system events
   */
  start(intervalMs = 30000) {
    console.log('[SystemEventNotifier] Starting system event monitoring');

    // Initial check
    this.checkAllSystems();

    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.checkAllSystems();
    }, intervalMs);
  }

  /**
   * Stop monitoring
   */
  stop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Check all systems for events
   */
  async checkAllSystems() {
    try {
      await Promise.all([
        this.checkAutoKitteh(),
        this.checkOvernightReports(),
        this.checkPortConflicts(),
        this.checkMCPServices()
      ]);
    } catch (error) {
      console.error('[SystemEventNotifier] Error checking systems:', error);
    }
  }

  /**
   * Monitor AutoKitteh for session changes
   */
  async checkAutoKitteh() {
    try {
      // Check for new sessions
      const { stdout: sessionsOutput } = await execAsync('ak session list 2>/dev/null || true');

      if (!sessionsOutput.trim()) return;

      const currentSessions = this.parseAutoKittehSessions(sessionsOutput);
      const previousSessions = this.lastCheckState.autokitteh.sessions;

      // Detect new sessions
      for (const session of currentSessions) {
        const isNew = !previousSessions.find(s => s.id === session.id);
        if (isNew) {
          this.notifyAutoKittehSessionStarted(session);
        }
      }

      // Detect completed sessions
      for (const prevSession of previousSessions) {
        const current = currentSessions.find(s => s.id === prevSession.id);
        if (!current && prevSession.state === 'running') {
          this.notifyAutoKittehSessionCompleted(prevSession);
        }
      }

      this.lastCheckState.autokitteh.sessions = currentSessions;

      // Check deployments
      const { stdout: deploymentsOutput } = await execAsync('ak deployment list 2>/dev/null || true');

      if (deploymentsOutput.trim()) {
        const currentDeployments = this.parseAutoKittehDeployments(deploymentsOutput);
        const previousDeployments = this.lastCheckState.autokitteh.deployments;

        for (const deployment of currentDeployments) {
          const prev = previousDeployments.find(d => d.id === deployment.id);
          if (!prev) {
            this.notifyAutoKittehDeployment(deployment);
          } else if (prev.state !== deployment.state) {
            this.notifyAutoKittehDeploymentStateChange(deployment, prev.state);
          }
        }

        this.lastCheckState.autokitteh.deployments = currentDeployments;
      }
    } catch (error) {
      // Silent fail - AutoKitteh may not be installed
    }
  }

  /**
   * Monitor overnight automation reports
   */
  async checkOvernightReports() {
    try {
      const reportPath = path.join(__dirname, '../data/overnight/latest-report.json');

      if (!fsSync.existsSync(reportPath)) return;

      const stats = await fs.stat(reportPath);
      const reportData = JSON.parse(await fs.readFile(reportPath, 'utf8'));

      // Check if report is new (within last hour)
      const reportTime = new Date(reportData.generatedAt);
      const hourAgo = new Date(Date.now() - 3600000);

      if (reportTime > hourAgo) {
        const lastReportId = this.lastCheckState.overnight.lastReport;

        if (lastReportId !== reportData.id) {
          this.notifyOvernightReportGenerated(reportData);
          this.lastCheckState.overnight.lastReport = reportData.id;
        }
      }

      // Check for discoveries in the report
      if (reportData.summary?.discoveries) {
        const { papers = [], repos = [] } = reportData.summary.discoveries;

        if (papers.length > 0 || repos.length > 0) {
          this.notifyResearchDiscoveries(papers.length, repos.length);
        }
      }
    } catch (error) {
      // Silent fail - reports may not exist yet
    }
  }

  /**
   * Monitor port conflicts
   */
  async checkPortConflicts() {
    try {
      const knownPorts = {
        3001: 'frontend',
        3002: 'api-server',
        3101: 'vite-dev',
        4102: 'port-manager',
        7880: 'livekit',
        8000: 'backend-mock',
        8880: 'kokoro-tts',
        9980: 'autokitteh'
      };

      const conflicts = [];

      for (const [port, service] of Object.entries(knownPorts)) {
        try {
          const { stdout } = await execAsync(`lsof -iTCP:${port} -sTCP:LISTEN -n -P 2>/dev/null || true`);
          const lines = stdout.trim().split('\n');

          if (lines.length > 2) { // More than just header + one process
            conflicts.push({ port, service, processes: lines.length - 1 });
          }
        } catch (error) {
          // Port check failed, skip
        }
      }

      // Notify about new conflicts
      for (const conflict of conflicts) {
        const wasKnown = this.lastCheckState.ports.conflicts.find(
          c => c.port === conflict.port
        );

        if (!wasKnown) {
          this.notifyPortConflict(conflict);
        }
      }

      this.lastCheckState.ports.conflicts = conflicts;
    } catch (error) {
      console.error('[SystemEventNotifier] Port conflict check failed:', error);
    }
  }

  /**
   * Monitor MCP service status
   */
  async checkMCPServices() {
    try {
      // Check for service starts/stops by comparing process list
      const { stdout } = await execAsync('ps aux | grep -E "mcp|temporal|autokitteh" | grep -v grep || true');

      // This is a simple implementation - could be enhanced with detailed tracking
      // For now, just log that we're monitoring
    } catch (error) {
      // Silent fail
    }
  }

  /**
   * Parse AutoKitteh session list output
   */
  parseAutoKittehSessions(output) {
    const sessions = [];
    const lines = output.trim().split('\n');

    for (const line of lines) {
      const idMatch = line.match(/session_id:"([^"]+)"/);
      const stateMatch = line.match(/state:SESSION_STATE_(\w+)/);

      if (idMatch) {
        sessions.push({
          id: idMatch[1],
          state: stateMatch ? stateMatch[1].toLowerCase() : 'unknown'
        });
      }
    }

    return sessions;
  }

  /**
   * Parse AutoKitteh deployment list output
   */
  parseAutoKittehDeployments(output) {
    const deployments = [];
    const lines = output.trim().split('\n');

    for (const line of lines) {
      const idMatch = line.match(/deployment_id:"([^"]+)"/);
      const stateMatch = line.match(/state:DEPLOYMENT_STATE_(\w+)/);
      const projectMatch = line.match(/project_id:"([^"]+)"/);

      if (idMatch) {
        deployments.push({
          id: idMatch[1],
          project: projectMatch ? projectMatch[1] : 'unknown',
          state: stateMatch ? stateMatch[1].toLowerCase() : 'unknown'
        });
      }
    }

    return deployments;
  }

  /**
   * Notification helpers
   */

  notifyAutoKittehSessionStarted(session) {
    this.broadcastNotification('system', {
      type: 'agent.spawned',
      title: 'AutoKitteh Session Started',
      message: `New AutoKitteh session ${session.id.substring(0, 12)}... started`,
      priority: 'normal',
      category: 'automation',
      data: { session }
    });
  }

  notifyAutoKittehSessionCompleted(session) {
    this.broadcastNotification('system', {
      type: 'agent.completed',
      title: 'AutoKitteh Session Completed',
      message: `Session ${session.id.substring(0, 12)}... completed successfully`,
      priority: 'normal',
      category: 'automation',
      data: { session }
    });
  }

  notifyAutoKittehDeployment(deployment) {
    this.broadcastNotification('system', {
      type: 'system.info',
      title: 'AutoKitteh Deployment Active',
      message: `Deployment ${deployment.id.substring(0, 12)}... is ${deployment.state}`,
      priority: 'normal',
      category: 'automation',
      data: { deployment }
    });
  }

  notifyAutoKittehDeploymentStateChange(deployment, oldState) {
    this.broadcastNotification('system', {
      type: 'system.warning',
      title: 'Deployment State Changed',
      message: `Deployment ${deployment.id.substring(0, 12)}... changed from ${oldState} to ${deployment.state}`,
      priority: 'high',
      category: 'automation',
      data: { deployment, oldState }
    });
  }

  notifyOvernightReportGenerated(report) {
    this.broadcastNotification('system', {
      type: 'task.completed',
      title: 'Overnight Report Generated',
      message: `New intelligence report: ${report.summary.tasksCompleted} tasks completed`,
      priority: 'normal',
      category: 'intelligence',
      data: { reportId: report.id, summary: report.summary }
    });
  }

  notifyResearchDiscoveries(papersCount, reposCount) {
    if (papersCount === 0 && reposCount === 0) return;

    this.broadcastNotification('system', {
      type: 'system.info',
      title: 'Research Discoveries',
      message: `Discovered ${papersCount} papers and ${reposCount} relevant repositories`,
      priority: 'normal',
      category: 'research',
      data: { papersCount, reposCount }
    });
  }

  notifyPortConflict(conflict) {
    this.broadcastNotification('system', {
      type: 'system.warning',
      title: 'Port Conflict Detected',
      message: `Port ${conflict.port} (${conflict.service}) has ${conflict.processes} processes listening`,
      priority: 'high',
      category: 'system',
      data: conflict
    });
  }
}

module.exports = SystemEventNotifier;
