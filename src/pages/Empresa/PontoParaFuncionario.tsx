import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FaArrowLeft,
  FaCalendarCheck,
  FaClock,
  FaExclamationTriangle,
  FaUserFriends,
} from "react-icons/fa";
import api from "../../services/api";
import { toaster } from "../../components/ui/toaster";

interface Funcionario {
  id: string;
  name: string;
  email: string;
  roleName: string;
}

interface PontoFormData {
  employeeId: string;
  type: string;
  timePunched: string;
  shiftType: string;
}

const PontoParaFuncionario = () => {
  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [formData, setFormData] = useState<PontoFormData>({
    employeeId: "",
    type: "IN",
    timePunched: new Date().toISOString(),
    shiftType: "Matutino",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSetNow = () => {
    setFormData((prev) => ({
      ...prev,
      timePunched: new Date().toISOString(),
    }));
  };

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get("/user/list");
      const data = (response.data?.data ?? response.data) as Funcionario[];
      const filtered = data.filter((f) => f.roleName === "EMPLOYEE");
      setFuncionarios(filtered);
      setError(null);
    } catch (err) {
      const description = "Não foi possível carregar a lista de funcionários.";
      setError(description);
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

  const handleChange = (
    event: ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      userId: formData.employeeId,
      type: formData.type,
      timePunched: formData.timePunched,
      shiftType: formData.shiftType,
    };

    try {
      await api.post("/user/punch-for-user", payload);
      toaster.success({
        title: "Ponto registrado",
        description: `Ponto de ${formData.type} registrado com sucesso para o usuário!`,
      });
      navigate("/dashboard-empresa/funcionarios");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      const description = `Erro: ${
        message ?? "Verifique se o usuário e o turno estão corretos."
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
        <Text>Carregando lista de funcionários...</Text>
      </Flex>
    );
  }

  if (error && !funcionarios.length) {
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
        <FaExclamationTriangle />
        <Text>{error}</Text>
      </Flex>
    );
  }

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="xl" maxW="3xl" mx="auto">
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
        <Heading
          size="lg"
          color="gray.800"
          display="flex"
          alignItems="center"
          gap={3}
        >
          <FaCalendarCheck color="#4F46E5" /> Marcar Ponto (Terceiros)
        </Heading>
        <Button
          variant="outline"
          p="15px"
          onClick={() => navigate(-1)}
          leftIcon={<FaArrowLeft />}
        >
          Voltar
        </Button>
      </Flex>

      <Box
        bg="gray.50"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="md"
        p={4}
        mb={6}
      >
        <Text fontWeight="semibold" color="gray.700" mb={1}>
          Dica rapida
        </Text>
        <Text fontSize="sm" color="gray.600">
          Use este formulario para registrar pontos manuais, retroativos ou
          ajustes de turno. Se precisar registrar agora, clique em "Agora".
        </Text>
      </Box>

      {error && (
        <Box
          bg="red.50"
          borderWidth="1px"
          borderColor="red.300"
          color="red.700"
          p={3}
          borderRadius="md"
          mb={4}
        >
          <Text fontWeight="bold">Erro:</Text>
          <Text>{error}</Text>
        </Box>
      )}

      <Box as="form" onSubmit={handleSubmit}>
        <VStack align="stretch" gap={6}>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <Text
                mb={1}
                fontWeight="medium"
                color="gray.700"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <FaUserFriends /> Funcionário a Marcar
              </Text>
              <select
                name="employeeId"
                id="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "0.375rem",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  color: "#1A202C",
                  colorScheme: "light",
                }}
              >
                <option value="">Selecione o Funcionário</option>
                {funcionarios.map((func) => (
                  <option key={func.id} value={func.id}>
                    {func.name} ({func.email}) - {func.roleName}
                  </option>
                ))}
              </select>
            </GridItem>

            <GridItem>
              <Text
                mb={1}
                fontWeight="medium"
                color="gray.700"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <FaClock /> Tipo de Ponto
              </Text>
              <select
                name="type"
                id="type"
                value={formData.type}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "0.375rem",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  color: "#1A202C",
                  colorScheme: "light",
                }}
              >
                <option value="IN">Entrada (IN)</option>
                <option value="OUT">Saída (OUT)</option>
              </select>
            </GridItem>

            <GridItem>
              <Text mb={1} fontWeight="medium" color="gray.700">
                Turno do Funcionário
              </Text>
              <select
                name="shiftType"
                id="shiftType"
                value={formData.shiftType}
                onChange={handleChange}
                required
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "0.375rem",
                  border: "1px solid #E2E8F0",
                  backgroundColor: "#FFFFFF",
                  color: "#1A202C",
                  colorScheme: "light",
                }}
              >
                <option value="Matutino">Matutino</option>
                <option value="Diurno">Diurno</option>
                <option value="Noturno">Noturno</option>
              </select>
            </GridItem>

            <GridItem colSpan={{ base: 1, md: 2 }}>
              <Flex justify="space-between" align="center" mb={1} wrap="wrap">
                <Text fontWeight="medium" color="gray.700">
                  Data e Hora do Ponto
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  p="15px"
                  onClick={handleSetNow}
                >
                  Agora
                </Button>
              </Flex>
              <Input
                type="datetime-local"
                color="gray.700"
                name="timePunched"
                id="timePunched"
                value={formData.timePunched.substring(0, 16)}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    timePunched: new Date(event.target.value).toISOString(),
                  }))
                }
                required
              />
              <Text mt={1} fontSize="xs" color="gray.500">
                Use para ajustes retroativos ou correcoes de horario.
              </Text>
            </GridItem>
          </Grid>

          <Flex justify="center" pt={4} gap={3} wrap="wrap">
            <Button
              variant="outline"
              onClick={() => navigate(-1)}
              minW="180px"
              h="36px"
              borderRadius="full"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              colorPalette="indigo"
              disabled={submitting || !formData.employeeId}
              minW="220px"
              h="36px"
              borderRadius="full"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" mr={2} /> Registrando...
                </>
              ) : (
                <>Registrar Ponto</>
              )}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

export default PontoParaFuncionario;
