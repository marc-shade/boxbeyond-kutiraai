import { lazy } from 'react';

// project import
import Loadable from 'components/Loadable';
import Dashboard from 'layout/Dashboard';

const DashboardDefault = Loadable(lazy(() => import('pages/dashboard/index')));
const DatasetPage = Loadable(lazy(() => import('pages/fine-tuning/DatasetPage')));
const DatasetView = Loadable(lazy(() => import('pages/fine-tuning/DatasetView')));
const AgenticWorkflowPage = Loadable(lazy(() => import('pages/agentic-workflow/AgenticWorkflowPage')));
const WorkflowConfigPage = Loadable(lazy(() => import('pages/agentic-workflow/WorkflowConfigPage')));
const WorkflowExecutionPage = Loadable(lazy(() => import('pages/agentic-workflow/WorkflowExecutionPage')));
const FineTunePage = Loadable(lazy(() => import('pages/fine-tuning/FineTunePage')));
const ImageGenerator = Loadable(lazy(() => import('pages/utilities/ImageGenerator')));
const Documentation = Loadable(lazy(() => import('pages/utilities/Documentation')));
// ==============================|| MAIN ROUTING ||============================== //

const MainRoutes = {
  path: '/',
  element: <Dashboard />,
  children: [
    {
      path: '',
      element: <DashboardDefault />
    },
    {
      path: 'dashboard/default',
      element: <DashboardDefault />
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
      path: 'agentic/workflow/:workflowId/config',
      element: <WorkflowConfigPage />
    },
    {
      path: 'agentic/workflow/:workflowId/execute',
      element: <WorkflowExecutionPage />
    },
    {
      path: 'tuning',
      element: <FineTunePage />
    },
    {
      path: 'imagegen',
      element: <ImageGenerator />
    },
    {
      path: 'documentation',
      element: <Documentation />
    }
  ]
};

export default MainRoutes;
