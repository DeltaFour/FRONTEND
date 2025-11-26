import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "../pages/Login";
import DashboardAdmin from "../pages/DashboardAdmin";
import DashboardEmpresa from "../pages/DashboardEmpresa";
import ListarEmpresas from "../pages/Empresas/ListarEmpresas";
import CriarEmpresa from "../pages/Empresas/CriarEmpresa";
import EditarEmpresa from "../pages/Empresas/EditarEmpresa";
import ListarFuncionarios from "../pages/Funcionarios/ListarFuncionarios";
import PontoEletronico from "../pages/PontoEletronico";
import GerenciarTurnos from "../pages/GerenciarTurnos";
import PontoParaFuncionario from "../pages/PontoParaFuncionario";

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="v1/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard-empresa" replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="v1/login" element={<Login />} />

      <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
        <Route path="/dashboard-admin" element={<DashboardAdmin />}>
          <Route index element={<ListarEmpresas />} />

          <Route path="empresas" element={<ListarEmpresas />} />

          <Route path="empresas/criar" element={<CriarEmpresa />} />

          <Route path="empresas/editar/:id" element={<EditarEmpresa />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["ADMIN", "employee"]} />}>
        <Route path="/dashboard-empresa" element={<DashboardEmpresa />}>
          <Route index element={<ListarFuncionarios />} />
          <Route path="funcionarios" element={<ListarFuncionarios />} />
          <Route path="ponto" element={<PontoEletronico />} />
          <Route path="ponto/terceiros" element={<PontoParaFuncionario />} />
          <Route path="turnos" element={<GerenciarTurnos />} />
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/dashboard-admin" />} />

      <Route path="*" element={<div>404 - Página Não Encontrada</div>} />
    </Routes>
  </BrowserRouter>
);

export default AppRoutes;
