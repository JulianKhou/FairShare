import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./hooks/auth/useAuth.tsx";
import Header from "./components/header/header.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Explore from "./pages/explore.tsx";
import Upload from "./pages/upload.tsx";
import MyVideos from "./pages/myVideos.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        {/* Der Header muss INNERHALB des BrowserRouter liegen */}
        <Header />

        <Routes>
          {/* Saubere URLs ohne .tsx oder /pages/ Präfix */}
          <Route path="/" element={<Explore />} /> {/* Standardseite */}
          <Route path="/explore" element={<Explore />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/my-videos" element={<MyVideos />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
);
