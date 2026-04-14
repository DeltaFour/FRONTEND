import { Link as RouterLink, Outlet } from "react-router-dom";
import { Box, Button, Flex, Link, Text, VStack } from "@chakra-ui/react";
import { useAuth } from "../context/AuthContext";

const DashboardAdmin = () => {
  const { user, logout } = useAuth();

  return (
    <Flex minH="100vh" bg="gray.100">
      <Box
        w="64"
        bg="gray.800"
        color="white"
        p={4}
        display="flex"
        flexDirection="column"
      >
        <Text fontSize="xl" fontWeight="bold" mb={6}>
          Painel do Admin
        </Text>

        <VStack align="stretch" flex={1}>
          <Box
            as={RouterLink}
            to="/dashboard-admin"
            px={4}
            py={2.5}
            borderRadius="md"
            fontWeight="medium"
            color="gray.100"
            bg="gray.800"
            _hover={{ bg: "gray.700" }}
          >
            Empresas
          </Box>
        </VStack>

        <Box mt="auto">
          <Text fontSize="sm">Logado como: {user?.name}</Text>
          <Button
            variant="ghost"
            colorPalette="red"
            size="sm"
            mt={2}
            onClick={logout}
          >
            Sair
          </Button>
        </Box>
      </Box>

      <Box flex={1} p={8} overflowY="auto" color="gray.800">
        <Text fontSize="3xl" fontWeight="semibold" mb={6}>
          Dashboard Administrativa
        </Text>
        <Text mb={6}>
          Bem-vindo, Super Admin! Use o menu lateral para gerenciar.
        </Text>
        <Outlet />
      </Box>
    </Flex>
  );
};

export default DashboardAdmin;
