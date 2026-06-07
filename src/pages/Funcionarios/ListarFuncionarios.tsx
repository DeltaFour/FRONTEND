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
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  HStack,
  VStack,
  Badge,
  DialogFooter,
} from "@chakra-ui/react";
import { FaEdit, FaEllipsisV, FaPlus, FaTrash, FaEye, FaTimes, FaClock, FaCalendarAlt, FaUser, FaLock } from "react-icons/fa";
import api from "../../services/api";
import { ConfirmDeleteModal } from "../../components/Modal/ConfirmDeleteModal";
import { Input } from "../../components/ui/Input";
import { toaster } from "../../components/ui/toaster";
import { useColorModeValue } from "../../theme/colorMode";
import { useAuth } from "../../context/AuthContext";

const parseTimeToMinutes = (value: string) => {
  if (!value) return null;
  const [hour, minute] = value.split(":");
  const hoursNumber = Number(hour);
  const minutesNumber = Number(minute ?? 0);

  if (Number.isNaN(hoursNumber) || Number.isNaN(minutesNumber)) {
    return null;
  }

  return hoursNumber * 60 + minutesNumber;
};

const formatDuration = (minutes: number | null) => {
  if (minutes === null) {
    return "--:--";
  }

  const sign = minutes < 0 ? "-" : "";
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60)
    .toString()
    .padStart(2, "0");
  const mins = (absMinutes % 60).toString().padStart(2, "0");
  return `${sign}${hours}:${mins}`;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }
  return date.toLocaleString("pt-BR");
};

const formatDateOnly = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }
  return date.toLocaleDateString("pt-BR");
};

const formatTimeOnly = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "--:--";
  }
  return date.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

interface Funcionario {
  id: string;
  name: string;
  email: string;
  roleName: string;
  cellphone?: string;
  departmentName?: string;
  isAllowedBypassCoord?: boolean;
  shiftDto?: any[];
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
  const { user } = useAuth();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [filters, setFilters] = useState<FiltersState>(initialFilters);
  const [loading, setLoading] = useState(true);
  const [employeeToDelete, setEmployeeToDelete] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [employeeToResetPassword, setEmployeeToResetPassword] = useState<{
    id: string;
    name: string;
    email: string;
  } | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const [selectedEmployeeForDetails, setSelectedEmployeeForDetails] = useState<Funcionario | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [employeeDetails, setEmployeeDetails] = useState<any | null>(null);
  const [employeePunches, setEmployeePunches] = useState<any[]>([]);
  const [allShifts, setAllShifts] = useState<any[]>([]);

