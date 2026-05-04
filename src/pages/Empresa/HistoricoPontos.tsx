import { useCallback, useEffect, useState } from "react";
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

const formatDateTime = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Data inválida";
  }

  return date.toLocaleString("pt-BR");
};

const HistoricoPontos = () => {
  const [history, setHistory] = useState<PunchHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/user/refresh-information");
      const payload =
        response.data?.lastUserAttendances ??
        response.data?.lastsUserAttendances ??
        [];
      setHistory(normalizeHistory(payload));
    } catch (err) {
      const description = "Não foi possível carregar seu histórico de pontos.";
      setError(description);
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

  if (loading) {
    return (
      <Flex justify="center" align="center" py={10}>
        <Spinner mr={3} />
        <Text>Carregando histórico...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Box
        bg="red.50"
        borderWidth="1px"
        borderColor="red.300"
        color="red.700"
        p={4}
        borderRadius="md"
      >
        <Text>{error}</Text>
      </Box>
    );
  }

  return (
    <Box bg="white" p={6} borderRadius="lg" boxShadow="xl">
      <Heading
        size="lg"
        mb={6}
        color="gray.800"
        display="flex"
        alignItems="center"
        gap={3}
      >
        <FaHistory color="#4F46E5" /> Histórico de Pontos
      </Heading>

      {history.length === 0 ? (
        <Box p={4} bg="gray.50" borderRadius="md" color="gray.600">
          Nenhuma marcação encontrada.
        </Box>
      ) : (
        <Box overflowX="auto" borderWidth="1px" borderRadius="md">
          <Box as="table" w="full" borderCollapse="collapse">
            <Box as="thead" bg="gray.50">
              <Box as="tr">
                <Box
                  as="th"
                  px={4}
                  py={3}
                  textAlign="left"
                  fontSize="xs"
                  color="gray.500"
                  textTransform="uppercase"
                >
                  Tipo
                </Box>
                <Box
                  as="th"
                  px={4}
                  py={3}
                  textAlign="left"
                  fontSize="xs"
                  color="gray.500"
                  textTransform="uppercase"
                >
                  Data/Hora
                </Box>
                <Box
                  as="th"
                  px={4}
                  py={3}
                  textAlign="left"
                  fontSize="xs"
                  color="gray.500"
                  textTransform="uppercase"
                >
                  Turno
                </Box>
              </Box>
            </Box>
            <Box as="tbody">
              {history.map((punch) => (
                <Box as="tr" key={punch.id} borderTopWidth="1px">
                  <Box
                    as="td"
                    px={4}
                    py={3}
                    fontWeight="semibold"
                    color="gray.700"
                  >
                    {punch.type}
                  </Box>
                  <Box as="td" px={4} py={3} color="gray.600">
                    {formatDateTime(punch.timePunched)}
                  </Box>
                  <Box as="td" px={4} py={3} color="gray.600">
                    {punch.shiftType ?? "N/A"}
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default HistoricoPontos;
