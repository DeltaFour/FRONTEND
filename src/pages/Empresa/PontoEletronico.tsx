import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { FaTimes } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { toaster } from "../../components/ui/toaster";

type PunchType = "IN" | "OUT";

interface RefreshInfoResponse {
  shiftType?: string;
  lastPunchType?: PunchType;
}

const PontoEletronico = () => {
  const { user } = useAuth();
  const [punchType, setPunchType] = useState<PunchType | null>(null);
  const [canPunch, setCanPunch] = useState(false);
  const [shiftType, setShiftType] = useState<string | undefined>(
    user?.shiftType as string | undefined,
  );
  const [imageBase64, setImageBase64] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  const horarioAtual = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dataAtual = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const formatTimeOnly = (date: Date) => date.toISOString().slice(11, 19);

  const resolveNextPunchType = (lastPunchType?: PunchType) =>
    lastPunchType === "IN" ? "OUT" : "IN";

  const fetchAllowedPunch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const infoResponse = await api.get<RefreshInfoResponse>(
        "/user/refresh-information",
      );
      const info = infoResponse.data || {};
      const nextPunchType = resolveNextPunchType(info.lastPunchType);

      setShiftType(info.shiftType ?? (user?.shiftType as string | undefined));
      setPunchType(nextPunchType);

      const canPunchResponse = await api.post<boolean>("/user/allowed-punch", {
        timePunched: formatTimeOnly(new Date()),
        punchType: nextPunchType,
      });

      setCanPunch(Boolean(canPunchResponse.data));
    } catch (err) {
      const description = "Não foi possível carregar o status de marcação.";
      setError(description);
      toaster.error({
        title: "Erro ao carregar ponto",
        description,
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAllowedPunch();
  }, [fetchAllowedPunch]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toaster.error({
        title: "Arquivo inválido",
        description: "Selecione uma imagem válida.",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const base64 = dataUrl.split(",")[1] ?? "";
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const getCoordinates = (): Promise<{
    latitude: number;
    longitude: number;
  } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });

  const handlePunch = async () => {
    if (!punchType || submitting) return;

    if (!imageBase64) {
      const description = "Adicione uma foto antes de registrar o ponto.";
      setError(description);
      toaster.error({
        title: "Foto obrigatória",
        description,
      });
      return;
    }

    setSubmitting(true);
    setError(null);

    const coords = await getCoordinates();

    const payload = {
      type: punchType,
      timePunched: new Date().toISOString(),
      shiftType: shiftType ?? "Matutino",
      imageBase64,
      latitude: coords?.latitude ?? 0,
      longitude: coords?.longitude ?? 0,
    };

    try {
      await api.post("/user/register-point", payload);
      toaster.success({
        title: "Ponto registrado",
        description: `Ponto de ${punchType} registrado com sucesso!`,
      });
      void fetchAllowedPunch();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      const description = `Erro ao marcar ponto: ${
        message ?? "Verifique a jornada de trabalho."
      }`;
      setError(description);
      toaster.error({
        title: "Erro ao registrar ponto",
        description,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" py={10}>
        <Spinner mr={3} />
        <Text>Verificando status de ponto...</Text>
      </Flex>
    );
  }

  if (error) {
    return (
      <Flex
        bg="red.50"
        borderWidth="1px"
        borderColor="red.300"
        color="red.700"
        p={4}
        borderRadius="md"
        align="center"
        gap={2}
      >
        <FaTimes />
        <Text>{error}</Text>
      </Flex>
    );
  }

  return (
    <Flex
      p={8}
      bg="white"
      borderRadius="lg"
      boxShadow="2xl"
      mx="auto"
      w="800px"
      h="420px"
      textAlign="center"
      justifyContent="flex-start"
      flexDirection="column"
    >
      <Heading mb={6} size="lg" color="gray.800" w="full">
        <Flex w="full" justifyContent="space-between" p="20px">
          <Flex align="center" justify="center" gap={3} flexDir="column">
            <Text color="primary.500">Horário:</Text>
            <Text fontWeight="bold" fontSize="25px">
              {horarioAtual}
            </Text>
          </Flex>
          <Flex align="center" justify="center" gap={3} flexDir="column">
            <Text color="primary.500">Data:</Text>
            <Text fontWeight="bold" fontSize="25px">
              {dataAtual}
            </Text>
          </Flex>
        </Flex>
      </Heading>
      <Box mb={6} w="full" display="flex" flexDirection="row" gap={4}>
        <Flex
          w="50%"
          justifyContent="start"
          flexDirection="column"
          alignItems="flex-start"
        >
          <Text color="gray.700">Foto para reconhecimento</Text>
          <Input type="file" accept="image/*" onChange={handleImageChange} />
        </Flex>
        <Flex
          w="50%"
          justifyContent="start"
          flexDirection="column"
          alignItems="flex-start"
        >
          <Text color="gray.700">Status</Text>
          <Input
            p="10px"
            isReadOnly
            value={
              punchType
                ? `Proximo ponto: ${punchType} (${canPunch ? "permitido" : "bloqueado"})`
                : "Carregando..."
            }
          />
        </Flex>
      </Box>

      <Button
        w="full"
        h="50px"
        py={4}
        fontSize="xl"
        fontWeight="semibold"
        color="white"
        borderRadius="lg"
        boxShadow="md"
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={3}
        bg="primary.500"
        onClick={handlePunch}
        isDisabled={!canPunch || submitting}
        _disabled={
          submitting ? { bg: "primary.300", cursor: "not-allowed" } : {}
        }
      >
        {submitting ? (
          <>
            <Spinner size="sm" />
            <Text>Registrando...</Text>
          </>
        ) : (
          <>
            <Text>Registrar</Text>
          </>
        )}
      </Button>
    </Flex>
  );
};

export default PontoEletronico;
