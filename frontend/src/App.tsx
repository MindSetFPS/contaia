import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { ClientProvider } from "./contexts/client-context";
import { ThemeProvider } from "./contexts/theme-context";
import LandingPage from "./pages/landing-page";
import LoginPage from "./pages/login-page";
import RegisterPage from "./pages/register-page";
import ProfilePage from "./pages/profile-page";
import AppLayout from "./components/app-layout";
import MainTabs from "./components/main-tabs";

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
                <Route index element={<MainTabs />} />
                <Route path="me" element={<ProfilePage />} />
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
