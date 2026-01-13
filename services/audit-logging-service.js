/**
 * Audit Logging Service (OCC 2011-12 / SR 11-7 Compliant)
 *
 * Production audit logging for agentic system compliance:
 * - Audit logs for all system actions
 * - Security events for threat detection
 * - Compliance records for MRM tracking
 *
 * Model card: data/model-cards/audit-logging-service.yaml
 */

const { getDatabase } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Event type constants for consistency
const EventTypes = {
  // Agent events
  AGENT_SPAWNED: 'agent.spawned',
  AGENT_TERMINATED: 'agent.terminated',
  AGENT_ERROR: 'agent.error',

  // Service events
  SERVICE_STARTED: 'service.started',
  SERVICE_STOPPED: 'service.stopped',
  SERVICE_RESTARTED: 'service.restarted',
  SERVICE_FAILED: 'service.failed',

  // Self-healing events
  HEALING_ATTEMPTED: 'healing.attempted',
  HEALING_SUCCESS: 'healing.success',
  HEALING_FAILED: 'healing.failed',
  CIRCUIT_BREAKER_TRIPPED: 'circuit_breaker.tripped',
  CIRCUIT_BREAKER_RESET: 'circuit_breaker.reset',
  ESCALATION_TRIGGERED: 'escalation.triggered',

  // Auth events
  AUTH_LOGIN: 'auth.login',
  AUTH_LOGOUT: 'auth.logout',
  AUTH_FAILED: 'auth.failed',

  // API events
  API_REQUEST: 'api.request',
  API_ERROR: 'api.error',

  // Model risk events
  MODEL_DEPLOYED: 'model.deployed',
  MODEL_VALIDATION: 'model.validation',
  MODEL_UPDATED: 'model.updated'
};

