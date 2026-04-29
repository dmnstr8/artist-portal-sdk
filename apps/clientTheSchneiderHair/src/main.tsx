import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {SiteCopyProvider} from './context/SiteCopyContext';
import {ThemeProvider} from './context/ThemeContext';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <SiteCopyProvider>
        <App />
      </SiteCopyProvider>
    </ThemeProvider>
  </StrictMode>,
);
