import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type ReactNode,
} from "react";
import {
  Box,
  Button,
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Flex,
  Grid,
  GridItem,
  Heading,
  IconButton,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaInfoCircle, FaTimes } from "react-icons/fa";
import api from "../../services/api";
import { Input } from "../../components/ui/Input";
import { toaster } from "../../components/ui/toaster";
import { useColorModeValue } from "../../theme/colorMode";

type PunchType = "IN" | "OUT";

interface PunchRecord {
  id: string;
  employeeKey: string;
  employeeName: string;
  timePunched: string;
  punchType: PunchType;
  shiftType?: string;
  isLate: boolean;
  status?: string | null;
  lateReason?: string;
  lateNote?: string;
  lateAttachmentName?: string;
  lateAttachmentUrl?: string;
}

interface EnrichedPunchRecord extends PunchRecord {
  dateKey: string;
  timeMs: number;
  isFirstOfDay: boolean;
  isLastOfDay: boolean;
}

interface FilterState {
  search: string;
  date: string;
  punchPosition: "all" | "first" | "last";
  punchType: "all" | PunchType;
  lateStatus: "all" | "late" | "on-time";
  sort: "recent" | "oldest";
}

const initialFilters: FilterState = {
  search: "",
  date: "",
  punchPosition: "all",
  punchType: "all",
  lateStatus: "all",
  sort: "recent",
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

const getLocalDateKey = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const resolvePunchTypeLabel = (type: PunchType) =>
  type === "IN" ? "Entrada" : "Saída";

const resolveAttachmentName = (filePath?: string) => {
  if (!filePath) {
    return undefined;
  }

  const sanitized = filePath.split("?")[0];
  const parts = sanitized.split("/");
  return parts[parts.length - 1] || undefined;
};

const normalizeAttendances = (rawData: unknown): PunchRecord[] => {
  const list = Array.isArray(rawData)
    ? rawData
    : (rawData as { data?: unknown })?.data;

  if (!Array.isArray(list)) {
    return [];
  }

  return list.map((item, index) => {
    const raw = (item || {}) as Record<string, unknown>;
    const id = String(raw.attendanceId ?? index);
    const employeeName = String(raw.name ?? "").trim();
    const employeeKey = String(raw.attendanceId ?? (employeeName || id));
    const timePunched = String(raw.timePunched ?? "");
    const punchTypeRaw = String(raw.type ?? "IN").toUpperCase();
    const punchType: PunchType = punchTypeRaw === "OUT" ? "OUT" : "IN";
    const isLate = !!raw.isLate;
    const statusRaw = raw.status ?? null;
    const status =
      statusRaw === null || statusRaw === undefined ? null : String(statusRaw);
    const filePath = raw.filePath ?? null;
    const lateAttachmentUrl = filePath ? String(filePath) : undefined;
    const lateAttachmentName = resolveAttachmentName(lateAttachmentUrl);

    return {
      id,
      employeeKey,
      employeeName,
      timePunched,
      punchType,
      shiftType: raw.shiftType ? String(raw.shiftType) : undefined,
      isLate,
      status,
      lateReason: raw.justification ? String(raw.justification) : undefined,
      lateNote: raw.observation ? String(raw.observation) : undefined,
      lateAttachmentName,
      lateAttachmentUrl,
    };
  });
};

const isAttendanceApproved = (attendance: PunchRecord) => {
  if (!attendance.isLate) {
    return true;
  }

  const normalized = String(attendance.status ?? "")
    .trim()
    .toLowerCase();

  return [
    "valid",
    "valido",
    "validado",
    "approved",
    "aprovado",
    "authorized",
    "autorizado",
    "true",
    "1",
  ].includes(normalized);
};

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
    <Text fontSize="sm" color="fg.muted">
      {label}
    </Text>
    <Box fontSize="sm" fontWeight="medium" color="fg" textAlign="right">
      {value}
    </Box>
  </Flex>
);

