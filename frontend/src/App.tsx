import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./contexts/auth-context";
import { ClientProvider } from "./contexts/client-context";
import { Button } from "./components/ui/button";
import { Calendar } from "./components/ui/calendar";
import Example from "./components/example";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ClientProvider>
          <Routes>
            <Route path="/" element={
              <>
                <Button variant={"outline"} type="reset">ContaIA</Button>
                <Calendar />
                <Example />
              </>
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
