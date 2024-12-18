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
      id: 'sample-page',
      title: 'Sample Page',
      type: 'item',
      url: '/sample-page',
      icon: icons.ChromeOutlined
    },
    {
      id: 'documentation',
      title: 'Documentation',
      type: 'item',
      url: 'https://codedthemes.gitbook.io/mantis/',
      icon: icons.SnippetsOutlined,
      external: true,
      target: true
    }
  ]
};

export default support;