const StatusPill = ({ isLate }: { isLate: boolean }) => {
  const bg = useColorModeValue(
    isLate ? "red.100" : "green.100",
    isLate ? "red.900" : "green.900",
  );
  const color = useColorModeValue(
    isLate ? "red.700" : "green.700",
    isLate ? "red.200" : "green.200",
  );

  return (
    <Box
      px={3}
      py={1}
      borderRadius="full"
      fontSize="xs"
      fontWeight="semibold"
      bg={bg}
      color={color}
      display="inline-flex"
      alignItems="center"
    >
      {isLate ? "Em atraso" : "No horário"}
    </Box>
  );
};

const ApprovalPill = ({ isApproved }: { isApproved: boolean }) => {
  const bg = useColorModeValue(
    isApproved ? "blue.100" : "orange.100",
    isApproved ? "blue.900" : "orange.900",
  );
  const color = useColorModeValue(
    isApproved ? "blue.700" : "orange.700",
    isApproved ? "blue.200" : "orange.200",
  );

  return (
    <Box
      px={3}
      py={1}
      borderRadius="full"
      fontSize="xs"
      fontWeight="semibold"
      bg={bg}
      color={color}
      display="inline-flex"
      alignItems="center"

    >
      {isApproved ? "Válido" : "Pendente"}
    </Box>
  );
};

