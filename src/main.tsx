import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ApiAuthProvider } from './providers/ApiAuthProvider';

// Debug: Log all environment variables at startup
console.log('🚀 App Starting - Environment Debug:', {
  all_env: import.meta.env,
  VITE_API_URL: import.meta.env.VITE_API_URL,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  NODE_ENV: import.meta.env.NODE_ENV,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApiAuthProvider>
      <App />
    </ApiAuthProvider>
  </StrictMode>
);
