// /src/App.jsx
import { RouterProvider } from 'react-router-dom';
import router from 'routes';
import ThemeCustomization from 'themes';
import ScrollTop from 'components/ScrollTop';
import GlobalStyles from 'themes/GlobalStyles.jsx';
import { ThemeSettingsProvider } from 'contexts/ThemeContext';

export default function App() {
  return (
    <ThemeSettingsProvider>
      <ThemeCustomization>
        <GlobalStyles />
        <ScrollTop>
          <RouterProvider router={router} />
        </ScrollTop>
      </ThemeCustomization>
    </ThemeSettingsProvider>
  );
}
