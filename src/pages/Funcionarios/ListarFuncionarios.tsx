import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import { Box, Button, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { FaBuilding, FaEdit, FaTrash, FaPlus } from "react-icons/fa";
import api from "../../services/api";

interface Empresa {
  id: number | string;
  name: string;
  cnpj: string;
}

const ListarFuncionarios = () => {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get<Empresa[]>("/super-admin/company");
      setEmpresas(response.data);
    } catch (err) {
      console.error("Erro ao buscar empresas:", err);
      setError("Não foi possível carregar a lista de empresas.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleDelete = async (
    companyId: Empresa["id"],
    companyName: string,
  ) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja EXCLUIR a empresa "${companyName}"? Esta ação é irreversível.`,
    );

    if (!confirmed) return;

    try {
      await api.delete(`/super-admin/company/${companyId}`);
      setEmpresas((prev) => prev.filter((empresa) => empresa.id !== companyId));
      window.alert(`Empresa "${companyName}" excluída com sucesso!`);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Erro ao excluir a empresa. Tente novamente.";
      window.alert(message);
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
        <Heading
          size="lg"
          color="gray.700"
          display="flex"
          alignItems="center"
          gap={2}
        >
          <FaBuilding /> Gerenciamento de Empresas
        </Heading>

        <Button
          as={RouterLink}
          to="/dashboard-admin/empresas/criar"
          colorPalette="green"
          display="flex"
          alignItems="center"
        >
          <FaPlus style={{ marginRight: 8 }} /> Nova Empresa
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
                textAlign="left"
                fontSize="xs"
                color="gray.500"
                textTransform="uppercase"
              >
                ID
              </Box>
              <Box
                as="th"
                px={6}
                py={3}
                textAlign="right"
                fontSize="xs"
                color="gray.500"
                textTransform="uppercase"
              >
                Ações
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
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="gray.600"
                    maxW="260px"
                    overflow="hidden"
                    textOverflow="ellipsis"
                  >
                    {empresa.id}
                  </Box>
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    textAlign="right"
                  >
                    <Button
                      as={RouterLink}
                      to={`/dashboard-admin/empresas/editar/${empresa.id}`}
                      variant="ghost"
                      colorPalette="blue"
                      size="sm"
                      mr={3}
                      display="inline-flex"
                      alignItems="center"
                    >
                      <FaEdit style={{ marginRight: 4 }} /> Editar
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      colorPalette="red"
                      size="sm"
                      display="inline-flex"
                      alignItems="center"
                      onClick={() => handleDelete(empresa.id, empresa.name)}
                    >
                      <FaTrash style={{ marginRight: 4 }} /> Excluir
                    </Button>
                  </Box>
                </Box>
              ))
            ) : (
              <Box as="tr" borderTopWidth="1px">
                <Box
                  as="td"
                  colSpan={4}
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

export default ListarFuncionarios;
