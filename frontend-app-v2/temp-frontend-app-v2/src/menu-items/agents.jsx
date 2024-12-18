// assets
import { NodeCollapseOutlined, ProfileOutlined } from '@ant-design/icons';

// icons
const icons = {
  NodeCollapseOutlined,
  ProfileOutlined
};

// ==============================|| MENU ITEMS - EXTRA PAGES ||============================== //

const agents = {
  id: 'services',
  title: 'Agentic Workflow',
  type: 'group',
  children: [
    {
      id: 'workflow',
      title: 'Workflow',
      type: 'item',
      url: '/agentic/workflow',
      icon: icons.NodeCollapseOutlined
    },
    {
      id: 'settings',
      title: 'Settings',
      type: 'item',
      url: '/agentic/settings',
      icon: icons.ProfileOutlined,
    }
  ]
};

export default agents;
