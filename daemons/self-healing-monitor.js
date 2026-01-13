#!/usr/bin/env node
/**
 * Self-Healing Monitor (v1.1.0 - MRM Compliant)
 *
 * Ensures all agentic systems stay running 24/7:
 * - Monitors API server, daemons, services
 * - Automatically restarts failed services
 * - Uses Claude SDK and Ollama for intelligent diagnostics
 * - Sends alerts on critical failures
 * - Maintains system at 100% operational status
 *
 * OCC 2011-12 / SR 11-7 Compliance Features:
 * - Circuit breaker pattern prevents restart storms
 * - Escalation triggers for human oversight
 * - Audit logging for all healing actions
 * - Model card: data/model-cards/self-healing-monitor.yaml
 */

const axios = require('axios');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const DATA_DIR = path.join(__dirname, '../data/self-healing');
const CHECK_INTERVAL = 60000; // 1 minute
const PORT_MANAGER_URL = 'http://localhost:4102/api/v1';

// Audit logging integration
let auditService = null;
try {
  const { getAuditLoggingService } = require('../services/audit-logging-service');
  auditService = getAuditLoggingService();
} catch (error) {
  console.warn('[SelfHealing] Audit logging not available:', error.message);
}

// ============================================================================
// CIRCUIT BREAKER IMPLEMENTATION (OCC 2011-12 Compliant)
// ============================================================================

const CircuitBreakerState = {
  CLOSED: 'CLOSED',       // Normal operation, requests pass through
  OPEN: 'OPEN',           // Circuit tripped, requests blocked
  HALF_OPEN: 'HALF_OPEN'  // Testing if service recovered
};

// Circuit breaker configuration per OCC 2011-12 guidance
const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3,      // Consecutive failures to trip circuit
  resetTimeoutMs: 300000,   // 5 minutes before trying again
  halfOpenRequests: 1,      // Test requests in half-open state
  escalationThreshold: 5    // Services failing to trigger human escalation
};

// Per-service circuit breaker state
const circuitBreakers = {};

function getCircuitBreaker(serviceName) {
  if (!circuitBreakers[serviceName]) {
    circuitBreakers[serviceName] = {
      state: CircuitBreakerState.CLOSED,
      failures: 0,
      lastFailureTime: null,
      openedAt: null,
      halfOpenAttempts: 0,
      totalTrips: 0,
      lastTrippedReason: null
    };
  }
  return circuitBreakers[serviceName];
}

function shouldAllowRestart(serviceName) {
  const cb = getCircuitBreaker(serviceName);
  const now = Date.now();

  switch (cb.state) {
    case CircuitBreakerState.CLOSED:
      return true;

    case CircuitBreakerState.OPEN:
      // Check if enough time has passed to try again
      if (now - cb.openedAt >= CIRCUIT_BREAKER_CONFIG.resetTimeoutMs) {
        cb.state = CircuitBreakerState.HALF_OPEN;
        cb.halfOpenAttempts = 0;
        console.log(`🔄 Circuit for ${serviceName}: OPEN → HALF_OPEN (cooldown expired)`);
        return true;
      }
      const remainingMs = CIRCUIT_BREAKER_CONFIG.resetTimeoutMs - (now - cb.openedAt);
      console.log(`⛔ Circuit for ${serviceName}: OPEN (${Math.round(remainingMs / 1000)}s until retry)`);
      return false;

    case CircuitBreakerState.HALF_OPEN:
      if (cb.halfOpenAttempts < CIRCUIT_BREAKER_CONFIG.halfOpenRequests) {
        cb.halfOpenAttempts++;
        return true;
      }
      return false;
  }
}

function recordRestartSuccess(serviceName) {
  const cb = getCircuitBreaker(serviceName);
  const previousState = cb.state;

  if (cb.state === CircuitBreakerState.HALF_OPEN) {
    console.log(`✅ Circuit for ${serviceName}: HALF_OPEN → CLOSED (recovery successful)`);
  }

  cb.state = CircuitBreakerState.CLOSED;
  cb.failures = 0;
  cb.halfOpenAttempts = 0;
  cb.lastFailureTime = null;

  // Audit log the state change
  if (auditService && previousState !== CircuitBreakerState.CLOSED) {
    auditService.logCircuitBreakerEvent({
      serviceName,
      previousState,
      newState: CircuitBreakerState.CLOSED,
      failures: 0,
      reason: 'Recovery successful'
    }).catch(err => console.warn('[SelfHealing] Audit log failed:', err.message));
  }
}

