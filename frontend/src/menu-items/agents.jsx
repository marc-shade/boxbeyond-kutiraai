// assets
import { NodeCollapseOutlined } from '@ant-design/icons';

// icons
const icons = {
  NodeCollapseOutlined,
};

// ==============================|| MENU ITEMS - EXTRA PAGES ||============================== //

const agents = {
  id: 'agentic-workflow',
  title: 'Agentic Workflow',
  type: 'group',
  children: [
    {
      id: 'workflow',
      title: 'Workflow',
      type: 'item',
      url: '/agentic/workflow',
      icon: icons.NodeCollapseOutlined
    }
  ]
};

export default agents;
