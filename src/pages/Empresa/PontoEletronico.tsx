import { useCallback, useEffect, useState } from "react";
import { Box, Button, Flex, Heading, Spinner, Text } from "@chakra-ui/react";
import { FaClock, FaTimes } from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { toaster } from "../../components/ui/toaster";

interface AllowedPunch {
  punchType: string;
}

const PontoEletronico = () => {
  const { user } = useAuth();
  const [allowedPunch, setAllowedPunch] = useState<AllowedPunch | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const horarioAtual = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dataAtual = new Date().toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const fetchAllowedPunch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/user/allowed-punch");
      setAllowedPunch(response.data as AllowedPunch);
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

  const handlePunch = async () => {
    if (!allowedPunch || submitting) return;

    const punchType = allowedPunch.punchType;

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
