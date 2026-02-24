import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import { AuthProvider } from "./hooks/auth/useAuth.tsx";
import Header from "./components/header/header.tsx";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Explore from "./pages/explore.tsx";
import Upload from "./pages/upload.tsx";
import { Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage.tsx";
import { ThemeProvider } from "./components/utility/theme-provider.tsx";
import SettingsPage from "./pages/settings.tsx";
import { VideoSyncProvider } from "./components/utility/VideoSyncProvider.tsx";
import { Toaster } from "sonner";
import { AdminProtectedRoute } from "./components/utility/AdminProtectedRoute.tsx";
import AdminLayout from "./pages/admin/AdminLayout.tsx";
import AdminDashboard from "./pages/admin/AdminDashboard.tsx";
import AdminUsers from "./pages/admin/AdminUsers.tsx";
import AdminContracts from "./pages/admin/AdminContracts.tsx";
import AdminSupport from "./pages/admin/AdminSupport.tsx";
import UserDashboard from "./pages/dashboard/UserDashboard.tsx";
import Impressum from "./pages/legal/Impressum.tsx";
import Datenschutz from "./pages/legal/Datenschutz.tsx";
import AGB from "./pages/legal/AGB.tsx";
import Footer from "./components/Footer.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <VideoSyncProvider>
          <BrowserRouter basename="/">
            <div className="flex flex-col min-h-screen">
              <Header />

              <main className="flex-1 relative top-[70px]">
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/explore" element={<Explore />} />
                  <Route path="/upload" element={<Upload />} />
                  <Route
                    path="/my-videos"
                    element={<Navigate to="/explore?view=mine" replace />}
                  />
                  <Route path="/dashboard" element={<UserDashboard />} />
                  <Route path="/profile" element={<UserDashboard />} />
                  <Route path="/settings" element={<SettingsPage />} />

                  {/* Legal Pages */}
                  <Route path="/impressum" element={<Impressum />} />
                  <Route path="/datenschutz" element={<Datenschutz />} />
                  <Route path="/agb" element={<AGB />} />

                  {/* Admin Routes */}
                  <Route element={<AdminProtectedRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route
                        path="/admin/contracts"
                        element={<AdminContracts />}
                      />
                      <Route path="/admin/support" element={<AdminSupport />} />
                      <Route
                        path="/admin/settings"
                        element={
                          <div className="font-bold text-2xl">
                            System-Relevante Parameter (WIP)
                          </div>
                        }
                      />
                    </Route>
                  </Route>
                </Routes>
              </main>

              <Footer />
            </div>
            <Toaster position="top-right" richColors />
          </BrowserRouter>
        </VideoSyncProvider>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
