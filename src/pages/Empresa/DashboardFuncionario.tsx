import { Outlet } from "react-router-dom";
import { Box, Flex } from "@chakra-ui/react";
import {
	FaClock,
	FaHistory,
	FaHome,
	FaExclamationTriangle,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import Sidebar, { type SidebarItem } from "../../components/SideBar/Sidebar";
import GlobalHeader from "../../components/GlobalHeader/GlobalHeader";

const DashboardFuncionario = () => {
	const { user, logout } = useAuth();

	const menuItems: SidebarItem[] = [
		{
			label: "Início",
			to: "/dashboard-funcionario",
			icon: FaHome,
			exact: true,
		},
		{
			label: "Bater Ponto",
			to: "/dashboard-funcionario/ponto",
			icon: FaClock,
		},
		{
			label: "Ponto em atraso",
			to: "/dashboard-funcionario/ponto-atraso",
			icon: FaExclamationTriangle,
		},
		{
			label: "Histórico",
			to: "/dashboard-funcionario/historico",
			icon: FaHistory,
		},
	];

	return (
		<Flex h="100vh" bg="gray.100" overflow="hidden">
			<Sidebar items={menuItems} userName={user?.name} onLogout={logout} />

			<Box flex={1} p={8} overflowY="auto" minH={0}>
				<GlobalHeader />
				<Outlet />
			</Box>
		</Flex>
	);
};

export default DashboardFuncionario;
