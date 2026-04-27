import { useCallback, useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { Box, Button, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { FaEdit, FaPlus, FaTrash, FaUsers } from "react-icons/fa";
import api from "../../services/api";
import { toaster } from "../../components/ui/toaster";

interface Funcionario {
  id: string;
  name: string;
  email: string;
  roleName: string;
  cellphone?: string;
}

const ListarFuncionarios = () => {
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/user/list");
      const data = (response.data?.data ?? response.data) as Funcionario[];

      setFuncionarios(data);
    } catch (err) {
      const description = "Não foi possível carregar a lista de funcionários.";
      setError(description);
      toaster.error({
        title: "Erro ao carregar funcionários",
        description,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  const handleDelete = async (employeeId: string, employeeName: string) => {
    try {
      await api.delete(`/user/${employeeId}`);
      setFuncionarios((prev) =>
        prev.filter((employee) => employee.id !== employeeId),
      );
      toaster.success({
        title: "Funcionário excluído",
        description: `Funcionário \"${employeeName}\" excluído com sucesso!`,
      });
    } catch (err: unknown) {
      const description =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Erro ao excluir funcionário. Tente novamente.";
      toaster.error({
        title: "Erro ao excluir funcionário",
        description,
      });
    }
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" py={10} gap={3}>
        <Spinner />
        <Text>Carregando lista de funcionários...</Text>
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
          <FaUsers /> Gerenciamento de Funcionários
        </Heading>

        <Button
          type="button"
          colorPalette="green"
          display="flex"
          alignItems="center"
          onClick={() => navigate("/dashboard-empresa/funcionarios/criar")}
        >
          <FaPlus style={{ marginRight: 8 }} /> Novo Funcionário
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
                E-mail
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
                Perfil
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
            {funcionarios.length > 0 ? (
              funcionarios.map((funcionario) => (
                <Box as="tr" key={funcionario.id} borderTopWidth="1px">
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    fontWeight="semibold"
                    color="gray.800"
                  >
                    {funcionario.name}
                  </Box>
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="gray.600"
                  >
                    {funcionario.email}
                  </Box>
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="gray.600"
                  >
                    {funcionario.roleName}
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
                      to={`/dashboard-empresa/funcionarios/editar/${funcionario.id}`}
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
                      onClick={() =>
                        handleDelete(funcionario.id, funcionario.name)
                      }
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
                  Nenhum funcionário encontrado.
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
