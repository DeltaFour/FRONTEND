import { useLocation } from "react-router-dom";
import { Box, Flex, Heading, Text } from "@chakra-ui/react";
import { useAuth } from "../../context/AuthContext";
import UserProfileMenu from "../userProfile";

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

  const { title, subtitle } = getPageInfo(location.pathname);

  return (
    <Box mb={6} pb={4} borderBottomWidth="1px" borderColor="primary.500">
      <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
        <Box>
          <Heading size="lg" color="gray.800">
            {title}
          </Heading>
          {subtitle && (
            <Text mt={1} color="gray.500" fontSize="sm">
              {subtitle}
            </Text>
          )}
        </Box>

        {user && (
          <Box textAlign="right">
            <Text fontSize="sm" color="gray.600">
              <UserProfileMenu />
            </Text>
          </Box>
        )}
      </Flex>
    </Box>
  );
};

export default GlobalHeader;
