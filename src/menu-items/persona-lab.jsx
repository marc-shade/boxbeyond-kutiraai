// assets
import { UserOutlined, ExperimentOutlined, TeamOutlined } from '@ant-design/icons';

// icons
const icons = {
  UserOutlined,
  ExperimentOutlined, 
  TeamOutlined
};

// ==============================|| MENU ITEMS - PERSONA LAB ||============================== //

const personaLab = {
  id: 'group-persona-lab',
  title: 'Persona Lab',
  type: 'group',
  children: [
    {
      id: 'persona-lab-dashboard',
      title: 'Persona Lab',
      type: 'item',
      url: '/persona-lab',
      icon: icons.UserOutlined,
      breadcrumbs: false
    }
  ]
};

export default personaLab;