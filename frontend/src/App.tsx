import { Navigate, Route, Routes } from "react-router-dom";

import { hasAuthToken } from "./auth/auth-storage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return hasAuthToken() ? children : <Navigate to="/login" replace />;
}

function DashboardPlaceholder() {
  return (
    <main style={{ padding: "3rem" }}>
      <h1>Dashboard</h1>
      <p>Autenticação concluída. O dashboard será implementado na próxima etapa.</p>
    </main>
  );
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPlaceholder />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to={hasAuthToken() ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
}
