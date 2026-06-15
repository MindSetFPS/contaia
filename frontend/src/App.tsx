import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { ClientProvider } from "./contexts/client-context";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClientProvider>
          <Routes>
            <Route path="/" element={<div>ContaIA</div>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
