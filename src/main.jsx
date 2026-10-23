import React from 'react';
import ReactDOM from 'react-dom/client';
import Root from './Root.jsx';
// Fontes servidas pelo próprio site (sem Google Fonts).
import '@fontsource/bebas-neue/latin-400.css';
import '@fontsource-variable/inter/index.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
