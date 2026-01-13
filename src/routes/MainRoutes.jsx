import { lazy } from "react";

// project import
import Loadable from "components/Loadable";
import Dashboard from "layout/Dashboard";

const DashboardDefault = Loadable(lazy(() => import("pages/dashboard/index")));
const DatasetPage = Loadable(
  lazy(() => import("pages/fine-tuning/DatasetPage")),
);
const DatasetView = Loadable(
  lazy(() => import("pages/fine-tuning/DatasetView")),
);
const AgenticWorkflowPage = Loadable(
  lazy(() => import("pages/agentic-workflow/AgenticWorkflowPage")),
);
const WorkflowConfigPage = Loadable(
  lazy(() => import("pages/agentic-workflow/WorkflowConfigPage")),
);
const WorkflowExecutionPage = Loadable(
  lazy(() => import("pages/agentic-workflow/WorkflowExecutionPage")),
);
const FineTunePage = Loadable(
  lazy(() => import("pages/fine-tuning/FineTunePage")),
);
const ImageGenerator = Loadable(
  lazy(() => import("pages/utilities/ImageGenerator")),
);
const MCPDashboard = Loadable(
  lazy(() => import("components/RealMCPDashboard")),
);
const PersonaLabDashboard = Loadable(
  lazy(() => import("pages/persona-lab/PersonaLabDashboard")),
);

// NEW: Missing dashboard routes
const AgenticEcosystemDashboard = Loadable(
  lazy(() => import("components/AgenticEcosystemDashboard")),
);
const AutonomousOperationDashboard = Loadable(
  lazy(() => import("pages/autonomous-operation/AutonomousOperationDashboard")),
);
const MCPConfigDashboard = Loadable(
  lazy(() => import("pages/mcp-management/MCPConfigDashboard")),
);
const VoiceModeDashboard = Loadable(
  lazy(() => import("pages/voice-mode/VoiceModeDashboard")),
);
const OrchestratorDashboard = Loadable(
  lazy(() => import("pages/orchestrator/OrchestratorDashboard")),
);
const AILearningDashboard = Loadable(
  lazy(() => import("pages/orchestrator/AILearning")),
);
const SystemStatusDashboard = Loadable(
  lazy(() => import("pages/system-status/SystemStatusDashboard")),
);
const NeuralMemoryDashboard = Loadable(
  lazy(() => import("pages/neural-memory/NeuralMemoryDashboard")),
);
const OvernightAutomationDashboard = Loadable(
  lazy(() => import("pages/overnight-automation/OvernightDashboard")),
);
const NotificationsPage = Loadable(
  lazy(() => import("pages/notifications/NotificationsPage")),
);
const UsageAnalyticsDashboard = Loadable(
  lazy(() => import("components/UsageAnalyticsDashboard")),
);
const SessionCheckpointsDashboard = Loadable(
  lazy(() => import("components/SessionCheckpointsDashboard")),
);
const CustomAgentsDashboard = Loadable(
  lazy(() => import("components/CustomAgentsDashboard")),
);
const TamagotchiPetDashboard = Loadable(
  lazy(() => import("components/TamagotchiPetDashboard")),
);
const TelemetryMonitoringDashboard = Loadable(
  lazy(() => import("components/TelemetryMonitoringDashboard")),
);

// NEW: Copied from reference implementation
const AIStudioPage = Loadable(lazy(() => import("pages/ai-studio")));
const MetaCognitionDashboard = Loadable(
  lazy(() => import("pages/meta-cognition/MetaCognitionDashboard")),
);
const AutoKittehMonitoring = Loadable(
  lazy(
    () => import("pages/autokitteh-monitoring/AutoKittehIntegrationDashboard"),
  ),
);
const AgentLibrary = Loadable(lazy(() => import("pages/agents/AgentLibrary")));

// PHASE 3: OpenTelemetry & AIProxy Integration
const AIProxyDashboard = Loadable(
  lazy(() => import("components/AIProxyDashboard")),
);
const GrafanaDashboard = Loadable(
  lazy(() => import("components/GrafanaDashboard")),
);
const DockerServicesDashboard = Loadable(
  lazy(() => import("pages/docker-services/DockerServicesDashboard")),
);
const ScriptsManagementDashboard = Loadable(
  lazy(() => import("pages/scripts-management/ScriptsManagementDashboard")),
);

