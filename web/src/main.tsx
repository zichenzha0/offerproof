import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {BrowserRouter} from 'react-router-dom';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) {
  throw new Error('OfferProof root element is missing.');
}

try {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
} catch (error) {
  root.textContent = error instanceof Error ? error.message : 'Failed to start OfferProof.';
}
