// assets
import { ChromeOutlined, SnippetsOutlined } from '@ant-design/icons';

// icons
const icons = {
  ChromeOutlined,
  SnippetsOutlined
};

// ==============================|| MENU ITEMS - SAMPLE PAGE & DOCUMENTATION ||============================== //

const support = {
  id: 'support',
  title: 'Support',
  type: 'group',
  children: [
    {
      id: 'documentation',
      title: 'Documentation',
      type: 'item',
      url: '/documentation',
      icon: icons.SnippetsOutlined,
      external: false,
      target: false
    }
  ]
};

export default support;
