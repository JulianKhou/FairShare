import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './components/loginGoogle/loginGoogle.js';
import './index.css'; // Falls du Standard-Styles hast
import { AuthProvider } from './hooks/auth/useAuth.tsx';
import ShowVideoList from './components/showVideos/showVideoList.tsx';
import LoadVideosButton from './components/showVideos/loadVideosButton.tsx';
import Header from './components/header/header.tsx';

// ReactDOM.createRoot initialisiert den Rendering-Prozess im DOM-Element 'root'
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* Der AuthProvider umschließt die gesamte App. 
        Dadurch haben alle untergeordneten Komponenten Zugriff auf den Auth-State.
    */}
    <AuthProvider>
      <Header />
      <App />
      <LoadVideosButton />
      <ShowVideoList />
    </AuthProvider>
  </React.StrictMode>,
);