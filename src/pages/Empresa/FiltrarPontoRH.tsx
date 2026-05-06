import {
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
  DialogFooter,
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
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaFilter, FaInfoCircle, FaTimes } from "react-icons/fa";
import { Input } from "../../components/ui/Input";

type PunchType = "IN" | "OUT";

interface PunchRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  timePunched: string;
  punchType: PunchType;
  shiftType: string;
  isLate: boolean;
  lateReason?: string;
  lateNote?: string;
  lateAttachmentName?: string;
  lateAttachmentUrl?: string;
  device?: string;
  location?: string;
  ipAddress?: string;
  source?: string;
  createdBy?: string;
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

const mockPunches: PunchRecord[] = [
  {
    id: "p-001",
    employeeId: "emp-001",
    employeeName: "Ana Souza",
    timePunched: "2026-05-06T08:07:00-03:00",
    punchType: "IN",
    shiftType: "Matutino",
    isLate: true,
    lateReason: "TRÂNSITO",
    lateNote: "Acidente leve na via principal atrasou o deslocamento.",
    lateAttachmentName: "justificativa-ana.pdf",
    lateAttachmentUrl: "https://files.deltafour.local/justificativa-ana.pdf",
    device: "Totem 01",
    location: "Portaria principal",
    ipAddress: "10.0.0.12",
    source: "Totem",
    createdBy: "Auto",
  },
  {
    id: "p-002",
    employeeId: "emp-001",
    employeeName: "Ana Souza",
    timePunched: "2026-05-06T17:01:00-03:00",
    punchType: "OUT",
    shiftType: "Matutino",
    isLate: false,
    device: "Totem 01",
    location: "Portaria principal",
    ipAddress: "10.0.0.12",
    source: "Totem",
    createdBy: "Auto",
  },
  {
    id: "p-003",
    employeeId: "emp-002",
    employeeName: "Bruno Lima",
    timePunched: "2026-05-06T07:58:00-03:00",
    punchType: "IN",
    shiftType: "Matutino",
    isLate: false,
    device: "App iOS",
    location: "Entrada lateral",
    ipAddress: "10.0.0.28",
    source: "Mobile",
    createdBy: "Auto",
  },
  {
    id: "p-004",
    employeeId: "emp-002",
    employeeName: "Bruno Lima",
    timePunched: "2026-05-06T12:04:00-03:00",
    punchType: "OUT",
    shiftType: "Matutino",
    isLate: false,
    device: "App iOS",
    location: "Entrada lateral",
    ipAddress: "10.0.0.28",
    source: "Mobile",
    createdBy: "Auto",
  },
  {
    id: "p-005",
    employeeId: "emp-003",
    employeeName: "Carla Mendes",
    timePunched: "2026-05-05T09:14:00-03:00",
    punchType: "IN",
    shiftType: "Vespertino",
    isLate: true,
    lateReason: "SAÚDE",
    lateNote: "Consulta médica confirmada.",
    lateAttachmentName: "atestado-carla.jpg",
    lateAttachmentUrl: "https://files.deltafour.local/atestado-carla.jpg",
    device: "Painel RH",
    location: "Recepção",
    ipAddress: "10.0.1.15",
    source: "RH",
    createdBy: "RH",
  },
  {
    id: "p-006",
    employeeId: "emp-003",
    employeeName: "Carla Mendes",
    timePunched: "2026-05-05T18:03:00-03:00",
    punchType: "OUT",
    shiftType: "Vespertino",
    isLate: false,
    device: "Painel RH",
    location: "Recepção",
    ipAddress: "10.0.1.15",
    source: "RH",
    createdBy: "RH",
  },
  {
    id: "p-007",
    employeeId: "emp-004",
    employeeName: "Diego Alves",
    timePunched: "2026-05-04T06:55:00-03:00",
    punchType: "IN",
    shiftType: "Noturno",
    isLate: false,
    device: "Totem 02",
    location: "Docas",
    ipAddress: "10.0.2.19",
    source: "Totem",
    createdBy: "Auto",
  },
  {
    id: "p-008",
    employeeId: "emp-004",
    employeeName: "Diego Alves",
    timePunched: "2026-05-04T15:02:00-03:00",
    punchType: "OUT",
    shiftType: "Noturno",
    isLate: false,
    device: "Totem 02",
    location: "Docas",
    ipAddress: "10.0.2.19",
    source: "Totem",
    createdBy: "Auto",
  },
];

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

const resolvePunchPositionLabel = (punch: EnrichedPunchRecord) => {
  if (punch.isFirstOfDay && punch.isLastOfDay) {
    return "Única batida do dia";
  }

  if (punch.isFirstOfDay) {
    return "Primeiro batido";
  }

  if (punch.isLastOfDay) {
    return "Último batido";
  }

  return "Intermediário";
};

const selectBaseStyle: CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "0.375rem",
  border: "1px solid #E2E8F0",
  backgroundColor: "#FFFFFF",
  color: "#1A202C",
};

const InfoRow = ({ label, value }: { label: string; value: ReactNode }) => (
  <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
    <Text fontSize="sm" color="gray.500">
      {label}
    </Text>
    <Box fontSize="sm" fontWeight="medium" color="gray.700" textAlign="right">
      {value}
    </Box>
  </Flex>
);

