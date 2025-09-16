// assets
import { Hub as HubIcon } from '@mui/icons-material';

// ==============================|| MENU ITEMS - AGENTIC SYSTEM ||============================== //

const agenticSystem = {
  id: 'agentic-system',
  title: 'Agentic System',
  type: 'group',
  children: [
    {
      id: 'unified-dashboard',
      title: 'Unified Dashboard',
      type: 'item',
      url: '/dashboard/default',
      icon: HubIcon,
      breadcrumbs: false
    }
  ]
};

export default agenticSystem;