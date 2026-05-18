import { Outlet } from "react-router-dom";
import { Box, Flex } from "@chakra-ui/react";
import { FaClock, FaUserPlus, FaUsers } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import Sidebar, { type SidebarItem } from "../components/Sidebar";
import GlobalHeader from "../components/GlobalHeader";

const DashboardEmpresa = () => {
  const { user, logout } = useAuth();

  const menuItems: SidebarItem[] = [
    {
      label: "Funcionários",
      to: "/dashboard-empresa/funcionarios",
      icon: FaUsers,
    },
    {
      label: "Novo Funcionário",
      to: "/dashboard-empresa/funcionarios/criar",
      icon: FaUserPlus,
    },
    {
      label: "Meu Ponto",
      to: "/dashboard-empresa/ponto",
      icon: FaClock,
    },
  ];

  return (
    <Flex h="100vh" bg="surface.muted" overflow="hidden">
      <Sidebar items={menuItems} userName={user?.name} onLogout={logout} />

      <Box flex={1} p={8} overflowY="auto" minH={0}>
        <GlobalHeader />
        <Outlet />
      </Box>
    </Flex>
  );
};

export default DashboardEmpresa;
