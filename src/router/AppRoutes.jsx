import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import DashboardAdmin from "../pages/DashboardAdmin";
import DashboardEmpresa from "../pages/DashboardEmpresa";
import ListarEmpresas from "../pages/Empresas/ListarEmpresas";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard-empresa" replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
        <Route path="/dashboard-admin" element={<DashboardAdmin />} />
        <Route path="/empresas" element={<ListarEmpresas />} />
      </Route>

      <Route
        element={<ProtectedRoute allowedRoles={["CompanyAdmin", "Employee"]} />}
      >
        <Route path="/dashboard-empresa" element={<DashboardEmpresa />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard-admin" />} />

      <Route path="*" element={<div>404 - Página Não Encontrada</div>} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
