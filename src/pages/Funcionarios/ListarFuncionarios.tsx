import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
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
import { Input } from "../../components/ui/Input";
import { toaster } from "../../components/ui/toaster";
import { useColorModeValue } from "../../theme/colorMode";

interface Funcionario {
  id: string;
  name: string;
  email: string;
  roleName: string;
  cellphone?: string;
  departmentName?: string;
}

interface FiltersState {
  search: string;
  roleName: string;
  departmentName: string;
}

const initialFilters: FiltersState = {
  search: "",
  roleName: "all",
  departmentName: "all",
};

const ListarFuncionarios = () => {
  const selectBg = useColorModeValue("#FFFFFF", "#1A1A1F");
  const selectColor = useColorModeValue("#1A202C", "#E2E8F0");
  const selectBorder = useColorModeValue(
    "1px solid #E2E8F0",
    "1px solid rgba(255, 255, 255, 0.1)",
  );
  const selectColorScheme = useColorModeValue("light", "dark");

  const selectStyle: CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "0.375rem",
    border: selectBorder,
    backgroundColor: selectBg,
    color: selectColor,
    colorScheme: selectColorScheme as any,
  };

  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [employeeToDelete, setEmployeeToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEmployees = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const response = await api.get("/user/list");
      const data = (response.data?.data ?? response.data) as Funcionario[];

      setFuncionarios(data);
    } catch (err) {
      if (showLoading) {
        const description = "Não foi possível carregar a lista de funcionários.";

        toaster.error({
          title: "Erro ao carregar funcionários",
          description,
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchEmployees(true);

    const interval = setInterval(() => {
      void fetchEmployees(false);
    }, 45000); // Poll every 45 seconds

    return () => clearInterval(interval);
  }, [fetchEmployees]);

  const roleOptions = useMemo(
    () =>
      Array.from(
        new Set(
          funcionarios
            .map((funcionario) => funcionario.roleName.trim())
            .filter((roleName) => roleName.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [funcionarios],
  );

  const departmentOptions = useMemo(
    () =>
      Array.from(
        new Set(
          funcionarios
            .map((funcionario) => funcionario.departmentName?.trim() ?? "")
            .filter((dept) => dept.length > 0),
        ),
      ).sort((a, b) => a.localeCompare(b, "pt-BR")),
    [funcionarios],
  );

  const filteredFuncionarios = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    return funcionarios.filter((funcionario) => {
      const searchableFields = [
        funcionario.name,
        funcionario.email,
        funcionario.cellphone ?? "",
        funcionario.departmentName ?? "",
      ];

      const matchesSearch =
        !normalizedSearch ||
        searchableFields.some((field) =>
          field.toLowerCase().includes(normalizedSearch),
        );

      if (!matchesSearch) {
        return false;
      }

      if (
        filters.roleName !== "all" &&
        funcionario.roleName !== filters.roleName
      ) {
        return false;
      }

      if (
        filters.departmentName !== "all" &&
        (funcionario.departmentName || "") !== filters.departmentName
      ) {
        return false;
      }

      return true;
    });
  }, [filters, funcionarios]);

  const hasActiveFilters =
    filters.search.trim().length > 0 ||
    filters.roleName !== "all" ||
    filters.departmentName !== "all";

  const handleFilterChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const clearFilters = () => setFilters(initialFilters);

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
    <Box bg="surface" p={{ base: 3, md: 6 }} borderRadius="lg" boxShadow="xl">
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
        mb={6}
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        borderColor="border"
        bg="surface.subtle"
      >
        <Flex
          justify="space-between"
          align="center"
          gap={3}
          flexWrap="wrap"
          mb={4}
        >
          <Box>
            <Text fontSize="sm" fontWeight="semibold" color="fg">
              Filtros
            </Text>
            <Text fontSize="sm" color="fg.muted">
              Filtre por nome, e-mail, departamento e perfil.
            </Text>
          </Box>

          <Button type="button" variant="outline" onClick={clearFilters} p="10px">
            Limpar filtros
          </Button>
        </Flex>

        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(3, minmax(0, 1fr))",
          }}
          gap={4}
        >
          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg">
              Nome ou e-mail
            </Text>
            <Input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Buscar funcionário"
            />
          </GridItem>

          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg">
              Departamento
            </Text>
            <select
              name="departmentName"
              value={filters.departmentName}
              onChange={handleFilterChange}
              style={{
                width: "100%",
                padding: "10px",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--chakra-colors-border)",
                borderRadius: "var(--chakra-radii-md)",
                backgroundColor: "var(--chakra-colors-surface)",
                color: "var(--chakra-colors-fg)",
                outline: "none",
              }}
            >
              <option value="all">Todos os departamentos</option>
              {departmentOptions.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </GridItem>

          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg">
              Perfil
            </Text>
            <select
              name="roleName"
              value={filters.roleName}
              onChange={handleFilterChange}
              style={{
                width: "100%",
                padding: "10px",
                borderWidth: "1px",
                borderStyle: "solid",
                borderColor: "var(--chakra-colors-border)",
                borderRadius: "var(--chakra-radii-md)",
                backgroundColor: "var(--chakra-colors-surface)",
                color: "var(--chakra-colors-fg)",
                outline: "none",
              }}
            >
              <option value="all">Todos os perfis</option>
              {roleOptions.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </GridItem>
        </Grid>
      </Box>
      <Box
        overflowX="auto"
        borderWidth="1px"
        borderRadius="md"
        borderColor="border"
      >
        <Box as="table" width="100%" borderCollapse="collapse" minW="650px">
          <Box as="thead" bg="surface.subtle">
            <Box as="tr">
              <Box
                as="th"
                px={{ base: 3, md: 6 }}
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
                px={{ base: 3, md: 6 }}
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
                px={{ base: 3, md: 6 }}
                py={3}
                textAlign="left"
                fontSize="xs"
                color="fg.muted"
                textTransform="uppercase"
              >
                Departamento
              </Box>
              <Box
                as="th"
                px={{ base: 3, md: 6 }}
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
                px={{ base: 3, md: 6 }}
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
            {filteredFuncionarios.length > 0 ? (
              filteredFuncionarios.map((funcionario) => (
                <Box as="tr" key={funcionario.id} borderTopWidth="1px">
                  <Box
                    as="td"
                    px={{ base: 3, md: 6 }}
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
                    px={{ base: 3, md: 6 }}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="fg.muted"
                  >
                    {funcionario.email}
                  </Box>
                  <Box
                    as="td"
                    px={{ base: 3, md: 6 }}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="fg.muted"
                  >
                    {funcionario.departmentName || "Sem departamento"}
                  </Box>
                  <Box
                    as="td"
                    px={{ base: 3, md: 6 }}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="fg.muted"
                  >
                    {funcionario.roleName}
                  </Box>
                  <Box
                    as="td"
                    px={{ base: 3, md: 6 }}
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
                  px={6}
                  py={4}
                  textAlign="center"
                  color="fg.muted"
                  {...({ colSpan: 5 } as any)}
                >
                  Nenhum funcionário encontrado com os filtros aplicados.
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
