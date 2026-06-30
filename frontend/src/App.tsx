import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { ClientProvider } from "./contexts/client-context";
import { ThemeProvider } from "./contexts/theme-context";
import LandingPage from "./pages/landing-page";
import LoginPage from "./pages/login-page";
import RegisterPage from "./pages/register-page";
import DashboardPage from "./pages/dashboard-page";
import ChatsPage from "./pages/chats-page";
import UploadPage from "./pages/upload-page";
import DataPage from "./pages/data-page";
import ProfilePage from "./pages/profile-page";
import AppLayout from "./components/app-layout";
import ClientLayout from "./components/client-layout";

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <ClientProvider>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/app" element={<AppLayout />}>
                <Route
                  index
                  element={
                    <div className="flex flex-1 items-center justify-center px-4">
                      <p className="text-sm text-muted-foreground text-center">
                        Selecciona un cliente del menú lateral para comenzar
                      </p>
                    </div>
                  }
                />
                <Route path="me" element={<ProfilePage />} />
                <Route path=":clientId" element={<ClientLayout />}>
                  <Route index element={<Navigate to="dashboard" replace />} />
                  <Route path="dashboard" element={<DashboardPage />} />
                  <Route path="chat" element={<ChatsPage />} />
                  <Route path="chat/:conversationId" element={<ChatsPage />} />
                  <Route path="upload" element={<UploadPage />} />
                  <Route path="data" element={<DataPage />} />
                </Route>
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ClientProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
