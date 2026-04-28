import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/layout/ErrorBoundary';
import { config } from './config';

// Apply theme + metadata from config so a single edit to src/config.ts updates
// everything (page title, social cards, accent color, background).
const root = document.documentElement;
root.style.setProperty('--color-primary', config.primaryColor);
root.style.setProperty('--color-surface', config.backgroundColor);

const fullTitle =
  config.siteTitle ??
  `${config.schoolName}${config.classYear ? ' ' + config.classYear : ''}: ${config.tagline}`;
document.title = fullTitle;

const description = `${config.subtitle} — ${config.schoolName} ${config.classYear} class map.`;

const setMetaContent = (selector: string, content: string) => {
  const el = document.querySelector(selector) as HTMLMetaElement | null;
  if (el) el.content = content;
};
setMetaContent('meta[property="og:title"]', fullTitle);
setMetaContent('meta[name="twitter:title"]', fullTitle);
setMetaContent('meta[property="og:description"]', description);
setMetaContent('meta[name="twitter:description"]', description);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
