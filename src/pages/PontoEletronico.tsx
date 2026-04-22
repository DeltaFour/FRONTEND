import { useCallback, useEffect, useState } from "react";
import { Box, Button, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { FaClock, FaSignInAlt, FaSignOutAlt, FaTimes } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

interface AllowedPunch {
  punchType: string;
}

const PontoEletronico = () => {
  const { user } = useAuth();
  const [allowedPunch, setAllowedPunch] = useState<AllowedPunch | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllowedPunch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/user/allowed-punch");
      setAllowedPunch(response.data as AllowedPunch);
    } catch (err) {
      console.error("Erro ao buscar status do ponto:", err);
      setError("Não foi possível carregar o status de marcação.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAllowedPunch();
  }, [fetchAllowedPunch]);

  const handlePunch = async () => {
    if (!allowedPunch || submitting) return;

    const punchType = allowedPunch.punchType;
    const confirmMsg = `Confirmar marcação de ponto: ${punchType}?`;

    // eslint-disable-next-line no-alert
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    setError(null);

    const payload = {
      type: punchType,
      timePunched: new Date().toISOString(),
      shiftType: user?.shiftType,
      imageBase64: null,
      latitude: 0,
      longitude: 0,
    };

    try {
      await api.post("v1/user/punch-in", payload);
      // eslint-disable-next-line no-alert
      alert(`Ponto de ${punchType} registrado com sucesso!`);
      void fetchAllowedPunch();
    } catch (err: unknown) {
      console.error("Erro ao marcar ponto:", err);
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      setError(
        `Erro ao marcar ponto: ${
          message ?? "Verifique a jornada de trabalho."
        }`,
      );
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

  if (!allowedPunch) {
    return (
      <Flex justify="center" py={8}>
        <Text>Dados de ponto não disponíveis.</Text>
      </Flex>
    );
  }

  const isPunchIn = allowedPunch.punchType === "IN";

  return (
    <Box
      p={8}
      bg="white"
      borderRadius="lg"
      boxShadow="2xl"
      maxW="lg"
      mx="auto"
      textAlign="center"
    >
      <Heading mb={6} size="lg" color="gray.800">
        <Flex align="center" justify="center" gap={3}>
          <FaClock color="#4F46E5" /> Marcação de Ponto
        </Flex>
      </Heading>

      <Text fontSize="lg" color="gray.600" mb={2}>
        Próxima Ação Necessária:
      </Text>
      <Text
        fontSize="3xl"
        fontWeight="bold"
        mb={8}
        color={isPunchIn ? "green.500" : "red.500"}
      >
        {isPunchIn ? "ENTRADA (IN)" : "SAÍDA (OUT)"}
      </Text>

      <Button
        w="full"
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
        colorPalette={isPunchIn ? "green" : "red"}
        onClick={handlePunch}
        isDisabled={submitting}
      >
        {submitting ? (
          <>
            <Spinner size="sm" />
            <Text>Registrando...</Text>
          </>
        ) : (
          <>
            {isPunchIn ? <FaSignInAlt /> : <FaSignOutAlt />}
            <Text>Marcar Ponto de {allowedPunch.punchType}</Text>
          </>
        )}
      </Button>

      <Text mt={6} fontSize="sm" color="gray.500">
        Turno Atual: {user?.shiftType ?? "N/A"}
      </Text>
    </Box>
  );
};

export default PontoEletronico;
