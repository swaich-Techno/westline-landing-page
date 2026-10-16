import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import './fonts.css';
import './styles.css';
import { App } from './App';

const container = document.getElementById('root');
if (!container) throw new Error('The application root is missing.');

const path = window.location.pathname.replace(/\/+$/, '') || '/';
const app = <StrictMode><App path={path} /></StrictMode>;

if (container.querySelector('*')) {
  hydrateRoot(container, app);
} else {
  createRoot(container).render(app);
}
