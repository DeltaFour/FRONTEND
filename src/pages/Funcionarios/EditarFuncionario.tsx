import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
  FaEdit,
  FaSave,
  FaUserShield,
} from "react-icons/fa";
import api from "../../services/api";

interface Shift {
  id: string;
  workShiftType: string;
  workShiftStartTime: { hour: number; minute: number };
  workShiftEndTime: { hour: number; minute: number };
}

interface EmployeeShiftDto {
  id: string;
}

interface EmployeeResponse {
  id: string;
  name: string;
  cellphone: string;
  roleName: string;
  isAllowedBypassCoord: boolean;
  shiftDto?: EmployeeShiftDto[];
}

interface EditEmployeeFormData {
  id?: string;
  name: string;
  cellPhone: string;
  roleName: string;
  shiftId: string;
  userShiftId: string;
  isAllowedBypassCoord: boolean;
}

const EditarFuncionario = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [formData, setFormData] = useState<EditEmployeeFormData>({
    name: "",
    cellPhone: "",
    roleName: "",
    shiftId: "",
    userShiftId: "",
    isAllowedBypassCoord: false,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequiredData = async () => {
      try {
        setLoading(true);
        setError(null);

        const shiftsResponse = await api.get("/workshift");
        const shiftsData = (shiftsResponse.data?.data ??
          shiftsResponse.data) as Shift[];
        setShifts(shiftsData);

        if (!id) {
          throw new Error("ID do funcionário não informado.");
        }

        const employeeResponse = await api.get(`/user/${id}`);
        const employee = employeeResponse.data as EmployeeResponse;

        const currentShift =
          employee.shiftDto && employee.shiftDto.length > 0
            ? employee.shiftDto[0]
            : undefined;

        setFormData({
          id: employee.id,
          name: employee.name ?? "",
          cellPhone: employee.cellphone ?? "",
          roleName: employee.roleName ?? "",
          isAllowedBypassCoord: employee.isAllowedBypassCoord ?? false,
          shiftId: currentShift?.id ?? "",
          userShiftId: currentShift?.id ?? "",
        });
      } catch (err) {
        console.error("Erro ao buscar dados:", err);
        setError(
          "Não foi possível carregar os dados do funcionário ou os turnos.",
        );
      } finally {
        setLoading(false);
      }
    };

    void fetchRequiredData();
  }, [id]);

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
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const userShiftArray = [
      {
        id: formData.userShiftId,
        shiftId: formData.shiftId,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        isActive: true,
      },
    ];

    const payload = {
      id: formData.id,
      name: formData.name,
      cellPhone: formData.cellPhone,
      isAllowedBypassCoord: formData.isAllowedBypassCoord,
      userShift: userShiftArray,
    };

    try {
      await api.patch("/user", payload);
      setSuccess(`Funcionário "${formData.name}" atualizado com sucesso!`);

      setTimeout(() => {
        navigate("/dashboard-empresa/funcionarios");
      }, 1500);
    } catch (err: unknown) {
      console.error("Erro na atualização:", err);
      const responseData = (
        err as {
          response?: {
            data?: { message?: string; errors?: Record<string, string[]> };
          };
        }
      ).response?.data;

      let message = "Ocorreu um erro ao atualizar o funcionário.";
      if (responseData?.errors) {
        message = Object.values(responseData.errors).flat().join(" | ");
      } else if (responseData?.message) {
        message = responseData.message;
      }

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" py={10}>
        <Spinner mr={3} />
        <Text>Carregando dados...</Text>
      </Flex>
    );
  }

  if (error && !submitting) {
    return (
      <Box
        className="text-red-600 p-4 bg-red-100 rounded max-w-2xl mx-auto"
        bg="red.50"
        borderWidth="1px"
        borderColor="red.300"
        color="red.700"
        p={4}
        borderRadius="md"
        maxW="2xl"
        mx="auto"
      >
        {error}
      </Box>
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
          <FaEdit color="#4F46E5" /> Editar Funcionário
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
      {error && submitting && (
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
            Dados Pessoais
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
            <Input
              type="text"
              name="roleName"
              id="roleName"
              value={formData.roleName}
              isDisabled
              bg="gray.100"
            />
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
                  {shift.workShiftType} ({shift.workShiftStartTime.hour}:
                  {shift.workShiftStartTime.minute} -{" "}
                  {shift.workShiftEndTime.hour}:{shift.workShiftEndTime.minute})
                </option>
              ))}
            </Select>
          </Box>

          <Flex align="center" gap={2} pt={2}>
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

          <Flex justify="flex-end" pt={4}>
            <Button
              type="submit"
              colorPalette="indigo"
              isDisabled={submitting}
              minW="240px"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" mr={2} /> Atualizando...
                </>
              ) : (
                <>
                  <FaSave style={{ marginRight: 8 }} /> Salvar Alterações
                </>
              )}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

export default EditarFuncionario;
