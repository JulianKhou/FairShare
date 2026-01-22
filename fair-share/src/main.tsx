import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css'; // Falls du Standard-Styles hast
import { AuthProvider } from './supabase/useAuth.tsx';

// ReactDOM.createRoot initialisiert den Rendering-Prozess im DOM-Element 'root'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Der AuthProvider umschließt die gesamte App. 
        Dadurch haben alle untergeordneten Komponenten Zugriff auf den Auth-State.
    */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>,
);