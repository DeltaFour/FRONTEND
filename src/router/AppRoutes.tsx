import {
	BrowserRouter,
	Navigate,
	Outlet,
	Route,
	Routes,
} from "react-router-dom";
import Login from "../pages/Login/Login";
import DashboardEmpresa from "../pages/Empresa/DashboardEmpresa";
import ListarFuncionarios from "../pages/Funcionarios/ListarFuncionarios";
import CriarFuncionario from "../pages/Funcionarios/CriarFuncionario";
import EditarFuncionario from "../pages/Funcionarios/EditarFuncionario";
import { GerenciarTurnos } from "../pages/Empresa/GerenciarTurnos";
import PontoEletronico from "../pages/Empresa/PontoEletronico";
import PontoEmAtraso from "../pages/Empresa/PontoEmAtraso";
import PontoParaFuncionario from "../pages/Empresa/PontoParaFuncionario";
import FiltrarPontoRH from "../pages/Empresa/FiltrarPontoRH";
import DashboardFuncionario from "../pages/Empresa/DashboardFuncionario";
import HistoricoPontos from "../pages/Empresa/HistoricoPontos";
import { useAuth } from "../context/AuthContext";

interface ProtectedRouteProps {
	allowedRoles?: string[];
}

const ProtectedRoute = ({ allowedRoles = [] }: ProtectedRouteProps) => {
	const { user, isAuthenticated } = useAuth();

	if (!isAuthenticated) {
		return <Navigate to="/v1/login" replace />;
	}

	if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
		const fallbackPath =
			user.role === "EMPLOYEE"
				? "/dashboard-funcionario"
				: "/dashboard-empresa";
		return <Navigate to={fallbackPath} replace />;
	}

	return <Outlet />;
};

const AppRoutes = () => (
	<BrowserRouter>
		<Routes>
			<Route path="/v1/login" element={<Login />} />

			<Route
				element={
					<ProtectedRoute allowedRoles={["SUPER_ADMIN", "ADMIN", "RH"]} />
				}
			>
				<Route path="/dashboard-empresa" element={<DashboardEmpresa />}>
					<Route index element={<ListarFuncionarios />} />
					<Route path="funcionarios" element={<ListarFuncionarios />} />
					<Route path="funcionarios/criar" element={<CriarFuncionario />} />
					<Route
						path="funcionarios/editar/:id"
						element={<EditarFuncionario />}
					/>
					<Route path="ponto" element={<PontoEletronico />} />
					<Route path="ponto/rh" element={<FiltrarPontoRH />} />
					<Route path="ponto/terceiros" element={<PontoParaFuncionario />} />
					<Route path="turnos" element={<GerenciarTurnos />} />
				</Route>
			</Route>

			<Route element={<ProtectedRoute allowedRoles={["EMPLOYEE"]} />}>
				<Route path="/dashboard-funcionario" element={<DashboardFuncionario />}>
					<Route index element={<PontoEletronico />} />
					<Route path="ponto" element={<PontoEletronico />} />
					<Route path="ponto-atraso" element={<PontoEmAtraso />} />
					<Route path="historico" element={<HistoricoPontos />} />
				</Route>
			</Route>

			<Route path="/" element={<Navigate to="/v1/login" />} />
			<Route path="*" element={<div>404 - Página Não Encontrada</div>} />
		</Routes>
	</BrowserRouter>
);

export default AppRoutes;
