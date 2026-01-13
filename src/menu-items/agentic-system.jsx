// assets
import {
  Hub as HubIcon,
  AutoFixHigh as OrchestratorIcon,
  School as AILearningIcon,
  AccountTree as EcosystemIcon,
  Autorenew as AutonomousIcon,
  Storage as ConvexIcon,
  Timeline as TimelineIcon,
  Memory as ClusterIcon,
  Psychology as AGIIcon,
  VerifiedUser as ComplianceIcon,
} from "@mui/icons-material";

// ==============================|| MENU ITEMS - AGENTIC SYSTEM ||============================== //

const agenticSystem = {
  id: "agentic-system",
  title: "Agentic System",
  type: "group",
  children: [
    {
      id: "unified-dashboard",
      title: "Unified Dashboard",
      type: "item",
      url: "/dashboard/default",
      icon: HubIcon,
      breadcrumbs: false,
    },
    {
      id: "platform-overview",
      title: "Platform Overview",
      type: "item",
      url: "/platform-overview",
      icon: TimelineIcon,
      breadcrumbs: false,
    },
    {
      id: "agentic-ecosystem",
      title: "Agentic Ecosystem",
      type: "item",
      url: "/agentic/ecosystem",
      icon: EcosystemIcon,
      breadcrumbs: false,
    },
    {
      id: "autonomous-operation",
      title: "Autonomous Operation",
      type: "item",
      url: "/autonomous-operation",
      icon: AutonomousIcon,
      breadcrumbs: false,
    },
    {
      id: "mrm-compliance",
      title: "MRM Compliance",
      type: "item",
      url: "/mrm-compliance",
      icon: ComplianceIcon,
      breadcrumbs: false,
    },
    {
      id: "convex-backend",
      title: "Convex Backend",
      type: "item",
      url: "/convex-backend",
      icon: ConvexIcon,
      breadcrumbs: false,
    },
    {
      id: "orchestrator",
      title: "Self-Healing Orchestrator",
      type: "collapse",
      icon: OrchestratorIcon,
      children: [
        {
          id: "orchestrator-overview",
          title: "Overview",
          type: "item",
          url: "/orchestrator",
          breadcrumbs: false,
        },
        {
          id: "orchestrator-ai-learning",
          title: "AI Learning & Insights",
          type: "item",
          url: "/orchestrator/ai-learning",
          icon: AILearningIcon,
          breadcrumbs: false,
        },
      ],
    },
    {
      id: "cluster",
      title: "Cluster",
      type: "collapse",
      icon: ClusterIcon,
      children: [
        {
          id: "cluster-brain",
          title: "Cluster Brain",
          type: "item",
          url: "/cluster/brain",
          breadcrumbs: false,
        },
        {
          id: "cluster-health",
          title: "Health Monitor",
          type: "item",
          url: "/cluster/health",
          breadcrumbs: false,
        },
        {
          id: "cluster-nodes",
          title: "Nodes Dashboard",
          type: "item",
          url: "/cluster/nodes",
          breadcrumbs: false,
        },
      ],
    },
    {
      id: "agi",
      title: "AGI",
      type: "collapse",
      icon: AGIIcon,
      children: [
        {
          id: "agi-dashboard",
          title: "AGI Dashboard",
          type: "item",
          url: "/agi",
          breadcrumbs: false,
        },
        {
          id: "agi-knowledge-gaps",
          title: "Knowledge Gaps",
          type: "item",
          url: "/agi/knowledge-gaps",
          breadcrumbs: false,
        },
      ],
    },
  ],
};

export default agenticSystem;
