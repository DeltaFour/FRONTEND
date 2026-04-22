import { Link as RouterLink, Outlet } from "react-router-dom";
import { Box, Button, Flex, Text, VStack } from "@chakra-ui/react";
import { FaClock, FaSignOutAlt, FaUsers } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const DashboardEmpresa = () => {
  const { user, logout } = useAuth();

  return (
    <Flex minH="100vh" bg="gray.100">
      <Box
        w="64"
        bg="blue.800"
        color="white"
        display="flex"
        flexDirection="column"
      >
        <Box p={6}>
          <Text fontSize="2xl" fontWeight="extrabold">
            Empresa | {user?.name || "Dashboard"}
          </Text>
        </Box>

        <VStack align="stretch" flex={1} px={4} py={2}>
          <Box
            as={RouterLink}
            to="/dashboard-empresa/funcionarios"
            px={4}
            py={2.5}
            borderRadius="md"
            color="gray.100"
            _hover={{ bg: "blue.700" }}
          >
            <Flex align="center" gap={3}>
              <FaUsers />
              <Text>Funcionários</Text>
            </Flex>
          </Box>

          <Box
            as={RouterLink}
            to="/dashboard-empresa/ponto"
            px={4}
            py={2.5}
            borderRadius="md"
            color="gray.100"
            _hover={{ bg: "blue.700" }}
          >
            <Flex align="center" gap={3}>
              <FaClock />
              <Text>Meu Ponto</Text>
            </Flex>
          </Box>
        </VStack>

        <Box mt="auto" p={4} borderTopWidth="1px" borderColor="blue.700">
          <Text fontSize="sm" fontWeight="semibold" mb={2}>
            Perfil: {user?.role}
          </Text>
          <Button variant="ghost" colorPalette="red" size="sm" onClick={logout}>
            <FaSignOutAlt style={{ marginRight: 8 }} />
            Sair
          </Button>
        </Box>
      </Box>

      <Box flex={1} p={8} overflowY="auto">
        <Outlet />
      </Box>
    </Flex>
  );
};

export default DashboardEmpresa;
