import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './all.min.css'
import App from './App';
import { I18nProvider } from "./i18n/I18nProvider";
import { BrowserRouter } from 'react-router-dom';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <I18nProvider>
        <App />
      </I18nProvider>
    </BrowserRouter>
  </React.StrictMode>
);