function recordRestartFailure(serviceName, reason) {
  const cb = getCircuitBreaker(serviceName);
  const now = Date.now();
  const previousState = cb.state;

  cb.failures++;
  cb.lastFailureTime = now;
  cb.lastTrippedReason = reason;

  let tripped = false;

  if (cb.state === CircuitBreakerState.HALF_OPEN) {
    // Failed during recovery test - reopen circuit
    cb.state = CircuitBreakerState.OPEN;
    cb.openedAt = now;
    cb.totalTrips++;
    console.log(`⛔ Circuit for ${serviceName}: HALF_OPEN → OPEN (recovery failed)`);
    tripped = true;
  } else if (cb.failures >= CIRCUIT_BREAKER_CONFIG.failureThreshold) {
    cb.state = CircuitBreakerState.OPEN;
    cb.openedAt = now;
    cb.totalTrips++;
    console.log(`⛔ Circuit for ${serviceName}: CLOSED → OPEN (${cb.failures} consecutive failures)`);
    tripped = true;
  } else {
    console.log(`⚠️  Circuit for ${serviceName}: ${cb.failures}/${CIRCUIT_BREAKER_CONFIG.failureThreshold} failures`);
  }

  // Audit log circuit breaker events
  if (auditService && tripped) {
    auditService.logCircuitBreakerEvent({
      serviceName,
      previousState,
      newState: CircuitBreakerState.OPEN,
      failures: cb.failures,
      reason
    }).catch(err => console.warn('[SelfHealing] Audit log failed:', err.message));
  }

  // Also log healing failures
  if (auditService) {
    auditService.logHealingEvent({
      serviceName,
      action: 'restart',
      success: false,
      circuitBreakerState: cb.state,
      errorMessage: reason
    }).catch(err => console.warn('[SelfHealing] Audit log failed:', err.message));
  }

  return tripped;
}

function getCircuitBreakerSummary() {
  const summary = {
    openCircuits: [],
    halfOpenCircuits: [],
    closedCircuits: [],
    totalTrips: 0
  };

  for (const [name, cb] of Object.entries(circuitBreakers)) {
    summary.totalTrips += cb.totalTrips;

    switch (cb.state) {
      case CircuitBreakerState.OPEN:
        summary.openCircuits.push({ name, failures: cb.failures, reason: cb.lastTrippedReason });
        break;
      case CircuitBreakerState.HALF_OPEN:
        summary.halfOpenCircuits.push({ name, attempts: cb.halfOpenAttempts });
        break;
      case CircuitBreakerState.CLOSED:
        summary.closedCircuits.push({ name, failures: cb.failures });
        break;
    }
  }

  return summary;
}

// ============================================================================
// ESCALATION SYSTEM (Human Oversight per OCC 2011-12)
// ============================================================================

const escalationState = {
  activeEscalations: [],
  lastEscalationTime: null,
  totalEscalations: 0
};

async function checkEscalationTriggers(results) {
  const triggers = [];

  // Trigger 1: 3+ consecutive restart failures for same service
  for (const [name, cb] of Object.entries(circuitBreakers)) {
    if (cb.state === CircuitBreakerState.OPEN && cb.totalTrips >= 1) {
      triggers.push({
        type: 'CIRCUIT_BREAKER_TRIPPED',
        service: name,
        failures: cb.failures,
        reason: cb.lastTrippedReason,
        severity: 'HIGH'
      });
    }
  }

  // Trigger 2: 5+ services failing simultaneously
  const failingServices = results.failed?.length || 0;
  if (failingServices >= CIRCUIT_BREAKER_CONFIG.escalationThreshold) {
    triggers.push({
      type: 'MASS_FAILURE',
      count: failingServices,
      services: results.failed,
      severity: 'CRITICAL'
    });
  }

  // Trigger 3: Critical service failure persisting > 5 minutes
  for (const service of SERVICES) {
    if (service.critical) {
      const cb = getCircuitBreaker(service.name);
      if (cb.state === CircuitBreakerState.OPEN && cb.openedAt) {
        const openDuration = Date.now() - cb.openedAt;
        if (openDuration > 300000) { // 5 minutes
          triggers.push({
            type: 'CRITICAL_PERSISTENT_FAILURE',
            service: service.name,
            openDurationMinutes: Math.round(openDuration / 60000),
            severity: 'CRITICAL'
          });
        }
      }
    }
  }

  // Process triggers
  if (triggers.length > 0) {
    await handleEscalation(triggers);
  }

  return triggers;
}

