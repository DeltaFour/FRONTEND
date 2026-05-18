import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  IconButton,
  MenuContent,
  MenuItem,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
  Portal,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { FaEdit, FaEllipsisV, FaPlus, FaTrash } from "react-icons/fa";
import api from "../../services/api";
import { ConfirmDeleteModal } from "../../components/Modal/ConfirmDeleteModal";
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
  const [employeeToDelete, setEmployeeToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/user/list");
      const data = (response.data?.data ?? response.data) as Funcionario[];

      setFuncionarios(data);
    } catch (err) {
      const description = "Não foi possível carregar a lista de funcionários.";

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

  const openDeleteModal = (employeeId: string, employeeName: string) => {
    setEmployeeToDelete({ id: employeeId, name: employeeName });
  };

  const closeDeleteModal = () => {
    if (isDeleting) {
      return;
    }
    setEmployeeToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) {
      return;
    }

    const { id, name } = employeeToDelete;

    try {
      setIsDeleting(true);
      await api.delete(`/user/change-status/${id}`);
      setFuncionarios((prev) => prev.filter((employee) => employee.id !== id));
      toaster.success({
        title: "Funcionário excluído",
        description: `Funcionário \"${name}\" excluído com sucesso!`,
      });
      setEmployeeToDelete(null);
    } catch (err: unknown) {
      const description =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Erro ao excluir funcionário. Tente novamente.";
      toaster.error({
        title: "Erro ao excluir funcionário",
        description,
      });
    } finally {
      setIsDeleting(false);
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

  return (
    <Box bg="surface" p={6} borderRadius="lg" boxShadow="xl">
      <Flex justify="space-between" align="center" mb={6}>
        <Text fontSize="lg" fontWeight="semibold" color="fg">
          Lista de funcionários
        </Text>
        <Button
          type="button"
          colorPalette="green"
          p="10px"
          display="flex"
          alignItems="center"
          onClick={() => navigate("/dashboard-empresa/funcionarios/criar")}
        >
          <FaPlus style={{ marginRight: 8 }} /> Novo Funcionário
        </Button>
      </Flex>
      <Box
        overflowX="auto"
        borderWidth="1px"
        borderRadius="md"
        borderColor="border"
      >
        <Box as="table" width="100%" borderCollapse="collapse">
          <Box as="thead" bg="surface.subtle">
            <Box as="tr">
              <Box
                as="th"
                px={6}
                py={3}
                textAlign="left"
                fontSize="xs"
                color="fg.muted"
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
                color="fg.muted"
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
                color="fg.muted"
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
                color="fg.muted"
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
                    color="fg"
                  >
                    {funcionario.name}
                  </Box>
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="fg.muted"
                  >
                    {funcionario.email}
                  </Box>
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="fg.muted"
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
                    <Flex justify="flex-end">
                      <MenuRoot
                        positioning={{
                          placement: "top-end",
                          strategy: "fixed",
                        }}
                      >
                        <MenuTrigger asChild>
                          <IconButton
                            aria-label={`Ações para ${funcionario.name}`}
                            variant="ghost"
                            size="sm"
                          >
                            <FaEllipsisV />
                          </IconButton>
                        </MenuTrigger>
                        <Portal>
                          <MenuPositioner>
                            <MenuContent>
                              <MenuItem
                                p="10px"
                                value={`editar-${funcionario.id}`}
                                onSelect={() =>
                                  navigate(
                                    `/dashboard-empresa/funcionarios/editar/${funcionario.id}`,
                                  )
                                }
                              >
                                <FaEdit style={{ marginRight: 8 }} /> Editar
                              </MenuItem>
                              <MenuItem
                                p="10px"
                                value={`excluir-${funcionario.id}`}
                                onSelect={() =>
                                  openDeleteModal(
                                    funcionario.id,
                                    funcionario.name,
                                  )
                                }
                              >
                                <FaTrash style={{ marginRight: 8 }} /> Excluir
                              </MenuItem>
                            </MenuContent>
                          </MenuPositioner>
                        </Portal>
                      </MenuRoot>
                    </Flex>
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
                  color="fg.muted"
                >
                  Nenhum funcionário encontrado.
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      <ConfirmDeleteModal
        isOpen={Boolean(employeeToDelete)}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        itemName={employeeToDelete?.name}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default ListarFuncionarios;
