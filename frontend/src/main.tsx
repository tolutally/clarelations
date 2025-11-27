import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../app/app';
import './index.css';

console.log('main.tsx loaded!');

const rootElement = document.getElementById('root');
console.log('Root element:', rootElement);

if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log('React app rendered successfully');
} catch (error) {
  console.error('Error rendering app:', error);
  rootElement.innerHTML = `<div style="padding: 20px; color: red;">
    <h1>Error loading app</h1>
    <pre>${error}</pre>
  </div>`;
}
