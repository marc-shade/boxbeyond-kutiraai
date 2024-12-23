// assets
import { PartitionOutlined } from '@ant-design/icons';

// icons
const icons = {
  PartitionOutlined
};

// ==============================|| MENU ITEMS - EXTRA PAGES ||============================== //

const process = {
  id: 'services',
  title: 'Use Case Manager',
  type: 'group',
  children: [
    {
      id: 'processflow',
      title: 'Process Flow',
      type: 'item',
      url: 'http://localhost:5678',
      icon: icons.PartitionOutlined,
      target: true,
      external: false
    }
  ]
};

export default process;