  const handleResetPasswordConfirm = async () => {
    if (!employeeToResetPassword) return;
    setIsResettingPassword(true);
    try {
      await api.post("/auth/forgot-password", { email: employeeToResetPassword.email });
      toaster.success({
        title: "Reset solicitado",
        description: `Um e-mail de recuperação de senha foi enviado para ${employeeToResetPassword.name}.`,
      });
      setEmployeeToResetPassword(null);
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toaster.error({
        title: "Erro ao resetar senha",
        description: message ?? "Não foi possível solicitar a redefinição de senha.",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

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

  const handleOpenDetails = async (employee: Funcionario) => {
    setSelectedEmployeeForDetails(employee);
    setDetailsLoading(true);
    setEmployeeDetails(null);
    setEmployeePunches([]);
    try {
      const [shiftsRes, punchesRes] = await Promise.all([
        api.get("/workshift/list"),
        api.get("/user/get-all-attendances"),
      ]);

      const shiftsData = shiftsRes.data?.data ?? shiftsRes.data ?? [];
      const punchesData = punchesRes.data?.data ?? punchesRes.data ?? [];

      setEmployeeDetails(employee);
      setAllShifts(shiftsData);

      const employeeNameLower = employee.name.toLowerCase().trim();
      const filteredPunches = punchesData.filter((p: any) => {
        const pName = (p.name ?? p.employeeName ?? "").toLowerCase().trim();
        return pName === employeeNameLower;
      });

      setEmployeePunches(filteredPunches);
    } catch (err) {
      toaster.error({
        title: "Erro ao carregar detalhes",
        description: "Não foi possível carregar as informações detalhadas do funcionário.",
      });
      setSelectedEmployeeForDetails(null);
    } finally {
      setDetailsLoading(false);
    }
  };

  const monthlyStats = useMemo(() => {
    if (!employeeDetails || !employeePunches) {
      return { worked: 0, expected: 0, balance: 0 };
    }

    const currentShift =
      employeeDetails.shiftDto && employeeDetails.shiftDto.length > 0
        ? employeeDetails.shiftDto[0]
        : undefined;

    let shiftObj = null;
    if (currentShift && allShifts.length > 0) {
      shiftObj = allShifts.find((s: any) => String(s.id) === String(currentShift.id));
    }

    let expectedMinutesPerDay = 480; // Default to 8h
    if (shiftObj) {
      const start = parseTimeToMinutes(shiftObj.startTime ?? shiftObj.workShiftStartTime);
      const end = parseTimeToMinutes(shiftObj.endTime ?? shiftObj.workShiftEndTime);
      if (start !== null && end !== null) {
        const normEnd = end < start ? end + 24 * 60 : end;
        expectedMinutesPerDay = normEnd - start;
      }
    }

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const punchesThisMonth = employeePunches.filter((p: any) => {
      const date = new Date(p.timePunched);
      return !isNaN(date.getTime()) && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const grouped = new Map<string, any[]>();
    punchesThisMonth.forEach((punch: any) => {
      const date = new Date(punch.timePunched);
      const dateKey = date.toISOString().slice(0, 10);
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)?.push(punch);
    });

    let totalWorkedMinutes = 0;
    let totalExpectedMinutes = 0;

    grouped.forEach((dayPunches) => {
      dayPunches.sort((a, b) => new Date(a.timePunched).getTime() - new Date(b.timePunched).getTime());
      
      let dayWorked = 0;
      for (let i = 0; i < dayPunches.length; i += 2) {
        const startItem = dayPunches[i];
        const endItem = dayPunches[i + 1];
        if (startItem && endItem) {
          const startMs = new Date(startItem.timePunched).getTime();
          const endMs = new Date(endItem.timePunched).getTime();
          if (!isNaN(startMs) && !isNaN(endMs)) {
            dayWorked += Math.max(0, Math.floor((endMs - startMs) / 60000));
          }
        }
      }

      totalWorkedMinutes += dayWorked;
      totalExpectedMinutes += expectedMinutesPerDay;
    });

    const balance = totalWorkedMinutes - totalExpectedMinutes;

    return {
      worked: totalWorkedMinutes,
      expected: totalExpectedMinutes,
      balance,
    };
  }, [employeeDetails, employeePunches, allShifts]);

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
                                value={`detalhes-${funcionario.id}`}
                                onSelect={() => handleOpenDetails(funcionario)}
                              >
                                <FaEye style={{ marginRight: 8 }} /> Ver Detalhes
                              </MenuItem>
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
                              {user?.role === "RH" && (
                                <MenuItem
                                  p="10px"
                                  value={`reset-password-${funcionario.id}`}
                                  onSelect={() =>
                                    setEmployeeToResetPassword({
                                      id: funcionario.id,
                                      name: funcionario.name,
                                      email: funcionario.email,
                                    })
                                  }
                                >
                                  <FaLock style={{ marginRight: 8 }} /> Resetar Senha
                                </MenuItem>
                              )}
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

      <DialogRoot
        open={Boolean(employeeToResetPassword)}
        onOpenChange={(details) => {
          if (!details.open) setEmployeeToResetPassword(null);
        }}
        placement="center"
      >
        <Portal>
          <DialogBackdrop bg="blackAlpha.600" />
          <DialogPositioner>
            <DialogContent borderRadius="xl" boxShadow="2xl" bg="surface" borderWidth="1px" borderColor="border">
              <DialogHeader pb={3} pt={5} px={6}>
                <DialogTitle fontSize="lg" fontWeight="bold" color="fg" display="flex" alignItems="center" gap={2}> Confirmar Redefinição de Senha
                </DialogTitle>
              </DialogHeader>
              <DialogBody px={6} py={4}>
                <Text color="fg.muted" fontSize="sm">
                  Tem certeza que deseja solicitar a redefinição de senha para o funcionário{" "}
                  <strong>{employeeToResetPassword?.name}</strong>?
                </Text>
                <Text color="fg.muted" fontSize="sm" mt={2}>
                  Um e-mail contendo o código de recuperação será enviado para o endereço:{" "}
                  <strong>{employeeToResetPassword?.email}</strong>.
                </Text>
              </DialogBody>
              <DialogFooter px={6} pb={5} pt={3} gap={3}>
                <Button
                  variant="outline"
                  borderRadius="full"
                  p="10px"
                  onClick={() => setEmployeeToResetPassword(null)}
                  disabled={isResettingPassword}
                >
                  Cancelar
                </Button>
                <Button
                  colorPalette="purple"
                  borderRadius="full"
                  p="10px"
                  onClick={handleResetPasswordConfirm}
                  disabled={isResettingPassword}
                >
                  {isResettingPassword ? <Spinner size="xs" /> : "Enviar Código"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </DialogPositioner>
        </Portal>
      </DialogRoot>

      <DialogRoot
        open={Boolean(selectedEmployeeForDetails)}
        onOpenChange={(details) => {
          if (!details.open) {
            setSelectedEmployeeForDetails(null);
            setEmployeeDetails(null);
            setEmployeePunches([]);
          }
        }}
        placement="center"
      >
        <Portal>
          <DialogBackdrop bg="blackAlpha.600" />
          <DialogPositioner>
            <DialogContent
              w={{ base: "92vw", md: "800px" }}
              maxH="90vh"
              borderRadius="xl"
              boxShadow="2xl"
              bg="surface"
              borderWidth="1px"
              borderColor="border"
            >
              <DialogHeader pb={3} pt={5} px={6} borderBottomWidth="1px" borderColor="border">
                <Flex justify="space-between" align="center">
                  <DialogTitle fontSize="xl" fontWeight="bold" color="fg" display="flex" alignItems="center" gap={2}>
                     Detalhes do Funcionário
                  </DialogTitle>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedEmployeeForDetails(null);
                      setEmployeeDetails(null);
                      setEmployeePunches([]);
                    }}
                  >
                    <FaTimes />
                  </IconButton>
                </Flex>
              </DialogHeader>

              <DialogBody px={6} py={6} overflowY="auto">
                {detailsLoading ? (
                  <Flex align="center" justify="center" py={12} direction="column" gap={3}>
                    <Spinner size="lg" />
                    <Text fontSize="sm" color="fg.muted">Carregando informações...</Text>
                  </Flex>
                ) : employeeDetails ? (
                  <VStack align="stretch" gap={6}>
                    {/* Header Summary Banner */}
                    <Box p={5} bg="surface.subtle" borderRadius="lg" borderLeft="4px solid #4F46E5">
                      <Grid templateColumns={{ base: "1fr", md: "2fr 1fr" }} gap={4}>
                        <Box>
                          <Text fontSize="lg" fontWeight="bold" color="fg">{employeeDetails.name}</Text>
                          <Text fontSize="sm" color="fg.muted">{employeeDetails.email ?? selectedEmployeeForDetails?.email}</Text>
                        </Box>
                        <Box textAlign={{ base: "left", md: "right" }}>
                          <Badge colorPalette="blue" px={3} py={1} borderRadius="full">
                            {employeeDetails.roleName || selectedEmployeeForDetails?.roleName}
                          </Badge>
                        </Box>
                      </Grid>
                    </Box>

                    {/* Grid of basic info & shift */}
                    <Grid templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }} gap={6}>
                      <Box p={4} borderWidth="1px" borderColor="border" borderRadius="lg">
                        <Text fontWeight="semibold" fontSize="sm" color="fg" mb={3} display="flex" alignItems="center" gap={2}>
                          <FaUser size={14} /> Informações Gerais
                        </Text>
                        <VStack align="stretch" gap={2}>
                          <Flex justify="space-between">
                            <Text fontSize="xs" color="fg.muted">Telefone:</Text>
                            <Text fontSize="xs" fontWeight="semibold" color="fg">{employeeDetails.cellphone || "Não informado"}</Text>
                          </Flex>
                          <Flex justify="space-between">
                            <Text fontSize="xs" color="fg.muted">Departamento:</Text>
                            <Text fontSize="xs" fontWeight="semibold" color="fg">
                              {selectedEmployeeForDetails?.departmentName || "Sem departamento"}
                            </Text>
                          </Flex>
                          <Flex justify="space-between">
                            <Text fontSize="xs" color="fg.muted">Bypass Coordenação:</Text>
                            <Badge colorPalette={employeeDetails.isAllowedBypassCoord ? "green" : "gray"} size="sm">
                              {employeeDetails.isAllowedBypassCoord ? "Permitido" : "Bloqueado"}
                            </Badge>
                          </Flex>
                        </VStack>
                      </Box>

                      <Box p={4} borderWidth="1px" borderColor="border" borderRadius="lg">
                        <Text fontWeight="semibold" fontSize="sm" color="fg" mb={3} display="flex" alignItems="center" gap={2}>
                          <FaClock size={14} /> Turno de Trabalho
                        </Text>
                        {(() => {
                          const currentShift =
                            employeeDetails.shiftDto && employeeDetails.shiftDto.length > 0
                              ? employeeDetails.shiftDto[0]
                              : undefined;

                          let shiftObj = null;
                          if (currentShift && allShifts.length > 0) {
                            shiftObj = allShifts.find((s: any) => String(s.id) === String(currentShift.id));
                          }

                          if (!shiftObj) {
                            return <Text fontSize="xs" color="fg.muted">Nenhum turno associado.</Text>;
                          }

                          return (
                            <VStack align="stretch" gap={2}>
                              <Flex justify="space-between">
                                <Text fontSize="xs" color="fg.muted">Tipo de Turno:</Text>
                                <Text fontSize="xs" fontWeight="semibold" color="fg">{shiftObj.shiftType ?? shiftObj.workShiftType}</Text>
                              </Flex>
                              <Flex justify="space-between">
                                <Text fontSize="xs" color="fg.muted">Horário:</Text>
                                <Text fontSize="xs" fontWeight="semibold" color="fg">
                                  {shiftObj.startTime ?? shiftObj.workShiftStartTime} - {shiftObj.endTime ?? shiftObj.workShiftEndTime}
                                </Text>
                              </Flex>
                              <Flex justify="space-between">
                                <Text fontSize="xs" color="fg.muted">Tolerância:</Text>
                                <Text fontSize="xs" fontWeight="semibold" color="fg">{shiftObj.toleranceMinutes ?? 0} min</Text>
                              </Flex>
                            </VStack>
                          );
                        })()}
                      </Box>
                    </Grid>

                    {/* Stats & Balance for Current Month */}
                    <Box p={4} borderWidth="1px" borderColor="border" borderRadius="lg" bg="surface.subtle">
                      <Text fontWeight="semibold" fontSize="sm" color="fg" mb={3} display="flex" alignItems="center" gap={2}>
                        <FaCalendarAlt size={14} /> Saldo e Estatísticas deste Mês
                      </Text>
                      <Grid templateColumns={{ base: "repeat(3, 1fr)" }} gap={4} textAlign="center">
                        <Box>
                          <Text fontSize="xs" color="fg.muted">Horas Trabalhadas</Text>
                          <Text fontSize="lg" fontWeight="bold" color="fg">{formatDuration(monthlyStats.worked)}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="fg.muted">Horas Previstas</Text>
                          <Text fontSize="lg" fontWeight="bold" color="fg">{formatDuration(monthlyStats.expected)}</Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="fg.muted">Saldo</Text>
                          <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color={monthlyStats.balance < 0 ? "red.400" : "green.400"}
                          >
                            {formatDuration(monthlyStats.balance)}
                          </Text>
                        </Box>
                      </Grid>
                    </Box>

                    {/* Clock In Punch History List */}
                    <Box>
                      <Text fontWeight="semibold" fontSize="sm" color="fg" mb={3}>
                        Últimas batidas registradas (Mês Atual)
                      </Text>
                      {employeePunches.length === 0 ? (
                        <Box p={4} bg="surface.subtle" borderRadius="md" color="fg.muted" textAlign="center" fontSize="xs">
                          Nenhuma batida registrada para este funcionário.
                        </Box>
                      ) : (
                        <Box overflowX="auto" borderWidth="1px" borderRadius="md" borderColor="border" maxH="250px" overflowY="auto">
                          <Box as="table" width="100%" borderCollapse="collapse" fontSize="xs">
                            <Box as="thead" bg="surface.subtle" position="sticky" top={0} zIndex={1}>
                              <Box as="tr">
                                <Box as="th" px={4} py={2} textAlign="left" color="fg.muted">Dia</Box>
                                <Box as="th" px={4} py={2} textAlign="left" color="fg.muted">Horário</Box>
                                <Box as="th" px={4} py={2} textAlign="left" color="fg.muted">Tipo</Box>
                                <Box as="th" px={4} py={2} textAlign="left" color="fg.muted">Turno</Box>
                                <Box as="th" px={4} py={2} textAlign="left" color="fg.muted">Status</Box>
                              </Box>
                            </Box>
                            <Box as="tbody">
                              {employeePunches
                                .sort((a, b) => new Date(b.timePunched).getTime() - new Date(a.timePunched).getTime())
                                .map((punch: any, idx: number) => (
                                  <Box as="tr" key={punch.attendanceId ?? idx} borderTopWidth="1px">
                                    <Box as="td" px={4} py={2} color="fg">{formatDateOnly(punch.timePunched)}</Box>
                                    <Box as="td" px={4} py={2} fontWeight="bold" color="fg">{formatTimeOnly(punch.timePunched)}</Box>
                                    <Box as="td" px={4} py={2} color="fg">
                                      <Badge colorPalette={punch.type === "IN" ? "green" : "blue"} size="sm">
                                        {punch.type === "IN" ? "Entrada" : "Saída"}
                                      </Badge>
                                    </Box>
                                    <Box as="td" px={4} py={2} color="fg.muted">{punch.shiftType || "N/A"}</Box>
                                    <Box as="td" px={4} py={2}>
                                      <Badge colorPalette={punch.isLate ? "red" : "green"} size="sm">
                                        {punch.isLate ? "Em atraso" : "No horário"}
                                      </Badge>
                                    </Box>
                                  </Box>
                                ))}
                            </Box>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  </VStack>
                ) : (
                  <Text color="fg.muted" textAlign="center">Nenhum detalhe encontrado.</Text>
                )}
              </DialogBody>

              <DialogFooter px={6} pb={5} pt={4} borderTopWidth="1px" borderColor="border" justifyContent="flex-end">
                <Button
                  variant="outline"
                  borderRadius="full"
                  p="10px"
                  onClick={() => {
                    setSelectedEmployeeForDetails(null);
                    setEmployeeDetails(null);
                    setEmployeePunches([]);
                  }}
                >
                  Fechar
                </Button>
              </DialogFooter>
            </DialogContent>
          </DialogPositioner>
        </Portal>
      </DialogRoot>
    </Box>
  );
};

export default ListarFuncionarios;