const FiltrarPontoRH = () => {
  const selectBg = useColorModeValue("#FFFFFF", "#1A1A1F");
  const selectColor = useColorModeValue("#1A202C", "#E2E8F0");
  const selectBorder = useColorModeValue(
    "1px solid #E2E8F0",
    "1px solid rgba(255, 255, 255, 0.1)",
  );
  const selectColorScheme = useColorModeValue("light", "dark");

  const selectBaseStyle: CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "0.375rem",
    border: selectBorder,
    backgroundColor: selectBg,
    color: selectColor,
    colorScheme: selectColorScheme as any,
  };

  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [punches, setPunches] = useState<PunchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatingIds, setValidatingIds] = useState<string[]>([]);
  const [selectedPunch, setSelectedPunch] =
    useState<EnrichedPunchRecord | null>(null);
  const filterGradient = useColorModeValue(
    "linear(to-r, #F8FAFC, #EFF6FF)",
    "linear(to-r, #1F2937, #111827)",
  );
  const validateBorder = useColorModeValue("orange.200", "orange.400");
  const validateColor = useColorModeValue("orange.600", "orange.300");
  const dialogBg = "surface";
  const dialogBorder = "border";
  const lateCardBg = useColorModeValue("red.50", "red.900");
  const lateCardBorder = useColorModeValue("red.100", "red.700");
  const lateTitleColor = useColorModeValue("red.700", "red.200");

  const fetchAttendances = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await api.get("/user/get-all-attendances");
      setPunches(normalizeAttendances(response.data));
    } catch (err) {
      if (showLoading) {
        toaster.error({
          title: "Erro ao carregar pontos",
          description: "Não foi possível carregar os pontos registrados.",
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchAttendances(true);

    const interval = setInterval(() => {
      void fetchAttendances(false);
    }, 5000); // Poll every 5 seconds for real-time updates

    return () => clearInterval(interval);
  }, [fetchAttendances]);

  const handleValidateAttendance = useCallback(
    async (attendanceId: string) => {
      if (!attendanceId || validatingIds.includes(attendanceId)) {
        return;
      }

      setValidatingIds((prev) => [...prev, attendanceId]);

      try {
        await api.patch(`/user/update-status-attendance/${attendanceId}`);
        setPunches((prev) =>
          prev.map((punch) =>
            punch.id === attendanceId
              ? { ...punch, status: "VALIDADO" }
              : punch,
          ),
        );
        setSelectedPunch((prev) =>
          prev?.id === attendanceId ? { ...prev, status: "VALIDADO" } : prev,
        );
        toaster.success({
          title: "Ponto validado",
          description: "O ponto em atraso foi validado com sucesso.",
        });
      } catch (err: unknown) {
        const description =
          (err as { response?: { data?: { message?: string } } })?.response
            ?.data?.message || "Não foi possível validar o ponto em atraso.";

        toaster.error({
          title: "Erro ao validar ponto",
          description,
        });
      } finally {
        setValidatingIds((prev) => prev.filter((id) => id !== attendanceId));
      }
    },
    [validatingIds],
  );

  const enrichedPunches = useMemo<EnrichedPunchRecord[]>(() => {
    const withMeta = punches.map((punch) => {
      const timeMs = new Date(punch.timePunched).getTime();
      const dateKey = getLocalDateKey(punch.timePunched);

      return {
        ...punch,
        timeMs,
        dateKey,
        isFirstOfDay: false,
        isLastOfDay: false,
      };
    });

    const grouped = new Map<string, EnrichedPunchRecord[]>();

    withMeta.forEach((punch) => {
      const key = `${punch.employeeKey}-${punch.dateKey}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)?.push(punch);
    });

    grouped.forEach((items) => {
      items.sort((a, b) => a.timeMs - b.timeMs);
      items.forEach((item, index) => {
        item.isFirstOfDay = index === 0;
        item.isLastOfDay = index === items.length - 1;
      });
    });

    return withMeta;
  }, [punches]);

  const filteredPunches = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();

    const filtered = enrichedPunches.filter((punch) => {
      if (
        normalizedSearch &&
        !punch.employeeName.toLowerCase().includes(normalizedSearch)
      ) {
        return false;
      }

      if (filters.date && punch.dateKey !== filters.date) {
        return false;
      }

      if (
        filters.punchType !== "all" &&
        punch.punchType !== filters.punchType
      ) {
        return false;
      }

      if (filters.lateStatus === "late" && !punch.isLate) {
        return false;
      }

      if (filters.lateStatus === "on-time" && punch.isLate) {
        return false;
      }

      if (filters.punchPosition === "first" && !punch.isFirstOfDay) {
        return false;
      }

      if (filters.punchPosition === "last" && !punch.isLastOfDay) {
        return false;
      }

      return true;
    });

    const sorted = filtered.sort((a, b) =>
      filters.sort === "recent" ? b.timeMs - a.timeMs : a.timeMs - b.timeMs,
    );

    return sorted;
  }, [enrichedPunches, filters]);

  const summary = useMemo(() => {
    const lateCount = filteredPunches.filter((punch) => punch.isLate).length;
    return {
      total: filteredPunches.length,
      late: lateCount,
      onTime: filteredPunches.length - lateCount,
    };
  }, [filteredPunches]);

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

  const activePunch = selectedPunch;

  if (loading) {
    return (
      <Flex align="center" justify="center" py={10} gap={3}>
        <Spinner />
        <Text>Carregando pontos...</Text>
      </Flex>
    );
  }

  return (
    <Box
      bg="surface"
      p={{ base: 3, md: 6 }}
      borderRadius="lg"
      boxShadow="xl"
      className="animate-fade-in"
    >
      <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
        <Box>
          <Heading
            size="lg"
            color="fg"
            display="flex"
            alignItems="center"
            gap={3}
          >
            Pontos por colaborador
          </Heading>
          <Text mt={2} fontSize="sm" color="fg.muted">
            Filtre pontos individuais por colaborador, data e status de atraso.
          </Text>
        </Box>

        <Button
          variant="outline"
          borderRadius="full"
          onClick={clearFilters}
          display="flex"
          alignItems="center"
          p="15px"
          gap={2}
        >
          <FaTimes /> Limpar filtros
        </Button>
      </Flex>

      <Box
        mt={6}
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        borderColor="border"
        bgGradient={filterGradient}
      >
        <Grid
          templateColumns={{
            base: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(6, minmax(0, 1fr))",
          }}
          gap={4}
        >
          <GridItem colSpan={{ base: 1, xl: 2 }}>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg">
              Nome
            </Text>
            <Input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Buscar colaborador"
            />
          </GridItem>

          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg">
              Data
            </Text>
            <Input
              name="date"
              type="date"
              value={filters.date}
              onChange={handleFilterChange}
            />
          </GridItem>

          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg">
              Batida
            </Text>
            <select
              name="punchPosition"
              value={filters.punchPosition}
              onChange={handleFilterChange}
              style={selectBaseStyle}
            >
              <option value="all">Todas</option>
              <option value="first">Primeiro batido</option>
              <option value="last">Último batido</option>
            </select>
          </GridItem>

          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg">
              Tipo
            </Text>
            <select
              name="punchType"
              value={filters.punchType}
              onChange={handleFilterChange}
              style={selectBaseStyle}
            >
              <option value="all">Todos</option>
              <option value="IN">Entrada</option>
              <option value="OUT">Saída</option>
            </select>
          </GridItem>

          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg">
              Atraso
            </Text>
            <select
              name="lateStatus"
              value={filters.lateStatus}
              onChange={handleFilterChange}
              style={selectBaseStyle}
            >
              <option value="all">Todos</option>
              <option value="late">Em atraso</option>
              <option value="on-time">No horário</option>
            </select>
          </GridItem>

          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg">
              Ordenação
            </Text>
            <select
              name="sort"
              value={filters.sort}
              onChange={handleFilterChange}
              style={selectBaseStyle}
            >
              <option value="recent">Mais recente</option>
              <option value="oldest">Mais antiga</option>
            </select>
          </GridItem>
        </Grid>
      </Box>

      <Flex
        mt={4}
        mb={4}
        align="center"
        justify="space-between"
        flexWrap="wrap"
        gap={3}
      >
        <Text fontSize="sm" color="fg.muted">
          Resultados: {summary.total} | Em atraso: {summary.late} | No horário:{" "}
          {summary.onTime}
        </Text>
      </Flex>

      <Box
        overflowX="auto"
        borderWidth="1px"
        borderRadius="md"
        borderColor="border"
      >
        <Box as="table" width="100%" minW="800px" borderCollapse="collapse">
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
                Horário do ponto
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
                Ponto em atraso
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
                Status
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
                Ação
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
                Detalhes
              </Box>
            </Box>
          </Box>

          <Box as="tbody">
            {filteredPunches.length === 0 ? (
              <Box as="tr">
                <td
                  colSpan={6}
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    color: "var(--chakra-colors-fg-muted)",
                  }}
                >
                  Nenhum ponto encontrado com os filtros atuais.
                </td>
              </Box>
            ) : (
              filteredPunches.map((punch) => (
                <Box as="tr" key={punch.id} borderTopWidth="1px" className="animate-punch-row">
                  <Box
                    as="td"
                    px={{ base: 3, md: 6 }}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    fontWeight="semibold"
                    color="fg"
                  >
                    {punch.employeeName}
                  </Box>
                  <Box as="td" px={{ base: 3, md: 6 }} py={4} color="fg.muted">
                    <Text fontWeight="semibold" color="fg">
                      {formatTimeOnly(punch.timePunched)}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {formatDateOnly(punch.timePunched)}
                    </Text>
                  </Box>
                  <Box as="td" px={{ base: 3, md: 6 }} py={4}>
                    <StatusPill isLate={punch.isLate} />
                  </Box>
                  <Box as="td" px={{ base: 3, md: 6 }} py={4}>
                    <ApprovalPill isApproved={isAttendanceApproved(punch)} />
                  </Box>
                  <Box as="td" px={{ base: 3, md: 6 }} py={4}>
                    {punch.isLate && !isAttendanceApproved(punch) ? (
                      <Button
                        size="xs"
                        variant="outline"
                        borderRadius="full"
                        borderColor={validateBorder}
                        color={validateColor}
                        loading={validatingIds.includes(punch.id)}
                        loadingText="Validando"
                        onClick={() => handleValidateAttendance(punch.id)}
                      >
                        Validar
                      </Button>
                    ) : (
                      <Text fontSize="xs" color="fg.muted">
                        --
                      </Text>
                    )}
                  </Box>
                  <Box as="td" px={{ base: 3, md: 6 }} py={4} textAlign="right">
                    <IconButton
                      aria-label={`Ver detalhes do ponto de ${punch.employeeName}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedPunch(punch)}
                    >
                      <FaInfoCircle />
                    </IconButton>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Box>
      </Box>

      <DialogRoot
        open={Boolean(selectedPunch)}
        onOpenChange={(details) => {
          if (!details.open) {
            setSelectedPunch(null);
          }
        }}
        placement="center"
      >
        <Portal>
          <DialogBackdrop bg="blackAlpha.600" />
          <DialogPositioner>
            <DialogContent
              w={{ base: "92vw", md: "840px" }}
              maxH={{ base: "85vh", md: "90vh" }}
              borderRadius="16px"
              boxShadow="lg"
              bg={dialogBg}
              borderWidth="1px"
              borderColor={dialogBorder}
            >
              <DialogHeader px={6} pt={5} pb={3}>
                <DialogTitle fontSize="lg" fontWeight="semibold" color="fg">
                  Detalhes do ponto
                </DialogTitle>
                <IconButton
                  aria-label="Fechar detalhes do ponto"
                  variant="ghost"
                  onClick={() => setSelectedPunch(null)}
                  position="absolute"
                  top={3}
                  right={3}
                >
                  <FaTimes />
                </IconButton>
              </DialogHeader>

              <DialogBody px={6} pb={4} overflowY="auto">
                {activePunch && (
                  <VStack align="stretch" gap={4}>
                    <InfoRow
                      label="Colaborador"
                      value={activePunch.employeeName}
                    />
                    <InfoRow
                      label="Registro"
                      value={formatDateTime(activePunch.timePunched)}
                    />
                    <InfoRow
                      label="Tipo de ponto"
                      value={resolvePunchTypeLabel(activePunch.punchType)}
                    />
                    <InfoRow label="Turno" value={activePunch.shiftType} />
                    <InfoRow
                      label="Status"
                      value={<StatusPill isLate={activePunch.isLate} />}
                    />
                    <InfoRow
                      label="Validação"
                      value={
                        <ApprovalPill
                          isApproved={isAttendanceApproved(activePunch)}
                        />
                      }
                    />

                    {activePunch.isLate && (
                      <Box
                        mt={2}
                        p={4}
                        borderRadius="md"
                        bg={lateCardBg}
                        borderWidth="1px"
                        borderColor={lateCardBorder}
                      >
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color={lateTitleColor}
                          mb={3}
                        >
                          Detalhes do atraso
                        </Text>
                        <VStack align="stretch" gap={3}>
                          <InfoRow
                            label="Motivo"
                            value={activePunch.lateReason ?? "--"}
                          />
                          {activePunch.lateNote && (
                            <InfoRow
                              label="Observação"
                              value={activePunch.lateNote}
                            />
                          )}
                          <Flex
                            justify="space-between"
                            align="center"
                            gap={4}
                            flexWrap="wrap"
                          >
                            <Text fontSize="sm" color="fg.muted">
                              Anexo
                            </Text>
                            {activePunch.lateAttachmentUrl ? (
                              <Flex align="center" gap={3}>
                                <Text fontSize="sm" color="fg.muted">
                                  {activePunch.lateAttachmentName}
                                </Text>
                                <Button
                                  as="a"
                                  size="sm"
                                  variant="outline"
                                  borderRadius="full"
                                  {...({
                                    href: activePunch.lateAttachmentUrl,
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                  } as any)}
                                >
                                  Ver anexo
                                </Button>
                              </Flex>
                            ) : (
                              <Text fontSize="sm" color="fg.muted">
                                Sem anexo
                              </Text>
                            )}
                          </Flex>
                        </VStack>
                      </Box>
                    )}
                  </VStack>
                )}
              </DialogBody>
            </DialogContent>
          </DialogPositioner>
        </Portal>
      </DialogRoot>
    </Box>
  );
};

export default FiltrarPontoRH;
