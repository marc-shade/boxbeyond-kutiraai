// assets
import { DashboardOutlined, ApiOutlined } from '@ant-design/icons';

// icons
const icons = {
  DashboardOutlined,
  ApiOutlined
};

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard = {
  id: 'group-dashboard',
  title: 'Navigation',
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: 'Dashboard',
      type: 'item',
      url: '/dashboard/default',
      icon: icons.DashboardOutlined,
      breadcrumbs: false
    },
    {
      id: 'mcp-dashboard',
      title: 'MCP Services',
      type: 'item',
      url: '/mcp',
      icon: icons.ApiOutlined,
      breadcrumbs: false
    }
  ]
};

export default dashboard;
