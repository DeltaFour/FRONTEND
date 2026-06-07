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
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaArrowLeft } from "react-icons/fa";
import api from "../../services/api";
import { Input } from "../../components/ui/Input";
import { toaster } from "../../components/ui/toaster";
import { useColorModeValue } from "../../theme/colorMode";

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
  const selectBg = useColorModeValue("#FFFFFF", "#1A1A1F");
  const selectColor = useColorModeValue("#1A202C", "#E2E8F0");
  const selectBorder = useColorModeValue(
    "1px solid #E2E8F0",
    "1px solid rgba(255, 255, 255, 0.1)",
  );
  const selectColorScheme = useColorModeValue("light", "dark");

  const selectStyle: React.CSSProperties = {
    width: "100%",
    padding: "8px 12px",
    borderRadius: "0.375rem",
    border: selectBorder,
    backgroundColor: selectBg,
    color: selectColor,
    colorScheme: selectColorScheme as any,
    outline: "none",
    cursor: "pointer",
    appearance: "auto",
  };

  const navigate = useNavigate();
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
  const [shiftTypes, setShiftTypes] = useState<string[]>(["Matutino", "Diurno", "Noturno"]);
  const [formData, setFormData] = useState<PontoFormData>(() => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return {
      employeeId: "",
      type: "IN",
      timePunched: new Date(now.getTime() - offset).toISOString().slice(0, 16),
      shiftType: "Matutino",
    };
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSetNow = (e: React.MouseEvent) => {
    e.preventDefault();
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    const localISOTime = new Date(now.getTime() - offset).toISOString().slice(0, 16);
    setFormData((prev) => ({
      ...prev,
      timePunched: localISOTime,
    }));
  };

  const fetchEmployees = useCallback(async () => {
    try {
      const [empResponse, shiftResponse] = await Promise.all([
        api.get("/user/list"),
        api.get("/workshift/list"),
      ]);

      const empData = (empResponse.data?.data ?? empResponse.data) as Funcionario[];
      const filtered = empData.filter((f) => f.roleName === "EMPLOYEE");
      setFuncionarios(filtered);

      const shiftData = (shiftResponse.data?.data ?? shiftResponse.data ?? []) as { shiftType?: string }[];
      const uniqueTypes = Array.from(new Set(shiftData.map((s) => s.shiftType).filter(Boolean))) as string[];

      if (uniqueTypes.length > 0) {
        setShiftTypes(uniqueTypes);
        setFormData((prev) => ({ ...prev, shiftType: uniqueTypes[0] }));
      }
    } catch (err) {
      toaster.error({
        title: "Erro ao carregar dados",
        description: "Não foi possível carregar a lista de funcionários ou turnos.",
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

    const payload = {
      userId: formData.employeeId,
      type: formData.type,
      timePunched: new Date(formData.timePunched).toISOString(),
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
      toaster.error({
        title: "Erro ao registrar ponto",
        description: `Erro: ${message ?? "Verifique se o usuário e o turno estão corretos."}`,
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

  return (
    <Box
      p={6}
      bg="surface"
      borderRadius="lg"
      boxShadow="xl"
      maxW="3xl"
      mx="auto"
    >
      <Flex justify="space-between" align="center" mb={6} wrap="wrap" gap={3}>
        <Heading
          size="lg"
          color="fg"
          display="flex"
          alignItems="center"
          gap={3}
        >
          Registro de Ponto — Terceiros
        </Heading>
        <Button
          variant="outline"
          p="15px"
          w="96px"
          h="34px"
          borderRadius="full"
          onClick={() => navigate(-1)}
        >
          <FaArrowLeft style={{ marginRight: '8px' }} /> Voltar
        </Button>
      </Flex>

      <Box
        bg="surface.subtle"
        borderWidth="1px"
        borderColor="border"
        borderRadius="md"
        p={4}
        mb={6}
      >
        <Text fontWeight="semibold" color="fg" mb={1}>
          Como usar
        </Text>
        <Text fontSize="sm" color="fg.muted">
          Registre pontos manuais, ajustes de turno ou marcações retroativas.
          Para registrar o ponto atual, clique em "Usar horário atual".
        </Text>
      </Box>

      <Box as="form" onSubmit={handleSubmit}>
        <VStack align="stretch" gap={6}>
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={6}>
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <Text mb={1} fontWeight="medium" color="fg">
                Funcionário
              </Text>
              <select
                name="employeeId"
                id="employeeId"
                value={formData.employeeId}
                onChange={handleChange}
                required
                style={selectStyle}
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
              <Text mb={1} fontWeight="medium" color="fg">
                Tipo de Registro
              </Text>
              <select
                name="type"
                id="type"
                value={formData.type}
                onChange={handleChange}
                required
                style={selectStyle}
              >
                <option value="IN">Entrada</option>
                <option value="OUT">Saída</option>
              </select>
            </GridItem>

            <GridItem>
              <Text mb={1} fontWeight="medium" color="fg">
                Turno
              </Text>
              <select
                name="shiftType"
                id="shiftType"
                value={formData.shiftType}
                onChange={handleChange}
                required
                style={selectStyle}
              >
                {shiftTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </GridItem>

            <GridItem colSpan={{ base: 1, md: 2 }}>
              <Flex justify="space-between" align="center" mb={1} wrap="wrap">
                <Text fontWeight="medium" color="fg">
                  Data e Hora
                </Text>
                <Button
                  type="button"
                  size="xs"
                  variant="ghost"
                  borderRadius="full"
                  p="15px"
                  onClick={handleSetNow}
                >
                  Usar horário atual
                </Button>
              </Flex>
              <Input
                type="datetime-local"
                name="timePunched"
                id="timePunched"
                value={formData.timePunched}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    timePunched: event.target.value,
                  }))
                }
                required
              />
              <Text mt={1} fontSize="xs" color="fg.muted">
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
                <>Confirmar registro</>
              )}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

export default PontoParaFuncionario;
