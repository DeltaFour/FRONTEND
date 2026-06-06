import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { FaHistory } from "react-icons/fa";
import api from "../../services/api";
import { toaster } from "../../components/ui/toaster";

interface PunchHistoryItem {
  id: string;
  type: string;
  timePunched: string;
  shiftType?: string;
}

interface WorkShift {
  id: string;
  shiftType: string;
  startTime: string;
  endTime: string;
}

const normalizeHistory = (rawData: unknown): PunchHistoryItem[] => {
  if (!Array.isArray(rawData)) {
    return [];
  }

  return rawData.map((item, index) => {
    const rawItem = (item || {}) as Record<string, unknown>;

    return {
      id: String(rawItem.id ?? index),
      type: String(rawItem.type ?? rawItem.punchType ?? "N/A"),
      timePunched: String(
        rawItem.timePunched ?? rawItem.punchTime ?? rawItem.punchDate ?? "",
      ),
      shiftType: rawItem.shiftType ? String(rawItem.shiftType) : undefined,
    };
  });
};

const normalizeWorkShifts = (rawData: unknown): WorkShift[] => {
  if (Array.isArray(rawData)) {
    return rawData as WorkShift[];
  }

  if (rawData && typeof rawData === "object") {
    const data = (rawData as { data?: unknown }).data;
    if (Array.isArray(data)) {
      return data as WorkShift[];
    }
  }

  return [];
};

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return date.toLocaleString("pt-BR");
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

const formatDateOnly = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return date.toLocaleDateString("pt-BR");
};

