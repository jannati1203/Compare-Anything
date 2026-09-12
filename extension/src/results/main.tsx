import React from 'react';
import ReactDOM from 'react-dom/client';
import { Results } from './Results';

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <Results />
    </React.StrictMode>
  );
}