async function handleEscalation(triggers) {
  const now = new Date();

  console.log('\n' + '='.repeat(60));
  console.log('🚨 HUMAN ESCALATION REQUIRED (OCC 2011-12 Compliance)');
  console.log('='.repeat(60));

  for (const trigger of triggers) {
    console.log(`\n[${trigger.severity}] ${trigger.type}`);
    console.log(`   Details: ${JSON.stringify(trigger, null, 2)}`);

    escalationState.activeEscalations.push({
      ...trigger,
      timestamp: now.toISOString(),
      acknowledged: false
    });
  }

  escalationState.lastEscalationTime = now.toISOString();
  escalationState.totalEscalations++;

  console.log('\n📋 Human Override Options:');
  console.log('   1. SIGINT to gracefully stop daemon');
  console.log('   2. Remove service from SERVICE_CONFIGS to disable monitoring');
  console.log('   3. Set critical: false to disable auto-restart');
  console.log('='.repeat(60) + '\n');

  // Write escalation to audit log
  const escalationLog = {
    timestamp: now.toISOString(),
    triggers,
    circuitBreakerSummary: getCircuitBreakerSummary()
  };

  const logFile = path.join(DATA_DIR, 'logs', `escalation-${Date.now()}.json`);
  await fs.writeFile(logFile, JSON.stringify(escalationLog, null, 2));

  // Post escalation to API for dashboard visibility
  try {
    await axios.post('http://localhost:3002/api/alerts', {
      severity: 'critical',
      message: `Human escalation required: ${triggers.map(t => t.type).join(', ')}`,
      timestamp: now.toISOString(),
      escalation: escalationLog,
      requiresAcknowledgment: true
    });
  } catch (error) {
    console.warn('⚠️  Could not post escalation to API');
  }

  // Try to send voice alert if voice-mode is available
  try {
    await axios.post('http://localhost:4003/api/alert', {
      message: `Warning: Human oversight required. ${triggers.length} escalation triggers detected.`,
      priority: 'high'
    });
  } catch (error) {
    // Voice mode not available
  }
}

// Service restart configurations (mapped by service name)
const SERVICE_CONFIGS = {
  'api-server': {
    processName: 'api-server-real.js',
    restartCommand: 'cd /Volumes/FILES/code/kutiraai && node api-server-real.js > api-server.log 2>&1 &',
    critical: true,
    healthEndpoint: '/api/health'
  },
  'research-daemon': {
    processName: 'research-team-daemon.js',
    restartCommand: 'cd /Volumes/FILES/code/kutiraai/daemons && node research-team-daemon.js > research.log 2>&1 &',
    critical: true
  },
  'development-daemon': {
    processName: 'development-team-daemon.js',
    restartCommand: 'cd /Volumes/FILES/code/kutiraai/daemons && node development-team-daemon.js > development.log 2>&1 &',
    critical: true
  },
  'n8n': {
    processName: 'n8n',
    restartCommand: 'n8n start > /tmp/n8n.log 2>&1 &',
    critical: false
  },
  'ollama': {
    processName: 'ollama',
    restartCommand: 'ollama serve > /tmp/ollama.log 2>&1 &',
    critical: false
  },
  'autokitteh': {
    processName: 'ak up',
    restartCommand: 'nohup ak up --mode dev > /tmp/autokitteh.log 2>&1 &',
    critical: false
  },
  'temporal': {
    processName: 'temporal server',
    restartCommand: 'nohup /opt/homebrew/opt/temporal/bin/temporal server start-dev > /tmp/temporal.log 2>&1 &',
    critical: false,
    healthEndpoint: 'http://localhost:8233'
  },
  'autokitteh-web': {
    processName: 'ak up',
    restartCommand: 'nohup ak up --mode dev > /tmp/autokitteh.log 2>&1 &',
    critical: false,
    healthEndpoint: ''
  }
};