const parseTimeToMinutes = (value: string) => {
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

const punchLabels = [
  "Início do trabalho",
  "Início do intervalo",
  "Fim do intervalo",
  "Saída",
];

const HistoricoPontos = () => {
  const [history, setHistory] = useState<PunchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [shiftType, setShiftType] = useState<string | undefined>(undefined);
  const [workShifts, setWorkShifts] = useState<WorkShift[]>([]);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);

      const response = await api.get("/user/refresh-information");
      const payload = response.data?.lastUserAttendances ?? [];
      const normalizedHistory = normalizeHistory(payload);
      const resolvedShiftType =
        response.data?.shiftType ?? normalizedHistory[0]?.shiftType;
      setShiftType(resolvedShiftType);
      setHistory(normalizedHistory);

      const workShiftResponse = await api.get("/workshift/list");
      setWorkShifts(normalizeWorkShifts(workShiftResponse.data));
    } catch (err) {
      const description = "Não foi possível carregar seu histórico de pontos.";
      toaster.error({
        title: "Erro ao carregar histórico",
        description,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchHistory();
  }, [fetchHistory]);

  const groupedHistory = useMemo(() => {
    const map = new Map<
      string,
      { dateKey: string; dateMs: number; items: PunchHistoryItem[] }
    >();

    history.forEach((item) => {
      const date = new Date(item.timePunched);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      const dateKey = date.toISOString().slice(0, 10);
      const startOfDay = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
      );
      const existing = map.get(dateKey);

      if (existing) {
        existing.items.push(item);
      } else {
        map.set(dateKey, {
          dateKey,
          dateMs: startOfDay.getTime(),
          items: [item],
        });
      }
    });

    return Array.from(map.values())
      .map((group) => {
        group.items.sort(
          (a, b) =>
            new Date(a.timePunched).getTime() -
            new Date(b.timePunched).getTime(),
        );
        return group;
      })
      .sort((a, b) => b.dateMs - a.dateMs);
  }, [history]);

  const expectedMinutes = useMemo(() => {
    if (!shiftType) {
      return null;
    }

    const shift = workShifts.find((item) => item.shiftType === shiftType);
    if (!shift) {
      return null;
    }

    const startMinutes = parseTimeToMinutes(shift.startTime);
    const endMinutes = parseTimeToMinutes(shift.endTime);

    if (startMinutes === null || endMinutes === null) {
      return null;
    }

    const normalizedEnd =
      endMinutes < startMinutes ? endMinutes + 24 * 60 : endMinutes;
    return normalizedEnd - startMinutes;
  }, [shiftType, workShifts]);

  if (loading) {
    return (
      <Flex justify="center" align="center" py={10}>
        <Spinner mr={3} />
        <Text>Carregando histórico...</Text>
      </Flex>
    );
  }

  return (
    <Box bg="surface" p={{ base: 3, md: 6 }} borderRadius="lg" boxShadow="xl">
      <Heading
        size="lg"
        mb={6}
        color="fg"
        display="flex"
        alignItems="center"
        gap={3}
      >
        <FaHistory color="#4F46E5" /> Histórico de Pontos
      </Heading>

      {history.length === 0 ? (
        <Box p={4} bg="surface.subtle" borderRadius="md" color="fg.muted">
          Nenhuma marcação encontrada.
        </Box>
      ) : (
        <Flex direction="column" gap={6}>
          {groupedHistory.map((group) => {
            const workedMinutes = group.items.reduce((total, item, index) => {
              if (index % 2 !== 0) {
                return total;
              }

              const nextItem = group.items[index + 1];
              if (!nextItem) {
                return total;
              }

              const start = new Date(item.timePunched).getTime();
              const end = new Date(nextItem.timePunched).getTime();
              if (Number.isNaN(start) || Number.isNaN(end)) {
                return total;
              }

              return total + Math.max(0, Math.floor((end - start) / 60000));
            }, 0);

            const balanceMinutes =
              expectedMinutes === null ? null : workedMinutes - expectedMinutes;

            return (
              <Box
                key={group.dateKey}
                borderWidth="1px"
                borderRadius="lg"
                p={4}
                borderColor="border"
              >
                <Flex
                  justify="space-between"
                  align="center"
                  flexWrap="wrap"
                  gap={4}
                  mb={4}
                >
                  <Box>
                    <Text fontSize="sm" color="fg.muted">
                      Dia
                    </Text>
                    <Text fontSize="lg" fontWeight="semibold" color="fg">
                      {formatDateOnly(
                        group.items[0]?.timePunched ?? group.dateKey,
                      )}
                    </Text>
                  </Box>
                  <Flex gap={6} flexWrap="wrap">
                    <Box>
                      <Text fontSize="sm" color="fg.muted">
                        Horas trabalhadas
                      </Text>
                      <Text fontWeight="semibold" color="fg">
                        {formatDuration(workedMinutes)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="fg.muted">
                        Turno
                      </Text>
                      <Text fontWeight="semibold" color="fg">
                        {shiftType ?? "N/A"}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="fg.muted">
                        Previsto
                      </Text>
                      <Text fontWeight="semibold" color="fg">
                        {formatDuration(expectedMinutes)}
                      </Text>
                    </Box>
                    <Box>
                      <Text fontSize="sm" color="fg.muted">
                        Saldo
                      </Text>
                      <Text
                        fontWeight="semibold"
                        color={
                          balanceMinutes === null
                            ? "fg.muted"
                            : balanceMinutes < 0
                              ? "red.400"
                              : "green.400"
                        }
                      >
                        {formatDuration(balanceMinutes)}
                      </Text>
                    </Box>
                  </Flex>
                </Flex>

                <Box
                  overflowX="auto"
                  borderWidth="1px"
                  borderRadius="md"
                  borderColor="border"
                >
                  <Box as="table" w="full" minW="500px" borderCollapse="collapse">
                    <Box as="thead" bg="surface.subtle">
                      <Box as="tr">
                        <Box
                          as="th"
                          px={4}
                          py={3}
                          textAlign="left"
                          fontSize="xs"
                          color="fg.muted"
                          textTransform="uppercase"
                        >
                          Marca
                        </Box>
                        <Box
                          as="th"
                          px={4}
                          py={3}
                          textAlign="left"
                          fontSize="xs"
                          color="fg.muted"
                          textTransform="uppercase"
                        >
                          Registro
                        </Box>
                      </Box>
                    </Box>
                    <Box as="tbody">
                      {group.items.map((punch, index) => (
                        <Box as="tr" key={punch.id} borderTopWidth="1px">
                          <Box
                            as="td"
                            px={4}
                            py={3}
                            fontWeight="semibold"
                            color="fg"
                          >
                            {punchLabels[index % punchLabels.length]}
                          </Box>
                          <Box as="td" px={4} py={3} color="fg.muted">
                            {formatDateTime(punch.timePunched)}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </Box>
              </Box>
            );
          })}
        </Flex>
      )}
    </Box>
  );
};

export default HistoricoPontos;
