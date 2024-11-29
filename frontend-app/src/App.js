import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TuneIcon from '@mui/icons-material/Tune';
import { AppProvider } from '@toolpad/core/AppProvider';
import { DashboardLayout } from '@toolpad/core/DashboardLayout';
import SettingsPage from './pages/SettingsPage';
import FineTuneLandingPage from './pages/FineTuneLandingPage';
import FineTunePage from './pages/FineTunePage';
import DatasetLandingPage from './pages/DatasetLandingPage';
import DatasetIcon from '@mui/icons-material/Dataset';
import CastForEducationIcon from '@mui/icons-material/CastForEducation';
import ListIcon from '@mui/icons-material/List';
import ModelTrainingRoundedIcon from '@mui/icons-material/ModelTrainingRounded';
import AutoGenStudio from './components/AutoGenStudio';

const NAVIGATION = [
  {
    kind: 'header',
    title: 'Core Functionality',
  },
  {
    segment: 'fine-tune',
    title: 'Fine Tuning',
    icon: <DashboardIcon />,
    children: [
      {
        segment: 'dataset',
        title: 'Dataset',
        icon: <DatasetIcon />,
      },
      /*{
        segment: 'landing',
        title: 'Fine Tuned Models',
        icon: <ListIcon />
      },*/
      {
        segment: 'create',
        title: 'Tune A Model',
        icon: <ModelTrainingRoundedIcon />
      },
    ]
  },
  {
    segment: 'page-3',
    title: 'Agents',
    icon: <SupportAgentIcon />,
    children: [
     /* {
        segment: 'teachable',
        title: 'Teachable Agents',
        icon: <CastForEducationIcon />
      },*/
      {
        segment: 'studio',
        title: 'Autogen Studio',
        icon: <CastForEducationIcon />
      }
    ]
  },
  {
    segment: 'workflow',
    title: 'Process Workflow',
    icon: <AccountTreeIcon />
  },
  {
    kind: 'divider',
  },
  {
    kind: 'header',
    title: 'Utilities',
  },
  {
    segment: 'settings',
    title: 'Settings',
    icon: <TuneIcon />,
  },
];

function AppProviderBasic(props) {
  const [pathname, setPathname] = React.useState('/page');
  const [popup, setPopup] = React.useState(null);

  const openPopup = (url, title) => {

    if (popup) {
      popup.focus();
      return;
    }

    const width = 800;
    const height = 600;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);

    const _popup = window.open(
      url,
      title,
      `toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=yes, resizable=yes, width=${width}, height=${height}, top=${top}, left=${left}`
    );

    setPopup(_popup);
  };

  const router = React.useMemo(() => {
    return {
      pathname,
      searchParams: new URLSearchParams(),
      navigate: (path) => {
        if (path === '/workflow') {
          openPopup('http://localhost:5678/home', 'Workflow Management');
        } else {
          setPathname(String(path));
        }
      },
    };
  }, [pathname]);

  const renderPage = () => {
    switch (pathname) {
      case '/fine-tune/landing':
        return <FineTuneLandingPage />;
      case '/fine-tune/create':
        return <FineTunePage />
      case '/workflow':
        return null;
      case '/fine-tune/dataset':
        return <DatasetLandingPage />;
      case '/settings':
        return <SettingsPage />;
      case '/page-3/studio':
        return <AutoGenStudio />
      default:
        return ;
    }
  };
  return (
    <AppProvider
      navigation={NAVIGATION}
      branding={{
        logo: <img src={`${process.env.PUBLIC_URL}/rooot_logo.png`} alt="Rooot logo" />,
        title: '',
      }}
      router={router}
    >
      <DashboardLayout>
        {renderPage()}
      </DashboardLayout>

    </AppProvider>
  );
}

export default AppProviderBasic;