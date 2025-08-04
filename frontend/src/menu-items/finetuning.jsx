// assets
import { AppstoreOutlined, AlignCenterOutlined } from '@ant-design/icons';


// icons
const icons = {
  AppstoreOutlined,
  AlignCenterOutlined
};

// ==============================|| MENU ITEMS - EXTRA PAGES ||============================== //

const finetuning = {
  id: 'services',
  title: 'Fine Tuning',
  type: 'group',
  children: [
    {
      id: 'dataset',
      title: 'Dataset',
      type: 'item',
      url: '/fine-tuning/datasets',
      icon: icons.AppstoreOutlined
    },
    {
      id: 'tune',
      title: 'Tune',
      type: 'item',
      url: '/tuning',
      icon: icons.AlignCenterOutlined
    }
  ]
};

export default finetuning;
