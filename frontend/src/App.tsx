import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { ClientProvider } from "./contexts/client-context";
import LoginPage from "./pages/login-page";
import RegisterPage from "./pages/register-page";
import DashboardPage from "./pages/dashboard-page";
import UploadPage from "./pages/upload-page";
import ProfilePage from "./pages/profile-page";
import AppLayout from "./components/app-layout";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClientProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/upload" element={<UploadPage />} />
              <Route path="/me" element={<ProfilePage />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