const StatusPill = ({ isLate }: { isLate: boolean }) => (
  <Box
    px={3}
    py={1}
    borderRadius="full"
    fontSize="xs"
    fontWeight="semibold"
    bg={isLate ? "red.100" : "green.100"}
    color={isLate ? "red.700" : "green.700"}
    display="inline-flex"
    alignItems="center"
  >
    {isLate ? "Em atraso" : "No horário"}
  </Box>
);

const FiltrarPontoRH = () => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);
  const [selectedPunch, setSelectedPunch] =
    useState<EnrichedPunchRecord | null>(null);

  const enrichedPunches = useMemo<EnrichedPunchRecord[]>(() => {
    const withMeta = mockPunches.map((punch) => {
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
      const key = `${punch.employeeId}-${punch.dateKey}`;
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
  }, []);

  const filteredPunches = useMemo(() => {
    const normalizedSearch = filters.search.trim().toLowerCase();
    e;

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

  return (
    <Box
      bg="white"
      p={6}
      borderRadius="lg"
      boxShadow="xl"
      className="animate-fade-in"
    >
      <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
        <Box>
          <Heading
            size="lg"
            color="gray.800"
            display="flex"
            alignItems="center"
            gap={3}
          >
            Pontos por colaborador
          </Heading>
          <Text mt={2} fontSize="sm" color="gray.500">
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
        bgGradient="linear(to-r, #F8FAFC, #EFF6FF)"
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
            <Text mb={1} fontSize="sm" fontWeight="medium" color="gray.700">
              Nome
            </Text>
            <Input
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              placeholder="Buscar colaborador"
              bg="white"
            />
          </GridItem>

          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="gray.700">
              Data
            </Text>
            <Input
              name="date"
              type="date"
              value={filters.date}
              onChange={handleFilterChange}
              bg="white"
            />
          </GridItem>

          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="gray.700">
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
            <Text mb={1} fontSize="sm" fontWeight="medium" color="gray.700">
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
            <Text mb={1} fontSize="sm" fontWeight="medium" color="gray.700">
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
            <Text mb={1} fontSize="sm" fontWeight="medium" color="gray.700">
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
        <Text fontSize="sm" color="gray.500">
          Resultados: {summary.total} | Em atraso: {summary.late} | No horário:{" "}
          {summary.onTime}
        </Text>
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
                Horário do ponto
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
                Ponto em atraso
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
                Detalhes
              </Box>
            </Box>
          </Box>

          <Box as="tbody">
            {filteredPunches.length === 0 ? (
              <Box as="tr">
                <Box
                  as="td"
                  colSpan={4}
                  px={6}
                  py={6}
                  textAlign="center"
                  color="gray.500"
                >
                  Nenhum ponto encontrado com os filtros atuais.
                </Box>
              </Box>
            ) : (
              filteredPunches.map((punch) => (
                <Box as="tr" key={punch.id} borderTopWidth="1px">
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    fontWeight="semibold"
                    color="red.800"
                  >
                    {punch.employeeName}
                  </Box>
                  <Box as="td" px={6} py={4} color="gray.600">
                    <Text fontWeight="semibold" color="gray.700">
                      {formatTimeOnly(punch.timePunched)}
                    </Text>
                    <Text fontSize="xs" color="gray.500">
                      {formatDateOnly(punch.timePunched)}
                    </Text>
                  </Box>
                  <Box as="td" px={6} py={4}>
                    <StatusPill isLate={punch.isLate} />
                  </Box>
                  <Box as="td" px={6} py={4} textAlign="right">
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
            >
              <DialogHeader px={6} pt={5} pb={3}>
                <DialogTitle
                  fontSize="lg"
                  fontWeight="semibold"
                  color="gray.700"
                >
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
                      label="Batida do dia"
                      value={resolvePunchPositionLabel(activePunch)}
                    />
                    <InfoRow
                      label="Status"
                      value={<StatusPill isLate={activePunch.isLate} />}
                    />
                    <InfoRow
                      label="Origem"
                      value={activePunch.source ?? "--"}
                    />
                    <InfoRow
                      label="Dispositivo"
                      value={activePunch.device ?? "--"}
                    />
                    <InfoRow
                      label="Local"
                      value={activePunch.location ?? "--"}
                    />
                    <InfoRow label="IP" value={activePunch.ipAddress ?? "--"} />
                    <InfoRow
                      label="Registrado por"
                      value={activePunch.createdBy ?? "--"}
                    />

                    {activePunch.isLate && (
                      <Box
                        mt={2}
                        p={4}
                        borderRadius="md"
                        bg="red.50"
                        borderWidth="1px"
                        borderColor="red.100"
                      >
                        <Text
                          fontSize="sm"
                          fontWeight="semibold"
                          color="red.700"
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
                            <Text fontSize="sm" color="gray.500">
                              Anexo
                            </Text>
                            {activePunch.lateAttachmentUrl ? (
                              <Flex align="center" gap={3}>
                                <Text fontSize="sm" color="gray.600">
                                  {activePunch.lateAttachmentName}
                                </Text>
                                <Button
                                  as="a"
                                  href={activePunch.lateAttachmentUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  size="sm"
                                  variant="outline"
                                  borderRadius="full"
                                >
                                  Ver anexo
                                </Button>
                              </Flex>
                            ) : (
                              <Text fontSize="sm" color="gray.600">
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
