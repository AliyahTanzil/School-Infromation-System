import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import './ai-intelligence.css';
import './iot.css';
import './tenant-admin.css';
import './billing.css';
import './platform-admin.css';
import './security-admin.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
