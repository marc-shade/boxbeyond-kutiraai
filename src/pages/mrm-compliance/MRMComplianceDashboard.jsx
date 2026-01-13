/**
 * MRM Compliance Dashboard
 *
 * OCC 2011-12 / SR 11-7 Model Risk Management compliance tracking:
 * - Model cards inventory and validation status
 * - Circuit breaker monitoring
 * - Audit log summary
 * - Compliance status overview
 */

import { useState, useEffect, useCallback } from "react";
import {
  Grid,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Alert,
  Paper,
  Stack,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Security as ComplianceIcon,
  Assignment as ModelCardIcon,
  PowerSettingsNew as CircuitIcon,
  History as AuditIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Verified as VerifiedIcon,
  HourglassEmpty as PendingIcon,
} from "@mui/icons-material";
import MainCard from "components/MainCard";
import { GlassmorphicCard } from "themes/GlassmorphicComponents";
import apiClient from "api/axios-config";

// Risk tier colors
const RISK_COLORS = {
  high: "error",
  medium: "warning",
  low: "success",
};

const MRMComplianceDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelCards, setModelCards] = useState([]);
  const [circuitBreakers, setCircuitBreakers] = useState(null);
  const [auditSummary, setAuditSummary] = useState(null);
  const [complianceStatus, setComplianceStatus] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load model cards
      const modelCardsResponse = await apiClient.get("/mrm/model-cards");
      setModelCards(modelCardsResponse.data.modelCards || []);

      // Load circuit breaker status
      const circuitResponse = await apiClient.get("/mrm/circuit-breakers");
      setCircuitBreakers(circuitResponse.data);

      // Load audit summary
      const auditResponse = await apiClient.get("/mrm/audit-summary");
      setAuditSummary(auditResponse.data);

      // Load compliance status
      const complianceResponse = await apiClient.get("/mrm/compliance-status");
      setComplianceStatus(complianceResponse.data);
    } catch (err) {
      console.error("MRM data load error:", err);
      setError(`Failed to load MRM data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [loadData]);

  const renderOverviewCards = () => {
    const totalModels = modelCards.length;
    const validatedModels = modelCards.filter(
      (m) => m.validation_status === "Validated" || m.last_validation_date,
    ).length;
    const pendingValidation = modelCards.filter(
      (m) =>
        m.validation_status?.includes("Pending") || !m.last_validation_date,
    ).length;
    const highRiskModels = modelCards.filter(
      (m) => m.risk_tier === "High" || m.risk_category === "High",
    ).length;

    return (
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={3}>
          <GlassmorphicCard>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ModelCardIcon sx={{ fontSize: 40, color: "primary.main" }} />
                <Box>
                  <Typography variant="h3">{totalModels}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Model Cards
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </GlassmorphicCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GlassmorphicCard>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <VerifiedIcon sx={{ fontSize: 40, color: "success.main" }} />
                <Box>
                  <Typography variant="h3">{validatedModels}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Validated
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </GlassmorphicCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GlassmorphicCard>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <PendingIcon sx={{ fontSize: 40, color: "warning.main" }} />
                <Box>
                  <Typography variant="h3">{pendingValidation}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending Validation
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </GlassmorphicCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <GlassmorphicCard>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ErrorIcon sx={{ fontSize: 40, color: "error.main" }} />
                <Box>
                  <Typography variant="h3">{highRiskModels}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    High Risk Models
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </GlassmorphicCard>
        </Grid>
      </Grid>
    );
  };

  const renderModelCardsTab = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" gutterBottom>
        Model Inventory (OCC 2011-12 Compliant)
      </Typography>
      <TableContainer component={Paper} sx={{ maxHeight: 500 }}>
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell>Model ID</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Risk Tier</TableCell>
              <TableCell>Validation Status</TableCell>
              <TableCell>Next Validation</TableCell>
              <TableCell>Owner</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {modelCards.map((model) => (
              <TableRow key={model.model_id || model.id} hover>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {model.model_id}
                  </Typography>
                </TableCell>
                <TableCell>{model.model_name}</TableCell>
                <TableCell>
                  <Chip
                    label={model.risk_tier || model.risk_category || "Unknown"}
                    size="small"
                    color={
                      RISK_COLORS[
                        (model.risk_tier || model.risk_category)?.toLowerCase()
                      ] || "default"
                    }
                  />
                </TableCell>
                <TableCell>
                  <Chip
                    label={model.validation_status || "Unknown"}
                    size="small"
                    color={
                      model.validation_status === "Validated" ||
                      model.last_validation_date
                        ? "success"
                        : model.validation_status?.includes("Pending")
                          ? "warning"
                          : "error"
                    }
                    icon={
                      model.validation_status === "Validated" ||
                      model.last_validation_date ? (
                        <CheckIcon />
                      ) : model.validation_status?.includes("Pending") ? (
                        <ScheduleIcon />
                      ) : (
                        <ErrorIcon />
                      )
                    }
                  />
                </TableCell>
                <TableCell>
                  {model.next_validation_date
                    ? new Date(model.next_validation_date).toLocaleDateString()
                    : "Not scheduled"}
                </TableCell>
                <TableCell>{model.owner || "Unassigned"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );

  const renderCircuitBreakersTab = () => {
    const cbData = circuitBreakers?.circuitBreakers || {};
    const summary = circuitBreakers?.summary || {};
    const openCount = summary.open || 0;
    const closedCount = summary.closed || 0;
    const halfOpenCount = summary.halfOpen || 0;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Circuit Breaker Status (Restart Storm Prevention)
        </Typography>

        {openCount > 0 && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {openCount} circuit(s) OPEN - restarts blocked
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <CheckIcon color="success" />
                <Typography variant="h6">{closedCount}</Typography>
                <Typography variant="body2" color="textSecondary">
                  Closed (Normal)
                </Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, bgcolor: "warning.light" }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <WarningIcon color="warning" />
                <Typography variant="h6">{halfOpenCount}</Typography>
                <Typography variant="body2">Half-Open (Testing)</Typography>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, bgcolor: "error.light" }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <ErrorIcon color="error" />
                <Typography variant="h6">{openCount}</Typography>
                <Typography variant="body2">Open (Blocked)</Typography>
              </Stack>
            </Paper>
          </Grid>
        </Grid>

        {/* Service List */}
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Circuit Breaker Details
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Service</TableCell>
                  <TableCell>State</TableCell>
                  <TableCell>Failures</TableCell>
                  <TableCell>Opened At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.entries(cbData).map(([serviceName, cb]) => (
                  <TableRow key={serviceName}>
                    <TableCell>{serviceName}</TableCell>
                    <TableCell>
                      <Chip
                        label={cb.state}
                        size="small"
                        color={
                          cb.state === "CLOSED"
                            ? "success"
                            : cb.state === "HALF_OPEN"
                              ? "warning"
                              : "error"
                        }
                      />
                    </TableCell>
                    <TableCell>{cb.failures || 0}</TableCell>
                    <TableCell>
                      {cb.openedAt
                        ? new Date(cb.openedAt).toLocaleString()
                        : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="textSecondary">
            Health: {summary.healthyPercent || 0}% of circuits in normal state
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Configuration: 3 failures to trip, 5 minute cooldown
          </Typography>
        </Box>
      </Box>
    );
  };

  const renderAuditLogTab = () => {
    const summary = auditSummary?.summary || {};
    const recentEvents = auditSummary?.recentEvents || [];
    const securityEvents = auditSummary?.securityEvents || [];
    const eventTypes = summary.eventTypeDistribution || {};

    // Count healing events from distribution
    const healingSuccesses = eventTypes["healing.success"] || 0;
    const healingFailures = eventTypes["healing.failed"] || 0;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          Audit Log Summary (Last 24 Hours)
        </Typography>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h4">
                {summary.totalEvents24h || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Events
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h4" color="success.main">
                {healingSuccesses}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Healing Successes
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h4" color="error.main">
                {healingFailures}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Healing Failures
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Paper sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="h4" color="warning.main">
                {summary.recentSecurityEvents || securityEvents.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Security Events
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        {/* Event Type Distribution */}
        {Object.keys(eventTypes).length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              Event Type Distribution
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {Object.entries(eventTypes).map(([type, count]) => (
                <Chip
                  key={type}
                  label={`${type}: ${count}`}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Stack>
          </Box>
        )}

        <Typography variant="subtitle1" gutterBottom>
          Recent Events
        </Typography>
        <List dense>
          {recentEvents.slice(0, 10).map((event, index) => (
            <ListItem key={event.id || index} divider>
              <ListItemIcon>
                {event.severity === "critical" || event.severity === "error" ? (
                  <ErrorIcon color="error" />
                ) : event.severity === "warning" ? (
                  <WarningIcon color="warning" />
                ) : (
                  <CheckIcon color="success" />
                )}
              </ListItemIcon>
              <ListItemText
                primary={`${event.event_type || event.eventType}${event.event_action ? "." + event.event_action : ""}`}
                secondary={`${new Date(event.created_at || event.createdAt).toLocaleString()} - ${event.resource_type || event.resourceType || "system"}`}
              />
            </ListItem>
          ))}
          {recentEvents.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No recent events"
                secondary="Audit events will appear here as they occur"
              />
            </ListItem>
          )}
        </List>
      </Box>
    );
  };

  const renderComplianceStatusTab = () => {
    const status = complianceStatus?.complianceStatus || {};
    const scores = status.scores || {};
    const weights = status.weights || {};
    const metrics = status.metrics || {};
    const controls = status.controls || {};
    const outstandingItems = status.outstandingItems || [];
    const overallScore = status.overallScore || 0;

    return (
      <Box sx={{ mt: 2 }}>
        <Typography variant="h6" gutterBottom>
          OCC 2011-12 / SR 11-7 Compliance Status
        </Typography>

        <Grid container spacing={3}>
          {/* Overall Status */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Overall Compliance Score
              </Typography>
              <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                <Box sx={{ width: "100%", mr: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={overallScore}
                    color={
                      overallScore >= 80
                        ? "success"
                        : overallScore >= 50
                          ? "warning"
                          : "error"
                    }
                    sx={{ height: 20, borderRadius: 2 }}
                  />
                </Box>
                <Typography variant="h6">{overallScore}%</Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Compliance by Category (Weighted Scores)
              </Typography>
              <Stack spacing={1}>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">
                    Model Cards ({weights.modelCards}%)
                  </Typography>
                  <Chip
                    label={`${scores.modelCards || 0}%`}
                    size="small"
                    color={
                      (scores.modelCards || 0) >= 80 ? "success" : "warning"
                    }
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">
                    Validation Schedule ({weights.validationSchedule}%)
                  </Typography>
                  <Chip
                    label={`${scores.validationSchedule || 0}%`}
                    size="small"
                    color={
                      (scores.validationSchedule || 0) >= 80
                        ? "success"
                        : "warning"
                    }
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">
                    Circuit Breakers ({weights.circuitBreakers}%)
                  </Typography>
                  <Chip
                    label={`${scores.circuitBreakers || 0}%`}
                    size="small"
                    color={
                      (scores.circuitBreakers || 0) >= 80
                        ? "success"
                        : "warning"
                    }
                  />
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2">
                    Audit Logging ({weights.auditLogging}%)
                  </Typography>
                  <Chip
                    label={`${scores.auditLogging || 0}%`}
                    size="small"
                    color={
                      (scores.auditLogging || 0) >= 80 ? "success" : "warning"
                    }
                  />
                </Box>
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Typography variant="subtitle2" gutterBottom>
                Control Status
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  icon={controls.modelCards ? <CheckIcon /> : <ErrorIcon />}
                  label="Model Cards"
                  size="small"
                  color={controls.modelCards ? "success" : "error"}
                />
                <Chip
                  icon={
                    controls.validationSchedule ? <CheckIcon /> : <ErrorIcon />
                  }
                  label="Validations"
                  size="small"
                  color={controls.validationSchedule ? "success" : "error"}
                />
                <Chip
                  icon={
                    controls.circuitBreakers ? <CheckIcon /> : <ErrorIcon />
                  }
                  label="Circuit Breakers"
                  size="small"
                  color={controls.circuitBreakers ? "success" : "error"}
                />
                <Chip
                  icon={controls.auditLogging ? <CheckIcon /> : <ErrorIcon />}
                  label="Audit Logging"
                  size="small"
                  color={controls.auditLogging ? "success" : "error"}
                />
              </Stack>
            </Paper>
          </Grid>

          {/* Metrics and Outstanding Items */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3, mb: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                Model Metrics
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="h4">
                    {metrics.totalModels || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Models
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="success.main">
                    {metrics.validated || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Validated
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="warning.main">
                    {metrics.pending || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Pending
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="h4" color="error.main">
                    {metrics.highRisk || 0}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    High Risk
                  </Typography>
                </Grid>
              </Grid>
            </Paper>

            <Paper sx={{ p: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Outstanding Compliance Items
              </Typography>
              <List dense>
                {outstandingItems.map((item, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      {item.type === "critical" ? (
                        <ErrorIcon color="error" />
                      ) : item.type === "warning" ? (
                        <WarningIcon color="warning" />
                      ) : (
                        <ScheduleIcon color="info" />
                      )}
                    </ListItemIcon>
                    <ListItemText primary={item.message} />
                  </ListItem>
                ))}
                {outstandingItems.length === 0 && (
                  <ListItem>
                    <ListItemIcon>
                      <CheckIcon color="success" />
                    </ListItemIcon>
                    <ListItemText primary="No outstanding compliance items" />
                  </ListItem>
                )}
              </List>
            </Paper>
          </Grid>
        </Grid>

        {/* Regulatory Reference */}
        <Paper sx={{ p: 2, mt: 2, bgcolor: "background.default" }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            Regulatory References
          </Typography>
          <Typography variant="body2" color="textSecondary">
            OCC 2011-12: Supervisory Guidance on Model Risk Management
            <br />
            SR 11-7: Guidance on Model Risk Management (Federal Reserve)
            <br />
            Key Requirements: Model Development, Model Validation, Model
            Governance
          </Typography>
        </Paper>
      </Box>
    );
  };

  if (loading && !modelCards.length) {
    return (
      <MainCard title="MRM Compliance Dashboard">
        <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
          <LinearProgress sx={{ width: "50%" }} />
        </Box>
      </MainCard>
    );
  }

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={2}>
          <ComplianceIcon />
          <Typography variant="h5">Model Risk Management Compliance</Typography>
        </Stack>
      }
      secondary={
        <Stack direction="row" spacing={1}>
          <Chip
            label="OCC 2011-12"
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label="SR 11-7"
            size="small"
            color="primary"
            variant="outlined"
          />
          <Tooltip title="Refresh Data">
            <IconButton onClick={loadData} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {renderOverviewCards()}

      <Box sx={{ mt: 3, borderBottom: 1, borderColor: "divider" }}>
        <Tabs
          value={activeTab}
          onChange={(_, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<ModelCardIcon />}
            iconPosition="start"
            label="Model Cards"
          />
          <Tab
            icon={<CircuitIcon />}
            iconPosition="start"
            label="Circuit Breakers"
          />
          <Tab icon={<AuditIcon />} iconPosition="start" label="Audit Log" />
          <Tab
            icon={<ComplianceIcon />}
            iconPosition="start"
            label="Compliance Status"
          />
        </Tabs>
      </Box>

      {activeTab === 0 && renderModelCardsTab()}
      {activeTab === 1 && renderCircuitBreakersTab()}
      {activeTab === 2 && renderAuditLogTab()}
      {activeTab === 3 && renderComplianceStatusTab()}
    </MainCard>
  );
};

export default MRMComplianceDashboard;
