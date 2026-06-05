import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, Flex } from "@chakra-ui/react";
import {
  FaClock,
  FaFileSignature,
  FaHistory,
  FaHome,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import Sidebar, { type SidebarItem } from "../../components/SideBar/Sidebar";
import GlobalHeader from "../../components/GlobalHeader/GlobalHeader";

const DashboardFuncionario = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const menuItems: SidebarItem[] = [
    {
      label: "Início",
      to: "/dashboard-funcionario",
      icon: FaHome,
      exact: true,
      category: "dashboard",
    },
    {
      label: "Bater Ponto",
      to: "/dashboard-funcionario/ponto",
      icon: FaClock,
      category: "ponto",
    },
    {
      label: "Folha de Ponto",
      to: "/dashboard-funcionario/timesheet",
      icon: FaFileSignature,
      category: "ponto",
    },
    {
      label: "Ponto em atraso",
      to: "/dashboard-funcionario/ponto-atraso",
      icon: FaExclamationTriangle,
      category: "ponto",
    },
    {
      label: "Histórico",
      to: "/dashboard-funcionario/historico",
      icon: FaHistory,
      category: "ponto",
    },
  ];

  return (
    <Flex h="100vh" bg="surface.muted" overflow="hidden">
      <Sidebar
        items={menuItems}
        userName={user?.name}
        onLogout={logout}
        isMobileOpen={isMobileSidebarOpen}
        onMobileClose={() => setIsMobileSidebarOpen(false)}
      />

      <Box flex={1} p={{ base: 3, md: 8 }} overflowY="auto" minH={0}>
        <GlobalHeader onMenuClick={() => setIsMobileSidebarOpen(true)} />
        <Box key={location.pathname} className="animate-fade-in">
          <Outlet />
        </Box>
      </Box>
    </Flex>
  );
};

export default DashboardFuncionario;
