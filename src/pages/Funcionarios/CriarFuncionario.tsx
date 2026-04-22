import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Heading,
  Input,
  Select,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FaArrowLeft,
  FaClock,
  FaSave,
  FaUserPlus,
  FaUserShield,
} from "react-icons/fa";
import api from "../../services/api";

interface Shift {
  id: string;
  shiftType: string;
}

interface CreateEmployeeFormData {
  name: string;
  roleName: string;
  email: string;
  password: string;
  cellPhone: string;
  shiftId: string;
  isAllowedBypassCoord: boolean;
  imageBase64: string;
}

const CriarFuncionario = () => {
  const navigate = useNavigate();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [formData, setFormData] = useState<CreateEmployeeFormData>({
    name: "",
    roleName: "",
    email: "",
    password: "",
    cellPhone: "",
    shiftId: "",
    isAllowedBypassCoord: false,
    imageBase64: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const response = await api.get("/workshift/list");
        const data = (response.data?.data ?? response.data) as Shift[];
        setShifts(data);
      } catch (err) {
        console.error("Erro ao carregar turnos:", err);
        setError("Não foi possível carregar os turnos de trabalho.");
      }
    };

    void fetchShifts();
  }, []);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value, type, checked } = event.target as HTMLInputElement &
      HTMLSelectElement;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name: formData.name,
      roleName: formData.roleName,
      email: formData.email,
      password: formData.password,
      cellPhone: formData.cellPhone,
      imageBase64: formData.imageBase64,
      isAllowedBypassCoord: formData.isAllowedBypassCoord,
      userShift: [
        {
          shiftId: formData.shiftId,
          startDate: new Date().toISOString(),
          isActive: true,
        },
      ],
    };

    try {
      await api.post("/user", payload);
      setSuccess(`Funcionário "${formData.name}" cadastrado com sucesso!`);

      setTimeout(() => {
        navigate("/dashboard-empresa/funcionarios");
      }, 1500);
    } catch (err: unknown) {
      console.error("Erro no cadastro do funcionário:", err);
      const responseData = (
        err as {
          response?: {
            data?: { message?: string; errors?: Record<string, string[]> };
          };
        }
      ).response?.data;

      let message = "Ocorreu um erro ao cadastrar o funcionário.";
      if (responseData?.errors) {
        message = Object.values(responseData.errors).flat().join(" | ");
      } else if (responseData?.message) {
        message = responseData.message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (shifts.length === 0 && !error) {
    return (
      <Flex justify="center" align="center" py={10}>
        <Spinner mr={3} />
        <Text>Carregando dados necessários...</Text>
      </Flex>
    );
  }

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="xl" maxW="2xl" mx="auto">
      <Flex justify="space-between" align="center" mb={6}>
        <Heading
          size="lg"
          color="gray.800"
          display="flex"
          alignItems="center"
          gap={3}
        >
          <FaUserPlus color="#16A34A" /> Cadastro de Funcionário
        </Heading>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          display="flex"
          alignItems="center"
          gap={2}
        >
          <FaArrowLeft /> Voltar
        </Button>
      </Flex>

      {success && (
        <Box
          bg="green.50"
          borderWidth="1px"
          borderColor="green.300"
          color="green.700"
          p={3}
          borderRadius="md"
          mb={4}
        >
          {success}
        </Box>
      )}
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
          <Heading size="md" color="gray.700" pt={4} borderTopWidth="1px">
            Dados Pessoais e Acesso
          </Heading>

          <Box>
            <Text mb={1} fontWeight="medium" color="gray.700">
              Nome Completo
            </Text>
            <Input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Box>

          <Box>
            <Text mb={1} fontWeight="medium" color="gray.700">
              E-mail
            </Text>
            <Input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </Box>

          <Box>
            <Text mb={1} fontWeight="medium" color="gray.700">
              Senha Inicial
            </Text>
            <Input
              type="password"
              name="password"
              id="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </Box>

          <Box>
            <Text mb={1} fontWeight="medium" color="gray.700">
              Telefone
            </Text>
            <Input
              type="text"
              name="cellPhone"
              id="cellPhone"
              value={formData.cellPhone}
              onChange={handleChange}
              required
            />
          </Box>

          <Heading size="md" color="gray.700" pt={4} borderTopWidth="1px">
            Perfil e Jornada
          </Heading>

          <Box>
            <Text
              mb={1}
              fontWeight="medium"
              color="gray.700"
              display="flex"
              alignItems="center"
              gap={2}
            >
              <FaUserShield /> Perfil de Acesso
            </Text>
            <Select
              name="roleName"
              id="roleName"
              value={formData.roleName}
              onChange={handleChange}
              required
            >
              <option value="">Selecione o Perfil</option>
              <option value="COMPANY_ADMIN">Administrador da Empresa</option>
              <option value="EMPLOYEE">Funcionário Padrão</option>
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
              <FaClock /> Turno de Trabalho
            </Text>
            <Select
              name="shiftId"
              id="shiftId"
              value={formData.shiftId}
              onChange={handleChange}
              required
            >
              <option value="">Selecione o Turno</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.shiftType}
                </option>
              ))}
            </Select>
          </Box>

          <Flex align="center" gap={2}>
            <Checkbox
              name="isAllowedBypassCoord"
              id="isAllowedBypassCoord"
              isChecked={formData.isAllowedBypassCoord}
              onChange={handleChange}
            />
            <Text fontSize="sm" color="gray.700">
              Permitir marcação de ponto fora da coordenação (Bypass)
            </Text>
          </Flex>

          <Heading size="md" color="gray.700" pt={4} borderTopWidth="1px">
            Foto (Opcional)
          </Heading>

          <Box>
            <Text mb={1} fontWeight="medium" color="gray.700">
              Foto Base64 (Opcional)
            </Text>
            <Input type="file" disabled />
            <Text mt={1} fontSize="xs" color="gray.500">
              A implementação de Base64 será feita após o CRUD básico.
            </Text>
          </Box>

          <Flex justify="flex-end" pt={4}>
            <Button
              type="submit"
              colorPalette="green"
              isDisabled={loading}
              minW="240px"
            >
              {loading ? (
                <>
                  <Spinner size="sm" mr={2} /> Cadastrando...
                </>
              ) : (
                <>
                  <FaSave style={{ marginRight: 8 }} /> Cadastrar Funcionário
                </>
              )}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

export default CriarFuncionario;
