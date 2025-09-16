// assets
import {
  AppstoreAddOutlined,
  AntDesignOutlined,
  BarcodeOutlined,
  BgColorsOutlined,
  FontSizeOutlined,
  PictureOutlined,
  QrcodeOutlined
} from '@ant-design/icons';

// icons
const icons = {
  QrcodeOutlined,
  FontSizeOutlined,
  BgColorsOutlined,
  BarcodeOutlined,
  AntDesignOutlined,
  PictureOutlined,
  AppstoreAddOutlined
};

// ==============================|| MENU ITEMS - UTILITIES ||============================== //

const utilities = {
  id: 'utilities',
  title: 'Utilities',
  type: 'group',
  children: [
    {
      id: 'vector-store',
      title: 'Vector Store',
      type: 'item',
      url: 'http://localhost:6333/dashboard',
      icon: icons.QrcodeOutlined,
      external: true,
      target: true
    },
    {
      id: 'image-generator',
      title: 'Image Generator',
      type: 'item',
      icon: icons.PictureOutlined,
      url: '/imagegen',
    }
  ]
};

export default utilities;
