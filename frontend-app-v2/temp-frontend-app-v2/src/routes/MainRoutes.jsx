import { lazy } from 'react';

// project import
import Loadable from 'components/Loadable';
import Dashboard from 'layout/Dashboard';

const Color = Loadable(lazy(() => import('pages/component-overview/color')));
const Typography = Loadable(lazy(() => import('pages/component-overview/typography')));
const Shadow = Loadable(lazy(() => import('pages/component-overview/shadows')));
const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/index')));

// render - sample page
const SamplePage = Loadable(lazy(() => import('pages/extra-pages/sample-page')));
const DatasetPage = Loadable(lazy(() => import('pages/fine-tuning/DatasetPage')));
const DatasetView = Loadable(lazy(() => import('pages/fine-tuning/DatasetView')));
const AgenticWorkflowPage = Loadable(lazy(() => import('pages/agentic-workflow/AgenticWorkflowPage')));
const AgentSettings = Loadable(lazy(() => import('pages/agentic-workflow/AgentSettings')));
const WorkflowConfigPage = Loadable(lazy(() => import('pages/agentic-workflow/WorkflowConfigPage')));
const WorkflowExecutionPage = Loadable(lazy(() => import('pages/agentic-workflow/WorkflowExecutionPage')));
const FineTunePage = Loadable(lazy(() => import('pages/fine-tuning/FineTunePage')));
// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <Dashboard />,
  children: [
    {
      path: '/',
      element: <DashboardDefault />
    },
    {
      path: 'color',
      element: <Color />
    },
    {
      path: 'dashboard',
      children: [
        {
          path: 'default',
          element: <DashboardDefault />
        }
      ]
    },
    {
      path: 'sample-page',
      element: <SamplePage />
    },
    {
      path: 'shadow',
      element: <Shadow />
    },
    {
      path: 'typography',
      element: <Typography />
    },
    {
      path: 'fine-tuning/datasets',
      element: <DatasetPage />
    },
    {
      path: 'fine-tuning/datasets/:id',
      element: <DatasetView />
    },
    {
      path: 'agentic/workflow',
      element: <AgenticWorkflowPage />
    },
    {
      path: 'agentic/settings',
      element: <AgentSettings />
    },
    {
      path : "agentic/workflow/:workflowId/config", 
      element: <WorkflowConfigPage />
    },
    {
      path : "agentic/workflow/:workflowId/execute", 
      element: <WorkflowExecutionPage />
    },
    {
      path: 'tuning/',
      element: <FineTunePage />
    },
    
  ]
};

export default MainRoutes;