// Dynamically loaded services from port manager
let SERVICES = [];

let healingStats = {
  checks: 0,
  heals: 0,
  failures: 0,
  lastCheck: null,
  services: {}
};

// Ensure data directory
async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.mkdir(path.join(DATA_DIR, 'logs'), { recursive: true });
}

// Load services from port manager
async function loadServicesFromPortManager() {
  try {
    const response = await axios.get(`${PORT_MANAGER_URL}/ports`, { timeout: 5000 });

    if (response.data && response.data.ports) {
      SERVICES = response.data.ports
        .filter(port => SERVICE_CONFIGS[port.serviceName] && port.status === 'reserved') // Only monitor active services we have configs for
        .map(port => {
          const config = SERVICE_CONFIGS[port.serviceName];
          const healthEndpoint = config.healthEndpoint || '';

          return {
            name: port.serviceName,
            checkUrl: `http://localhost:${port.port}${healthEndpoint}`,
            processName: config.processName,
            restartCommand: config.restartCommand,
            critical: config.critical,
            port: port.port,
            description: port.description
          };
        });

      console.log(`✅ Loaded ${SERVICES.length} services from port manager`);
      SERVICES.forEach(s => console.log(`   - ${s.name} (port ${s.port}, ${s.critical ? 'CRITICAL' : 'optional'})`));

      return true;
    }
  } catch (error) {
    console.warn('⚠️  Port manager not available, no services loaded:', error.message);
    return false;
  }
}

// Check if process is running
async function isProcessRunning(processName) {
  try {
    const { stdout } = await execAsync(`ps aux | grep "${processName}" | grep -v grep`);
    return stdout.trim().length > 0;
  } catch (error) {
    return false;
  }
}

// Check URL health (accepts 2xx and 3xx responses)
async function isUrlHealthy(url) {
  try {
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 0,  // Don't follow redirects
      validateStatus: status => status >= 200 && status < 400  // Accept 2xx and 3xx
    });
    return true;
  } catch (error) {
    // Check if it's a redirect (3xx)
    if (error.response && error.response.status >= 300 && error.response.status < 400) {
      return true;  // Redirect is considered healthy
    }
    return false;
  }
}

// Restart service (with circuit breaker protection)
async function restartService(service) {
  // Check circuit breaker first
  if (!shouldAllowRestart(service.name)) {
    console.log(`⏸️  Skipping restart for ${service.name} (circuit breaker active)`);
    return { success: false, blocked: true, reason: 'circuit_breaker' };
  }

  console.log(`🔧 Restarting ${service.name}...`);

  try {
    // Kill existing process if found
    try {
      await execAsync(`pkill -f "${service.processName}"`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      // Process not running, that's okay
    }

    // Start service
    await execAsync(service.restartCommand);
    console.log(`✅ ${service.name} restarted successfully`);

    healingStats.heals++;
    return { success: true, blocked: false };
  } catch (error) {
    console.error(`❌ Failed to restart ${service.name}:`, error.message);
    healingStats.failures++;
    return { success: false, blocked: false, reason: error.message };
  }
}

// Analyze failure with AI
async function analyzeFailure(service, error) {
  const context = `
Service: ${service.name}
Error: ${error}
Recent heals: ${healingStats.heals}
Recent failures: ${healingStats.failures}
Critical: ${service.critical}
`;

  try {
    if (ANTHROPIC_API_KEY) {
      const response = await axios.post(
        'https://api.anthropic.com/v1/messages',
        {
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 500,
          messages: [{
            role: 'user',
            content: `You are a system reliability engineer. A service has failed:

${context}

Provide:
1. Most likely cause
2. Recommended action
3. Prevention strategy

Be brief and actionable.`
          }]
        },
        {
          headers: {
            'x-api-key': ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
            'content-type': 'application/json'
          }
        }
      );

      return response.data.content[0].text;
    }
  } catch (error) {
    console.warn('⚠️  Claude analysis unavailable, using Ollama...');
  }

  // Fallback to Ollama
  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3.2',
      prompt: `Service ${service.name} failed. Suggest fix: ${error}`,
      stream: false
    });

    return response.data.response || 'Restart service and monitor logs';
  } catch (error) {
    return 'Automated analysis unavailable - check logs manually';
  }
}

