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
  Heading,
  Input,
  Select,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FaCalendarCheck,
  FaClock,
  FaExclamationTriangle,
  FaUserFriends,
} from "react-icons/fa";
import api from "../services/api";

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

  const fetchEmployees = useCallback(async () => {
    try {
      const response = await api.get("/user/list");
      const data = (response.data?.data ?? response.data) as Funcionario[];
      const filtered = data.filter((f) => f.roleName !== "COMPANY_ADMIN");
      setFuncionarios(filtered);
      setError(null);
    } catch (err) {
      console.error("Erro ao buscar funcionários:", err);
      setError("Não foi possível carregar a lista de funcionários.");
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload = {
      employeeId: formData.employeeId,
      type: formData.type,
      timePunched: formData.timePunched,
      shiftType: formData.shiftType,
    };

    try {
      await api.post("user/punch-for-user", payload);
      // eslint-disable-next-line no-alert
      alert(`Ponto de ${formData.type} registrado com sucesso para o usuário!`);
      navigate("/dashboard-empresa/funcionarios");
    } catch (err: unknown) {
      console.error("Erro ao marcar ponto para funcionário:", err);
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      setError(
        `Erro: ${
          message ?? "Verifique se o usuário e o turno estão corretos."
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
    <Box p={6} bg="white" borderRadius="lg" boxShadow="xl" maxW="2xl" mx="auto">
      <Heading
        size="lg"
        color="gray.800"
        mb={6}
        display="flex"
        alignItems="center"
        gap={3}
        borderBottomWidth="1px"
        pb={3}
      >
        <FaCalendarCheck color="#4F46E5" /> Marcar Ponto (Terceiros)
      </Heading>

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
          <Box>
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
            <Select
              name="employeeId"
              id="employeeId"
              value={formData.employeeId}
              onChange={handleChange}
              required
            >
              <option value="">Selecione o Funcionário</option>
              {funcionarios.map((func) => (
                <option key={func.id} value={func.id}>
                  {func.name} ({func.email}) - {func.roleName}
                </option>
              ))}
            </Select>
          </Box>

          <Box>
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
            <Select
              name="type"
              id="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="IN">Entrada (IN)</option>
              <option value="OUT">Saída (OUT)</option>
              <option value="INTERVAL_IN">Início Intervalo</option>
              <option value="INTERVAL_OUT">Fim Intervalo</option>
            </Select>
          </Box>

          <Box>
            <Text mb={1} fontWeight="medium" color="gray.700">
              Data e Hora do Ponto
            </Text>
            <Input
              type="datetime-local"
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
              Este campo permite corrigir ou lançar pontos retroativos.
            </Text>
          </Box>

          <Flex justify="flex-end" pt={4}>
            <Button
              type="submit"
              colorPalette="indigo"
              isDisabled={submitting || !formData.employeeId}
              minW="220px"
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
