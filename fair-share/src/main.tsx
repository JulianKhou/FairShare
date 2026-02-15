import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./hooks/auth/useAuth.tsx";
import Header from "./components/header/header.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Explore from "./pages/explore.tsx";
import Upload from "./pages/upload.tsx";
import MyVideos from "./pages/myVideos.tsx";
import LandingPage from "./pages/LandingPage.tsx";
import { ThemeProvider } from "./components/utility/theme-provider.tsx";
import ProfilePage from "./pages/profile.tsx";
import SettingsPage from "./pages/settings.tsx";
import { VideoSyncProvider } from "./components/utility/VideoSyncProvider.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <VideoSyncProvider>
          <BrowserRouter>
            {/* Der Header muss INNERHALB des BrowserRouter liegen */}
            <Header />

            <Routes>
              {/* Saubere URLs ohne .tsx oder /pages/ Präfix */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/my-videos" element={<MyVideos />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </BrowserRouter>
        </VideoSyncProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
