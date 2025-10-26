/**
 * Overnight Automation Dashboard
 * Displays overnight automation system status, morning reports, and research discoveries
 */

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Stack,
  Link,
} from "@mui/material";
import {
  NightsStay as NightIcon,
  WbSunny as SunIcon,
  Science as ResearchIcon,
  Code as CodeIcon,
  Assessment as MetricsIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  CloudQueue as CloudIcon,
  Article as ArticleIcon,
  GitHub as GitHubIcon,
  Timeline as TemporalIcon,
} from "@mui/icons-material";
import ReactMarkdown from "react-markdown";
import MainCard from "components/MainCard";
import {
  overnightAutomationAPI,
  autokittehAPI,
  getOvernightStatus,
} from "api/overnight-automation-api";
import temporalAPI from "api/temporal-api";

export default function OvernightDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [error, setError] = useState(null);

  // Temporal state
  const [temporalHealth, setTemporalHealth] = useState(null);
  const [temporalNotifications, setTemporalNotifications] = useState([]);
  const [temporalStatus, setTemporalStatus] = useState(null);

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      navigate("/login", {
        replace: true,
        state: { from: "/overnight-automation" },
      });
      return;
    }
  }, [navigate]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getOvernightStatus();

      if (result.success) {
        setStatus(result.data);
      } else {
        setError(result.error || "Failed to load overnight status");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadTemporalData = async () => {
    try {
      const [health, notifications, status] = await Promise.all([
        temporalAPI.getHealth(),
        temporalAPI.getNotifications(),
        temporalAPI.getStatus(),
      ]);

      setTemporalHealth(health);
      setTemporalNotifications(notifications);
      setTemporalStatus(status);
    } catch (error) {
      console.error("Failed to load Temporal data:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      loadStatus();
      loadTemporalData();
      // Refresh every 5 minutes
      const interval = setInterval(() => {
        loadStatus();
        loadTemporalData();
      }, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, []);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  if (loading && !status) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !status) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
        <Button onClick={loadStatus} sx={{ ml: 2 }}>
          Retry
        </Button>
      </Alert>
    );
  }

  const { report, metrics, research, autokitteh } = status || {};
  const trigger = autokitteh?.triggers?.[0];
  const deployment = autokitteh?.deployment;
  const lastSession = autokitteh?.sessions?.[0];

  return (
    <Grid container spacing={3}>
      {/* Header Section */}
      <Grid item xs={12}>
        <MainCard>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Box display="flex" alignItems="center" gap={2}>
              <NightIcon fontSize="large" color="primary" />
              <Box>
                <Typography variant="h4">Overnight Automation</Typography>
                <Typography variant="body2" color="text.secondary">
                  System runs every night at 10 PM, completing by 6 AM
                </Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadStatus}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>
        </MainCard>
      </Grid>

      {/* Status Cards */}
      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ScheduleIcon color="primary" />
              <Typography variant="h6">Schedule</Typography>
            </Box>
            <Typography variant="h4">
              {trigger?.schedule || "0 22 * * *"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Every night at 10 PM
            </Typography>
            <Chip
              label={
                deployment?.state === "DEPLOYMENT_STATE_ACTIVE"
                  ? "Active"
                  : "Inactive"
              }
              color={
                deployment?.state === "DEPLOYMENT_STATE_ACTIVE"
                  ? "success"
                  : "default"
              }
              size="small"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <MetricsIcon color="primary" />
              <Typography variant="h6">Activities</Typography>
            </Box>
            <Typography variant="h4">
              {metrics?.activities_completed || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Last run completed
            </Typography>
            <Box display="flex" gap={1} mt={1}>
              <Chip
                icon={<CheckIcon />}
                label={`${metrics?.metrics?.research_papers_analyzed || 0} Papers`}
                size="small"
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ResearchIcon color="primary" />
              <Typography variant="h6">Discoveries</Typography>
            </Box>
            <Typography variant="h4">
              {research?.discoveries || metrics?.discoveries_made || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              New findings
            </Typography>
            <Box display="flex" gap={1} mt={1}>
              <Chip
                label={`${research?.papers?.length || 0} ArXiv`}
                size="small"
                variant="outlined"
              />
              <Chip
                label={`${research?.repos?.length || 0} GitHub`}
                size="small"
                variant="outlined"
              />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} md={3}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <ErrorIcon
                color={metrics?.errors_encountered > 0 ? "error" : "success"}
              />
              <Typography variant="h6">Status</Typography>
            </Box>
            <Typography variant="h4">
              {metrics?.errors_encountered || 0}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Errors encountered
            </Typography>
            <Chip
              label={lastSession?.state || "Ready"}
              color={lastSession?.state === "completed" ? "success" : "default"}
              size="small"
              sx={{ mt: 1 }}
            />
          </CardContent>
        </Card>
      </Grid>

      {/* Main Content Tabs */}
      <Grid item xs={12}>
        <MainCard>
          <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
            <Tabs value={activeTab} onChange={handleTabChange}>
              <Tab icon={<ArticleIcon />} label="Morning Report" />
              <Tab icon={<ResearchIcon />} label="Research Discoveries" />
              <Tab icon={<CloudIcon />} label="AutoKitteh Status" />
              <Tab icon={<MetricsIcon />} label="Metrics" />
              <Tab icon={<TemporalIcon />} label="Temporal Health" />
            </Tabs>
          </Box>

          {/* Tab 0: Morning Report */}
          {activeTab === 0 && (
            <Box sx={{ p: 3 }}>
              {report ? (
                <>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography variant="h5">
                      Morning Report -{" "}
                      {report.generatedAt
                        ? new Date(report.generatedAt).toLocaleDateString()
                        : "N/A"}
                    </Typography>
                    <Chip
                      label={report.id || "Latest"}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                  <Paper sx={{ p: 3, bgcolor: "background.default" }}>
                    {report.highlights && report.highlights.length > 0 ? (
                      <>
                        <Typography variant="h6" gutterBottom>
                          Highlights
                        </Typography>
                        <ul>
                          {report.highlights.map((highlight, idx) => (
                            <li key={idx}>{highlight}</li>
                          ))}
                        </ul>

                        {report.recommendations &&
                          report.recommendations.length > 0 && (
                            <>
                              <Typography
                                variant="h6"
                                gutterBottom
                                sx={{ mt: 3 }}
                              >
                                Recommendations
                              </Typography>
                              <ul>
                                {report.recommendations.map((rec, idx) => (
                                  <li key={idx}>{rec}</li>
                                ))}
                              </ul>
                            </>
                          )}

                        {report.summary && (
                          <>
                            <Typography
                              variant="h6"
                              gutterBottom
                              sx={{ mt: 3 }}
                            >
                              Summary
                            </Typography>
                            <Typography>
                              Tasks Completed: {report.summary.tasksCompleted ||
                                0}
                            </Typography>
                            <Typography>
                              Tasks Failed: {report.summary.tasksFailed || 0}
                            </Typography>
                          </>
                        )}
                      </>
                    ) : (
                      <Typography>No report data available</Typography>
                    )}
                  </Paper>
                </>
              ) : (
                <Alert severity="info">
                  No morning reports available yet. The overnight automation
                  will generate the first report tonight at 10 PM.
                </Alert>
              )}
            </Box>
          )}

          {/* Tab 1: Research Discoveries */}
          {activeTab === 1 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    <ArticleIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                    ArXiv Papers ({research?.papers?.length || 0})
                  </Typography>
                  <List>
                    {research?.papers?.length > 0 ? (
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
                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {paper.authors || "No authors"}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {paper.published} • {paper.categories}
                                </Typography>
                                {paper.url && (
                                  <Button
                                    size="small"
                                    href={paper.url}
                                    target="_blank"
                                    sx={{ mt: 0.5 }}
                                  >
                                    Read Paper
                                  </Button>
                                )}
                              </>
                            }
                          />
                        </ListItem>
                      ))
                    ) : (
                      <Alert severity="info">
                        No ArXiv papers discovered yet
                      </Alert>
                    )}
                  </List>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    <GitHubIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                    GitHub Repositories ({research?.repos?.length || 0})
                  </Typography>
                  <List>
                    {research?.repos?.length > 0 ? (
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
                    ) : (
                      <Alert severity="info">
                        No GitHub repositories discovered yet. Add GITHUB_TOKEN
                        environment variable for full trending data.
                      </Alert>
                    )}
                  </List>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Tab 2: AutoKitteh Status */}
          {activeTab === 2 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Deployment
                      </Typography>
                      <Chip
                        label={deployment?.state || "Unknown"}
                        color={
                          deployment?.state === "DEPLOYMENT_STATE_ACTIVE"
                            ? "success"
                            : "default"
                        }
                        sx={{ mb: 1 }}
                      />
                      <Typography variant="body2" color="text.secondary">
                        ID: {deployment?.deployment_id || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Build: {deployment?.build_id || "N/A"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Updated:{" "}
                        {deployment?.updated_at
                          ? new Date(deployment.updated_at).toLocaleString()
                          : "N/A"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Trigger
                      </Typography>
                      <Typography variant="body1">
                        {trigger?.name || "overnight_schedule"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Schedule: {trigger?.schedule || "0 22 * * *"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Type: {trigger?.source_type || "Schedule"}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {trigger?.trigger_id || "N/A"}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Latest Session
                      </Typography>
                      {lastSession ? (
                        <>
                          <Chip
                            label={lastSession.state || "Unknown"}
                            color={
                              lastSession.state === "completed"
                                ? "success"
                                : "default"
                            }
                            sx={{ mb: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">
                            ID: {lastSession.session_id}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Created:{" "}
                            {lastSession.created_at
                              ? new Date(
                                  lastSession.created_at,
                                ).toLocaleString()
                              : "N/A"}
                          </Typography>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No sessions yet
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Box mt={3}>
                <Typography variant="h6" gutterBottom>
                  Recent Sessions
                </Typography>
                <List>
                  {autokitteh?.sessions?.length > 0 ? (
                    autokitteh.sessions.slice(0, 5).map((session, index) => (
                      <ListItem key={index} divider>
                        <ListItemIcon>
                          {session.state === "completed" ? (
                            <CheckIcon color="success" />
                          ) : (
                            <CloudIcon color="primary" />
                          )}
                        </ListItemIcon>
                        <ListItemText
                          primary={session.session_id}
                          secondary={`${session.state} • ${session.created_at ? new Date(session.created_at).toLocaleString() : "N/A"}`}
                        />
                      </ListItem>
                    ))
                  ) : (
                    <Alert severity="info">No sessions found</Alert>
                  )}
                </List>
              </Box>
            </Box>
          )}

          {/* Tab 3: Metrics */}
          {activeTab === 3 && (
            <Box sx={{ p: 3 }}>
              {metrics ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Session Summary
                        </Typography>
                        <List>
                          <ListItem>
                            <ListItemText
                              primary="Duration"
                              secondary={`${(metrics.duration_hours * 60).toFixed(1)} minutes`}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Activities Completed"
                              secondary={metrics.activities_completed || 0}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Errors Encountered"
                              secondary={metrics.errors_encountered || 0}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Discoveries Made"
                              secondary={metrics.discoveries_made || 0}
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Detailed Metrics
                        </Typography>
                        <List>
                          <ListItem>
                            <ListItemText
                              primary="System Health Checks"
                              secondary={
                                metrics.metrics?.system_health_checks || 0
                              }
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Maintenance Tasks"
                              secondary={
                                metrics.metrics?.maintenance_tasks || 0
                              }
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Research Papers Analyzed"
                              secondary={
                                metrics.metrics?.research_papers_analyzed || 0
                              }
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Code Improvements"
                              secondary={
                                metrics.metrics?.code_improvements || 0
                              }
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary="Memory Optimizations"
                              secondary={
                                metrics.metrics?.memory_optimizations || 0
                              }
                            />
                          </ListItem>
                        </List>
                      </CardContent>
                    </Card>
                  </Grid>

                  <Grid item xs={12}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Timeline
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Session Start:{" "}
                          {metrics.session_start
                            ? new Date(metrics.session_start).toLocaleString()
                            : "N/A"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Session End:{" "}
                          {metrics.session_end
                            ? new Date(metrics.session_end).toLocaleString()
                            : "N/A"}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mt={1}
                        >
                          Morning Report Ready:{" "}
                          {metrics.morning_report_ready ? "Yes" : "No"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">
                  No metrics available yet. Metrics will be generated after the
                  first overnight run.
                </Alert>
              )}
            </Box>
          )}

          {/* Tab 4: Temporal Health */}
          {activeTab === 4 && (
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* Infrastructure Health Card */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Infrastructure Health
                      </Typography>
                      {temporalHealth ? (
                        <Box>
                          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                            <Chip
                              label={`${temporalHealth.health?.healthy_count || 0} Healthy`}
                              color="success"
                              size="small"
                            />
                            <Chip
                              label={`${temporalHealth.health?.unhealthy_count || 0} Unhealthy`}
                              color="error"
                              size="small"
                            />
                          </Stack>
                          <List>
                            {temporalHealth.health?.results?.map((service, index) => (
                              <ListItem key={index}>
                                <ListItemIcon>
                                  {service.status === "healthy" ? (
                                    <CheckIcon color="success" />
                                  ) : (
                                    <ErrorIcon color="error" />
                                  )}
                                </ListItemIcon>
                                <ListItemText
                                  primary={service.service}
                                  secondary={
                                    service.url || `Port: ${service.port || "N/A"}`
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                          <Button
                            variant="outlined"
                            href={temporalAPI.getWebUIUrl()}
                            target="_blank"
                            sx={{ mt: 2 }}
                          >
                            Open Temporal Web UI
                          </Button>
                        </Box>
                      ) : (
                        <Box display="flex" justifyContent="center" p={3}>
                          <CircularProgress />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Voice Notifications Card */}
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Voice Notifications
                      </Typography>
                      {temporalNotifications ? (
                        temporalNotifications.notifications?.length > 0 ? (
                          <List>
                            {temporalNotifications.notifications.map((notif, index) => (
                              <ListItem key={index}>
                                <ListItemText
                                  primary={notif.message}
                                  secondary={new Date(notif.timestamp).toLocaleString()}
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Alert severity="info">No notifications yet</Alert>
                        )
                      ) : (
                        <Box display="flex" justifyContent="center" p={3}>
                          <CircularProgress />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Workflow Status Card */}
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Workflow Status
                      </Typography>
                      {temporalStatus ? (
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">
                              Server Status
                            </Typography>
                            <Typography variant="h6">
                              {temporalStatus.status?.server_status || "Unknown"}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">
                              Active Workflows
                            </Typography>
                            <Typography variant="h6">
                              {temporalStatus.status?.active_workflows || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Typography variant="body2" color="text.secondary">
                              Worker Status
                            </Typography>
                            <Typography variant="h6">
                              {temporalStatus.status?.worker_status || "Unknown"}
                            </Typography>
                          </Grid>
                        </Grid>
                      ) : (
                        <Box display="flex" justifyContent="center" p={3}>
                          <CircularProgress />
                        </Box>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </MainCard>
      </Grid>
    </Grid>
  );
}
