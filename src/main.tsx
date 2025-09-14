import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ApiAuthProvider } from './providers/ApiAuthProvider';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ApiAuthProvider>
      <App />
    </ApiAuthProvider>
  </StrictMode>
);