// Agent SDK Management
const AgentSDKDashboard = Loadable(lazy(() => import("pages/agent-sdk")));

// Agent Runtime Task Management
const AgentRuntimeDashboard = Loadable(
  lazy(() => import("pages/agent-runtime/AgentRuntimeDashboard")),
);

// Convex Backend Monitoring
const ConvexDashboard = Loadable(
  lazy(() => import("pages/convex-backend/ConvexDashboard")),
);

// Claude Settings Dashboard
const ClaudeSettingsDashboard = Loadable(
  lazy(() => import("pages/claude-settings/ClaudeSettingsDashboard")),
);

// Cluster Monitoring Dashboards
const ClusterBrainDashboard = Loadable(
  lazy(() => import("pages/cluster/ClusterBrainDashboard")),
);
const ClusterHealthMonitor = Loadable(
  lazy(() => import("pages/cluster/ClusterHealthMonitor")),
);
const ClusterNodesDashboard = Loadable(
  lazy(() => import("pages/cluster/ClusterNodesDashboard")),
);

// Platform Overview (Real-time Timeline)
const PlatformOverview = Loadable(
  lazy(() => import("pages/platform-overview/PlatformOverview")),
);

// AGI Dashboards
const AGIDashboard = Loadable(
  lazy(() => import("pages/agi/AGIDashboard")),
);
const KnowledgeGapsDashboard = Loadable(
  lazy(() => import("pages/agi/KnowledgeGapsDashboard")),
);

// MRM Compliance Dashboard
const MRMComplianceDashboard = Loadable(
  lazy(() => import("pages/mrm-compliance/MRMComplianceDashboard")),
);

// Threat Intelligence Dashboard Pages
const ThreatOverviewDashboard = Loadable(
  lazy(() => import("pages/threat-intelligence/ThreatOverviewDashboard")),
);
const IOCExplorer = Loadable(
  lazy(() => import("pages/threat-intelligence/IOCExplorer")),
);
const CISAKEVTracker = Loadable(
  lazy(() => import("pages/threat-intelligence/CISAKEVTracker")),
);
const TrendingCharts = Loadable(
  lazy(() => import("pages/threat-intelligence/TrendingCharts")),
);
const GeoMap = Loadable(
  lazy(() => import("pages/threat-intelligence/GeoMap")),
);
const ThreatTimeline = Loadable(
  lazy(() => import("pages/threat-intelligence/ThreatTimeline")),
);
const NetworkIntegration = Loadable(
  lazy(() => import("pages/threat-intelligence/NetworkIntegration")),
);
const ReputationChecker = Loadable(
  lazy(() => import("pages/threat-intelligence/ReputationChecker")),
);
const AlertSystem = Loadable(
  lazy(() => import("pages/threat-intelligence/AlertSystem")),
);

// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: "/",
  element: <Dashboard />,
  children: [
    {
      path: "",
      element: <DashboardDefault />,
    },
    {
      path: "dashboard/default",
      element: <DashboardDefault />,
    },
    {
      path: "fine-tuning/datasets",
      element: <DatasetPage />,
    },
    {
      path: "fine-tuning/datasets/:id",
      element: <DatasetView />,
    },
    {
      path: "agentic/workflow",
      element: <AgenticWorkflowPage />,
    },
    {
      path: "agentic/workflow/:workflowId/config",
      element: <WorkflowConfigPage />,
    },
    {
      path: "agentic/workflow/:workflowId/execute",
      element: <WorkflowExecutionPage />,
    },
    {
      path: "tuning",
      element: <FineTunePage />,
    },
    {
      path: "imagegen",
      element: <ImageGenerator />,
    },
    {
      path: "mcp",
      element: <MCPDashboard />,
    },
    {
      path: "persona-lab",
      element: <PersonaLabDashboard />,
    },
    // NEW: Missing dashboard routes
    {
      path: "agentic/ecosystem",
      element: <AgenticEcosystemDashboard />,
    },
    {
      path: "autonomous-operation",
      element: <AutonomousOperationDashboard />,
    },
    {
      path: "mcp-config",
      element: <MCPConfigDashboard />,
    },
    {
      path: "mcp-management",
      element: <MCPConfigDashboard />,
    },
    {
      path: "claude-settings",
      element: <ClaudeSettingsDashboard />,
    },
    {
      path: "claude-settings/:tab",
      element: <ClaudeSettingsDashboard />,
    },
    {
      path: "voice-mode",
      element: <VoiceModeDashboard />,
    },
    {
      path: "orchestrator",
      element: <OrchestratorDashboard />,
    },
    {
      path: "orchestrator/ai-learning",
      element: <AILearningDashboard />,
    },
    {
      path: "system-status",
      element: <SystemStatusDashboard />,
    },
    {
      path: "docker-services",
      element: <DockerServicesDashboard />,
    },
    {
      path: "scripts-management",
      element: <ScriptsManagementDashboard />,
    },
    {
      path: "neural-memory",
      element: <NeuralMemoryDashboard />,
    },
    {
      path: "overnight-automation",
      element: <OvernightAutomationDashboard />,
    },
    {
      path: "notifications",
      element: <NotificationsPage />,
    },
    {
      path: "usage-analytics",
      element: <UsageAnalyticsDashboard />,
    },
    {
      path: "session-checkpoints",
      element: <SessionCheckpointsDashboard />,
    },
    {
      path: "custom-agents",
      element: <CustomAgentsDashboard />,
    },
    {
      path: "tamagotchi-pet",
      element: <TamagotchiPetDashboard />,
    },
    {
      path: "telemetry-monitoring",
      element: <TelemetryMonitoringDashboard />,
    },
    // NEW: Routes for pages copied from reference implementation
    {
      path: "ai-studio",
      element: <AIStudioPage />,
    },
    {
      path: "meta-cognition",
      element: <MetaCognitionDashboard />,
    },
    {
      path: "autokitteh-monitoring",
      element: <AutoKittehMonitoring />,
    },
    {
      path: "agents",
      element: <AgentLibrary />,
    },
    // PHASE 3: OpenTelemetry & AIProxy Integration
    {
      path: "aiproxy",
      element: <AIProxyDashboard />,
    },
    {
      path: "grafana",
      element: <GrafanaDashboard />,
    },
    // Agent SDK Management
    {
      path: "agent-sdk",
      element: <AgentSDKDashboard />,
    },
    // Convex Backend Monitoring
    {
      path: "convex-backend",
      element: <ConvexDashboard />,
    },
    // Agent Runtime Task Management
    {
      path: "agent-runtime",
      element: <AgentRuntimeDashboard />,
    },
    // Cluster Monitoring
    {
      path: "cluster/brain",
      element: <ClusterBrainDashboard />,
    },
    {
      path: "cluster/health",
      element: <ClusterHealthMonitor />,
    },
    {
      path: "cluster/nodes",
      element: <ClusterNodesDashboard />,
    },
    // Platform Overview (Real-time Timeline)
    {
      path: "platform-overview",
      element: <PlatformOverview />,
    },
    // AGI Dashboards
    {
      path: "agi",
      element: <AGIDashboard />,
    },
    {
      path: "agi/knowledge-gaps",
      element: <KnowledgeGapsDashboard />,
    },
    // MRM Compliance Dashboard
    {
      path: "mrm-compliance",
      element: <MRMComplianceDashboard />,
    },
    // Threat Intelligence Dashboard
    {
      path: "threat-intelligence",
      element: <ThreatOverviewDashboard />,
    },
    {
      path: "threat-intelligence/ioc-explorer",
      element: <IOCExplorer />,
    },
    {
      path: "threat-intelligence/cisa-kev",
      element: <CISAKEVTracker />,
    },
    {
      path: "threat-intelligence/trends",
      element: <TrendingCharts />,
    },
    {
      path: "threat-intelligence/geo-map",
      element: <GeoMap />,
    },
    {
      path: "threat-intelligence/timeline",
      element: <ThreatTimeline />,
    },
    {
      path: "threat-intelligence/network",
      element: <NetworkIntegration />,
    },
    {
      path: "threat-intelligence/reputation",
      element: <ReputationChecker />,
    },
    {
      path: "threat-intelligence/alerts",
      element: <AlertSystem />,
    },
  ],
};

export default MainRoutes;
