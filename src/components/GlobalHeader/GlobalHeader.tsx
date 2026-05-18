import { useLocation } from "react-router-dom";
import { Box, Flex, Heading, IconButton, Text } from "@chakra-ui/react";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import UserProfileMenu from "../userProfile";
import { useColorMode } from "../../theme/colorMode";

const getPageInfo = (pathname: string) => {
  if (pathname === "/dashboard-empresa") {
    return {
      title: "Início da Empresa",
      subtitle: "Acompanhe operações e acesse os módulos principais.",
    };
  }

  if (pathname.startsWith("/dashboard-empresa/funcionarios/criar")) {
    return {
      title: "Novo Funcionário",
      subtitle: "Preencha os dados para cadastrar um novo colaborador.",
    };
  }

  if (pathname.startsWith("/dashboard-empresa/funcionarios/editar")) {
    return {
      title: "Editar Funcionário",
      subtitle: "Atualize os dados do colaborador selecionado.",
    };
  }

  if (pathname.startsWith("/dashboard-empresa/funcionarios")) {
    return {
      title: "Funcionários",
      subtitle: "Gerencie colaboradores e seus acessos.",
    };
  }

  if (pathname.startsWith("/dashboard-empresa/ponto/terceiros")) {
    return {
      title: "Ponto de Terceiros",
      subtitle: "Registre marcações em nome de um funcionário.",
    };
  }

  if (pathname.startsWith("/dashboard-empresa/ponto/rh")) {
    return {
      title: "Pontos por colaborador",
      subtitle: "Acompanhe marcações individuais e atrasos.",
    };
  }

  if (pathname.startsWith("/dashboard-empresa/ponto")) {
    return {
      title: "Meu Ponto",
      subtitle: "Registre sua própria jornada de trabalho.",
    };
  }

  if (pathname.startsWith("/dashboard-empresa/turnos")) {
    return {
      title: "Turnos",
      subtitle: "Defina e organize os turnos de trabalho.",
    };
  }

  if (pathname.startsWith("/dashboard-empresa")) {
    return {
      title: "Dashboard da Empresa",
    };
  }

  if (pathname === "/dashboard-funcionario") {
    return {
      title: "Início do Funcionário",
      subtitle: "Acesse rapidamente as ações do seu dia.",
    };
  }

  if (pathname.startsWith("/dashboard-funcionario/historico")) {
    return {
      title: "Histórico de Pontos",
      subtitle: "Consulte suas marcações anteriores.",
    };
  }

  if (pathname.startsWith("/dashboard-funcionario/ponto")) {
    return {
      title: "Bater Ponto",
      subtitle: "Registre entrada, saída e intervalos.",
    };
  }

  if (pathname.startsWith("/dashboard-funcionario")) {
    return {
      title: "Dashboard do Funcionário",
    };
  }

  return {
    title: "Painel",
  };
};

const GlobalHeader = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();

  const { title, subtitle } = getPageInfo(location.pathname);
  const toggleLabel =
    colorMode === "dark" ? "Ativar modo claro" : "Ativar modo escuro";

  return (
    <Box mb={6} pb={4} borderBottomWidth="1px" borderColor="border">
      <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
        <Box>
          <Heading size="lg" color="fg">
            {title}
          </Heading>
          {subtitle && (
            <Text mt={1} color="fg.muted" fontSize="sm">
              {subtitle}
            </Text>
          )}
        </Box>

        {user && (
          <Flex align="center" gap={2}>
            <IconButton
              variant="ghost"
              aria-label={toggleLabel}
              onClick={toggleColorMode}
            >
              {colorMode === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </IconButton>
            <UserProfileMenu />
          </Flex>
        )}
      </Flex>
    </Box>
  );
};

export default GlobalHeader;