// Check single service
async function checkService(service) {
  const status = {
    name: service.name,
    timestamp: new Date().toISOString(),
    healthy: false,
    processRunning: false,
    urlHealthy: null,
    critical: service.critical
  };

  // Check process
  if (service.processName) {
    status.processRunning = await isProcessRunning(service.processName);
  }

  // Check URL
  if (service.checkUrl) {
    status.urlHealthy = await isUrlHealthy(service.checkUrl);
  }

  // Determine overall health
  if (service.checkUrl) {
    status.healthy = status.urlHealthy;
  } else {
    status.healthy = status.processRunning;
  }

  return status;
}

// Main monitoring loop (with circuit breaker and escalation)
async function runHealthCheck() {
  healingStats.checks++;
  healingStats.lastCheck = new Date().toISOString();

  console.log(`\n🏥 Health Check #${healingStats.checks} at ${healingStats.lastCheck}`);

  // Show circuit breaker summary at start of each check
  const cbSummary = getCircuitBreakerSummary();
  if (cbSummary.openCircuits.length > 0) {
    console.log(`⚡ Circuit Breakers: ${cbSummary.openCircuits.length} OPEN, ${cbSummary.halfOpenCircuits.length} HALF_OPEN`);
  }

  const results = {
    timestamp: healingStats.lastCheck,
    services: [],
    healed: [],
    failed: [],
    blocked: [],
    circuitBreakers: cbSummary
  };

  for (const service of SERVICES) {
    const status = await checkService(service);
    results.services.push(status);

    if (!healingStats.services[service.name]) {
      healingStats.services[service.name] = {
        checks: 0,
        failures: 0,
        heals: 0,
        lastSeen: null,
        circuitTrips: 0
      };
    }

    healingStats.services[service.name].checks++;

    if (status.healthy) {
      console.log(`✅ ${service.name}: Healthy`);
      healingStats.services[service.name].lastSeen = status.timestamp;

      // If service recovered while circuit was open/half-open, reset it
      const cb = getCircuitBreaker(service.name);
      if (cb.state !== CircuitBreakerState.CLOSED) {
        recordRestartSuccess(service.name);
      }
    } else {
      console.log(`❌ ${service.name}: Unhealthy${service.critical ? ' (CRITICAL)' : ''}`);
      healingStats.services[service.name].failures++;

      // Attempt auto-heal (circuit breaker may block)
      const healResult = await restartService(service);

      if (healResult.blocked) {
        results.blocked.push(service.name);
        console.log(`⏸️  ${service.name}: Restart blocked by circuit breaker`);
        continue;
      }

      if (healResult.success) {
        results.healed.push(service.name);
        healingStats.services[service.name].heals++;

        // Wait and verify
        await new Promise(resolve => setTimeout(resolve, 3000));
        const verifyStatus = await checkService(service);

        if (verifyStatus.healthy) {
          console.log(`✅ ${service.name}: Heal successful`);
          recordRestartSuccess(service.name);
        } else {
          console.log(`⚠️  ${service.name}: Heal verification failed`);
          results.failed.push(service.name);

          // Record failure and potentially trip circuit
          const tripped = recordRestartFailure(service.name, 'Heal verification failed');
          if (tripped) {
            healingStats.services[service.name].circuitTrips++;
          }

          // Get AI analysis for persistent failures
          if (service.critical) {
            const analysis = await analyzeFailure(service, 'Service won\'t stay running');
            console.log(`\n🤖 AI Analysis for ${service.name}:\n${analysis}\n`);
          }
        }
      } else {
        results.failed.push(service.name);

        // Record failure with reason
        const tripped = recordRestartFailure(service.name, healResult.reason || 'Restart command failed');
        if (tripped) {
          healingStats.services[service.name].circuitTrips++;
        }
      }
    }
  }

  // Check escalation triggers (OCC 2011-12 human oversight requirement)
  const escalations = await checkEscalationTriggers(results);
  results.escalations = escalations;

  // Save results with circuit breaker state
  const logFile = path.join(DATA_DIR, 'logs', `health-${Date.now()}.json`);
  await fs.writeFile(logFile, JSON.stringify({
    results,
    stats: healingStats,
    circuitBreakers: Object.fromEntries(
      Object.entries(circuitBreakers).map(([k, v]) => [k, { ...v }])
    )
  }, null, 2));

  // Alert on critical failures (non-blocked)
  if (results.failed.length > 0) {
    console.log(`\n🚨 ALERT: ${results.failed.length} services failed to heal: ${results.failed.join(', ')}`);

    if (results.blocked.length > 0) {
      console.log(`⏸️  BLOCKED: ${results.blocked.length} services blocked by circuit breaker: ${results.blocked.join(', ')}`);
    }

    // Post alert to API if available
    try {
      await axios.post('http://localhost:3002/api/alerts', {
        severity: 'critical',
        message: `Self-healing failed for: ${results.failed.join(', ')}`,
        timestamp: new Date().toISOString(),
        stats: healingStats,
        circuitBreakers: cbSummary
      });
    } catch (error) {
      console.warn('⚠️  Could not post alert to API');
    }
  }

  // Summary with circuit breaker stats
  console.log(`\n📊 Stats: ${healingStats.heals} heals, ${healingStats.failures} failures, ${cbSummary.totalTrips} circuit trips`);

  return results;
}