const Severity = {
  DEBUG: 'debug',
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

const ComplianceTypes = {
  OCC_2011_12: 'OCC 2011-12',
  SR_11_7: 'SR 11-7',
  MRM: 'Model Risk Management',
  SECURITY: 'Security Compliance',
  OPERATIONAL: 'Operational Compliance'
};

class AuditLoggingService {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.buffer = []; // Buffer for batch inserts
    this.bufferSize = 10;
    this.flushInterval = 5000; // 5 seconds
    this.flushTimer = null;
  }

  /**
   * Initialize the audit logging service
   */
  async initialize() {
    if (this.initialized) return;

    try {
      this.db = getDatabase();
      await this.db.initialize();

      // Start periodic flush
      this.flushTimer = setInterval(() => this.flushBuffer(), this.flushInterval);

      this.initialized = true;
      console.log('[AuditLogging] Service initialized');

      // Log service startup
      await this.logAudit({
        eventType: EventTypes.SERVICE_STARTED,
        eventAction: 'initialize',
        resourceType: 'audit_service',
        severity: Severity.INFO,
        metadata: { version: '1.0.0' }
      });

    } catch (error) {
      console.error('[AuditLogging] Initialization failed:', error.message);
      // Service degraded but not fatal - continue without DB logging
      this.initialized = false;
    }
  }

  /**
   * Log an audit event
   */
  async logAudit({
    eventType,
    eventAction,
    resourceType = null,
    resourceId = null,
    userId = null,
    agentId = null,
    ipAddress = null,
    userAgent = null,
    requestId = null,
    severity = Severity.INFO,
    beforeState = null,
    afterState = null,
    metadata = {}
  }) {
    const entry = {
      id: uuidv4(),
      eventType,
      eventAction,
      resourceType,
      resourceId,
      userId,
      agentId,
      ipAddress,
      userAgent,
      requestId: requestId || uuidv4(),
      severity,
      beforeState: beforeState ? JSON.stringify(beforeState) : null,
      afterState: afterState ? JSON.stringify(afterState) : null,
      metadata: JSON.stringify(metadata),
      createdAt: new Date().toISOString()
    };

    // Add to buffer
    this.buffer.push({ table: 'audit_logs', entry });

    // Flush if buffer is full
    if (this.buffer.length >= this.bufferSize) {
      await this.flushBuffer();
    }

    // For critical events, also log to console
    if (severity === Severity.CRITICAL || severity === Severity.ERROR) {
      console.log(`[AuditLogging] ${severity.toUpperCase()}: ${eventType}.${eventAction}`, metadata);
    }

    return entry.id;
  }

  /**
   * Log a security event
   */
  async logSecurityEvent({
    eventType,
    severity = Severity.WARNING,
    description,
    userId = null,
    ipAddress = null,
    threatLevel = null,
    blocked = false,
    details = {}
  }) {
    const entry = {
      id: uuidv4(),
      eventType,
      severity,
      description,
      userId,
      ipAddress,
      threatLevel,
      blocked,
      details: JSON.stringify(details),
      detectedAt: new Date().toISOString()
    };

    // Security events should be logged immediately
    if (this.db && this.initialized) {
      try {
        await this.db.query(
          `INSERT INTO security_events
           (id, event_type, severity, description, user_id, ip_address, threat_level, blocked, details, detected_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            entry.id,
            entry.eventType,
            entry.severity,
            entry.description,
            entry.userId,
            entry.ipAddress,
            entry.threatLevel,
            entry.blocked,
            entry.details,
            entry.detectedAt
          ]
        );
      } catch (error) {
        console.error('[AuditLogging] Failed to log security event:', error.message);
      }
    }

    // Always log to console for security events
    console.log(`[SecurityEvent] ${severity.toUpperCase()}: ${eventType} - ${description}`);

    return entry.id;
  }

  /**
   * Record a compliance check result
   */
  async recordComplianceCheck({
    complianceType,
    resourceType,
    resourceId = null,
    status = 'compliant',
    requirements,
    findings = [],
    checkedBy = null,
    nextCheckAt = null,
    metadata = {}
  }) {
    const entry = {
      id: uuidv4(),
      complianceType,
      resourceType,
      resourceId,
      status,
      requirements: JSON.stringify(requirements),
      findings: JSON.stringify(findings),
      checkedAt: new Date().toISOString(),
      checkedBy,
      nextCheckAt,
      metadata: JSON.stringify(metadata)
    };

    if (this.db && this.initialized) {
      try {
        await this.db.query(
          `INSERT INTO compliance_records
           (id, compliance_type, resource_type, resource_id, status, requirements, findings, checked_at, checked_by, next_check_at, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
          [
            entry.id,
            entry.complianceType,
            entry.resourceType,
            entry.resourceId,
            entry.status,
            entry.requirements,
            entry.findings,
            entry.checkedAt,
            entry.checkedBy,
            entry.nextCheckAt,
            entry.metadata
          ]
        );
      } catch (error) {
        console.error('[AuditLogging] Failed to record compliance check:', error.message);
      }
    }

    console.log(`[Compliance] ${complianceType}: ${resourceType} - ${status}`);

    return entry.id;
  }

  /**
   * Log self-healing event for MRM compliance
   */
  async logHealingEvent({
    serviceName,
    action,
    success,
    circuitBreakerState = null,
    aiAnalysis = null,
    errorMessage = null
  }) {
    const eventType = success ? EventTypes.HEALING_SUCCESS : EventTypes.HEALING_FAILED;

    return await this.logAudit({
      eventType,
      eventAction: action,
      resourceType: 'service',
      resourceId: serviceName,
      severity: success ? Severity.INFO : Severity.ERROR,
      metadata: {
        serviceName,
        success,
        circuitBreakerState,
        aiAnalysis,
        errorMessage,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Log circuit breaker state change
   */
  async logCircuitBreakerEvent({
    serviceName,
    previousState,
    newState,
    failures,
    reason
  }) {
    const eventType = newState === 'OPEN'
      ? EventTypes.CIRCUIT_BREAKER_TRIPPED
      : EventTypes.CIRCUIT_BREAKER_RESET;

    return await this.logAudit({
      eventType,
      eventAction: `state_change_${newState.toLowerCase()}`,
      resourceType: 'circuit_breaker',
      resourceId: serviceName,
      severity: newState === 'OPEN' ? Severity.WARNING : Severity.INFO,
      beforeState: { state: previousState },
      afterState: { state: newState, failures },
      metadata: { reason }
    });
  }

  /**
   * Log model validation for MRM compliance
   */
  async logModelValidation({
    modelId,
    modelName,
    validationType,
    passed,
    findings,
    validatedBy = 'system'
  }) {
    // Record as both audit and compliance
    await this.logAudit({
      eventType: EventTypes.MODEL_VALIDATION,
      eventAction: passed ? 'validation_passed' : 'validation_failed',
      resourceType: 'model',
      resourceId: modelId,
      severity: passed ? Severity.INFO : Severity.WARNING,
      metadata: { modelName, validationType, findings, validatedBy }
    });

    return await this.recordComplianceCheck({
      complianceType: ComplianceTypes.MRM,
      resourceType: 'model',
      resourceId: modelId,
      status: passed ? 'compliant' : 'non_compliant',
      requirements: {
        validation_type: validationType,
        model_card_required: true,
        circuit_breaker_required: true
      },
      findings,
      checkedBy: validatedBy,
      nextCheckAt: this.calculateNextValidationDate(validationType),
      metadata: { modelName }
    });
  }

  /**
   * Calculate next validation date based on type
   */
  calculateNextValidationDate(validationType) {
    const now = new Date();
    switch (validationType) {
      case 'quarterly':
        now.setMonth(now.getMonth() + 3);
        break;
      case 'semi_annual':
        now.setMonth(now.getMonth() + 6);
        break;
      case 'annual':
        now.setFullYear(now.getFullYear() + 1);
        break;
      default:
        now.setMonth(now.getMonth() + 3);
    }
    return now.toISOString();
  }

  /**
   * Flush buffer to database
   */
  async flushBuffer() {
    if (this.buffer.length === 0 || !this.db || !this.initialized) {
      return;
    }

    const entries = [...this.buffer];
    this.buffer = [];

    const auditEntries = entries.filter(e => e.table === 'audit_logs');

    if (auditEntries.length > 0) {
      try {
        // Batch insert audit logs
        const values = auditEntries.map((e, i) => {
          const offset = i * 13;
          return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}, $${offset + 7}, $${offset + 8}, $${offset + 9}, $${offset + 10}, $${offset + 11}, $${offset + 12}, $${offset + 13})`;
        }).join(', ');

        const params = auditEntries.flatMap(e => [
          e.entry.id,
          e.entry.eventType,
          e.entry.eventAction,
          e.entry.resourceType,
          e.entry.resourceId,
          e.entry.userId,
          e.entry.agentId,
          e.entry.ipAddress,
          e.entry.requestId,
          e.entry.severity,
          e.entry.beforeState,
          e.entry.afterState,
          e.entry.metadata
        ]);

        await this.db.query(
          `INSERT INTO audit_logs
           (id, event_type, event_action, resource_type, resource_id, user_id, agent_id, ip_address, request_id, severity, before_state, after_state, metadata)
           VALUES ${values}`,
          params
        );
      } catch (error) {
        console.error('[AuditLogging] Flush failed:', error.message);
        // Re-add entries to buffer for retry
        this.buffer.push(...entries);
      }
    }
  }

  /**
   * Query audit logs
   */
  async queryAuditLogs({
    eventType = null,
    resourceType = null,
    severity = null,
    startDate = null,
    endDate = null,
    limit = 100,
    offset = 0
  }) {
    if (!this.db || !this.initialized) {
      return { logs: [], total: 0 };
    }

    let query = 'SELECT * FROM audit_logs WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (eventType) {
      params.push(eventType);
      query += ` AND event_type = $${++paramCount}`;
    }

    if (resourceType) {
      params.push(resourceType);
      query += ` AND resource_type = $${++paramCount}`;
    }

    if (severity) {
      params.push(severity);
      query += ` AND severity = $${++paramCount}`;
    }

    if (startDate) {
      params.push(startDate);
      query += ` AND created_at >= $${++paramCount}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND created_at <= $${++paramCount}`;
    }

    query += ` ORDER BY created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    params.push(limit, offset);

    try {
      const result = await this.db.query(query, params);
      return { logs: result.rows, total: result.rows.length };
    } catch (error) {
      console.error('[AuditLogging] Query failed:', error.message);
      return { logs: [], total: 0 };
    }
  }

  /**
   * Get compliance status summary
   */
  async getComplianceStatus() {
    if (!this.db || !this.initialized) {
      return { compliant: 0, nonCompliant: 0, pending: 0 };
    }

    try {
      const result = await this.db.query(`
        SELECT status, COUNT(*) as count
        FROM compliance_records
        WHERE checked_at > NOW() - INTERVAL '90 days'
        GROUP BY status
      `);

      const summary = { compliant: 0, non_compliant: 0, pending: 0 };
      for (const row of result.rows) {
        summary[row.status] = parseInt(row.count);
      }

      return summary;
    } catch (error) {
      console.error('[AuditLogging] Compliance query failed:', error.message);
      return { compliant: 0, non_compliant: 0, pending: 0 };
    }
  }

  /**
   * Get recent security events
   */
  async getRecentSecurityEvents(limit = 50) {
    if (!this.db || !this.initialized) {
      return [];
    }

    try {
      const result = await this.db.query(
        'SELECT * FROM security_events ORDER BY detected_at DESC LIMIT $1',
        [limit]
      );
      return result.rows;
    } catch (error) {
      console.error('[AuditLogging] Security events query failed:', error.message);
      return [];
    }
  }

  /**
   * Shutdown service
   */
  async shutdown() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    // Final flush
    await this.flushBuffer();

    console.log('[AuditLogging] Service shutdown');
  }
}

// Singleton instance
let instance = null;

function getAuditLoggingService() {
  if (!instance) {
    instance = new AuditLoggingService();
  }
  return instance;
}

module.exports = {
  AuditLoggingService,
  getAuditLoggingService,
  EventTypes,
  Severity,
  ComplianceTypes
};
