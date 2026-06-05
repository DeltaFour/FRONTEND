import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Box, Flex } from "@chakra-ui/react";
import {
  FaCalendarAlt,
  FaChartBar,
  FaClock,
  FaFileSignature,
  FaHandshake,
  FaHome,
  FaSitemap,
  FaUserCheck,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import Sidebar, { type SidebarItem } from "../../components/SideBar/Sidebar";
import GlobalHeader from "../../components/GlobalHeader/GlobalHeader";

const DashboardEmpresa = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const menuItems: SidebarItem[] = [
    {
      label: "Início",
      to: "/dashboard-empresa",
      icon: FaHome,
      exact: true,
      category: "dashboard",
    },
    {
      label: "Funcionários",
      to: "/dashboard-empresa/funcionarios",
      icon: FaUsers,
      category: "gestao",
    },
    {
      label: "Departamentos",
      to: "/dashboard-empresa/departamentos",
      icon: FaSitemap,
      category: "gestao",
    },
    {
      label: "Turnos",
      to: "/dashboard-empresa/turnos",
      icon: FaCalendarAlt,
      category: "gestao",
    },
    {
      label: "Meu Ponto",
      to: "/dashboard-empresa/ponto",
      icon: FaClock,
      category: "ponto",
    },
    {
      label: "Ponto de Terceiros",
      to: "/dashboard-empresa/ponto/terceiros",
      icon: FaHandshake,
      category: "ponto",
    },
    {
      label: "Ponto RH",
      to: "/dashboard-empresa/ponto/rh",
      icon: FaUserCheck,
      category: "ponto",
    },
    {
      label: "Folha de Ponto",
      to: "/dashboard-empresa/timesheet",
      icon: FaFileSignature,
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

export default DashboardEmpresa;
