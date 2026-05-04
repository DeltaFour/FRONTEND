import { Outlet } from "react-router-dom";
import { Box, Flex } from "@chakra-ui/react";
import {
  FaBusinessTime,
  FaClock,
  FaHome,
  FaUserPlus,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import Sidebar, { type SidebarItem } from "../../components/SideBar/Sidebar";
import GlobalHeader from "../../components/GlobalHeader/GlobalHeader";

const DashboardEmpresa = () => {
  const { user, logout } = useAuth();

  const menuItems: SidebarItem[] = [
    {
      label: "Início",
      to: "/dashboard-empresa/ponto",
      icon: FaHome,
      exact: true,
    },
    {
      label: "Funcionários",
      to: "/dashboard-empresa/funcionarios",
      icon: FaUsers,
    },
    {
      label: "Meu Ponto",
      to: "/dashboard-empresa/ponto",
      icon: FaClock,
    },
    {
      label: "Ponto de Terceiros",
      to: "/dashboard-empresa/ponto/terceiros",
      icon: FaUsers,
    },
    {
      label: "Turnos",
      to: "/dashboard-empresa/turnos",
      icon: FaBusinessTime,
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

export default DashboardEmpresa;
