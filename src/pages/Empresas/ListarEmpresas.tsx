import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";
import api from "../../services/api";

interface Empresa {
  id: number | string;
  name: string;
  cnpj: string;
  isActive: boolean;
}

interface CompanyListResponse {
  data?: Empresa[];
}

const ListarEmpresas = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get<CompanyListResponse>(
        "/admin-control/company",
        { withCredentials: true },
      );
      setEmpresas(response.data.data ?? []);
    } catch {
      setError("Não foi possível carregar a lista de empresas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const toggleStatus = async (companyId: Empresa["id"]) => {
    try {
      await api.post(
        `/admin-control/company/${companyId}/change-status`,
        {},
        { withCredentials: true },
      );

      setEmpresas((prev) =>
        prev.map((empresa) =>
          empresa.id === companyId
            ? { ...empresa, isActive: !empresa.isActive }
            : empresa,
        ),
      );
    } catch {
      window.alert("Não foi possível alterar o status da empresa.");
    }
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" py={10} gap={3}>
        <Spinner />
        <Text>Carregando lista de empresas...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Box
        bg="red.50"
        color="red.700"
        p={4}
        borderRadius="md"
        borderWidth="1px"
        borderColor="red.300"
      >
        <Text>{error}</Text>
      </Box>
    );
  }

  return (
    <Box bg="white" p={6} borderRadius="lg" boxShadow="xl">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg" color="gray.700">
          Gerenciamento de Empresas
        </Heading>

        <Button
          as={RouterLink}
          to="/dashboard-admin/empresas/criar"
          colorPalette="green"
        >
          <FaPlus style={{ marginRight: 8 }} />
          Nova Empresa
        </Button>
      </Flex>

      <Box overflowX="auto" borderWidth="1px" borderRadius="md">
        <Box as="table" width="100%" borderCollapse="collapse">
          <Box as="thead" bg="gray.50">
            <Box as="tr">
              <Box
                as="th"
                px={6}
                py={3}
                textAlign="left"
                fontSize="xs"
                color="gray.500"
                textTransform="uppercase"
              >
                Nome
              </Box>
              <Box
                as="th"
                px={6}
                py={3}
                textAlign="left"
                fontSize="xs"
                color="gray.500"
                textTransform="uppercase"
              >
                CNPJ
              </Box>
              <Box
                as="th"
                px={6}
                py={3}
                textAlign="center"
                fontSize="xs"
                color="gray.500"
                textTransform="uppercase"
              >
                Ativa
              </Box>
            </Box>
          </Box>

          <Box as="tbody">
            {empresas.length > 0 ? (
              empresas.map((empresa) => (
                <Box as="tr" key={empresa.id} borderTopWidth="1px">
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    fontWeight="semibold"
                    color="gray.800"
                  >
                    {empresa.name}
                  </Box>
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="gray.600"
                  >
                    {empresa.cnpj}
                  </Box>
                  <Box as="td" px={6} py={4} textAlign="center">
                    <HStack justify="center">
                      <Button
                        size="sm"
                        variant="outline"
                        colorPalette={empresa.isActive ? "green" : "gray"}
                        onClick={() => toggleStatus(empresa.id)}
                      >
                        {empresa.isActive ? "Ativa" : "Inativa"}
                      </Button>
                    </HStack>
                  </Box>
                </Box>
              ))
            ) : (
              <Box as="tr" borderTopWidth="1px">
                <Box
                  as="td"
                  colSpan={3}
                  px={6}
                  py={4}
                  textAlign="center"
                  color="gray.500"
                >
                  Nenhuma empresa encontrada.
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default ListarEmpresas;