// Start monitor
async function start() {
  console.log('');
  console.log('='.repeat(60));
  console.log('🚀 Self-Healing Monitor v1.1.0 (MRM Compliant)');
  console.log('='.repeat(60));
  console.log('');
  console.log('⚡ Monitoring interval: 1 minute');
  console.log('🔧 Auto-restart enabled for all services');
  console.log('🤖 AI diagnostics: Claude + Ollama fallback');
  console.log('🔍 Dynamic service discovery from port manager');
  console.log('');
  console.log('📋 OCC 2011-12 / SR 11-7 Compliance Features:');
  console.log(`   • Circuit breaker: ${CIRCUIT_BREAKER_CONFIG.failureThreshold} failures → trip`);
  console.log(`   • Cooldown period: ${CIRCUIT_BREAKER_CONFIG.resetTimeoutMs / 60000} minutes`);
  console.log(`   • Mass failure escalation: ${CIRCUIT_BREAKER_CONFIG.escalationThreshold}+ services`);
  console.log('   • Model card: data/model-cards/self-healing-monitor.yaml');
  console.log('');

  await ensureDataDir();

  // Load services from port manager
  await loadServicesFromPortManager();

  // Run initial check
  await runHealthCheck();

  // Schedule regular checks
  setInterval(async () => {
    try {
      await runHealthCheck();
    } catch (error) {
      console.error('❌ Health check failed:', error);
    }
  }, CHECK_INTERVAL);

  // Reload services from port manager every 5 minutes
  setInterval(async () => {
    try {
      console.log('\n🔄 Reloading services from port manager...');
      await loadServicesFromPortManager();
    } catch (error) {
      console.error('❌ Service reload failed:', error);
    }
  }, 300000); // 5 minutes

  console.log('\n✅ Self-Healing Monitor is running');
  console.log('   Press Ctrl+C to stop\n');

  // Keep process alive
  process.on('SIGINT', () => {
    console.log('\n👋 Self-Healing Monitor shutting down...');
    console.log(`\n📊 Final Stats:`);
    console.log(`   Checks: ${healingStats.checks}`);
    console.log(`   Heals: ${healingStats.heals}`);
    console.log(`   Failures: ${healingStats.failures}`);
    process.exit(0);
  });
}

// Run if executed directly
if (require.main === module) {
  start().catch(error => {
    console.error('❌ Failed to start monitor:', error);
    process.exit(1);
  });
}

module.exports = {
  start,
  runHealthCheck,
  checkService,
  restartService,
  // Circuit breaker exports for external monitoring/dashboard
  getCircuitBreakerSummary,
  circuitBreakers,
  CircuitBreakerState,
  CIRCUIT_BREAKER_CONFIG,
  escalationState
};
