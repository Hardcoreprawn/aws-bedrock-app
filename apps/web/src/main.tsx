import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeAuth } from './auth';
import './styles.css';

/**
 * Initializes auth state before rendering the root React tree.
 */
async function bootstrap() {
  await initializeAuth();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

void bootstrap();
