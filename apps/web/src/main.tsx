import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './lib/bandieClient';
import './index.css';
import './styles/breakpoints.css';
import './styles/brand.css';
import './styles/entitlements.css';
import './styles/calendar.css';
import './styles/gigs.css';
import './styles/infoHelp.css';
import './styles/songSuggestions.css';
import './styles/admin.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
