import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { FaClock, FaEdit, FaSave, FaTimes, FaUserShield } from "react-icons/fa";
import api from "../../services/api";
import { Input } from "../../components/ui/Input";
import { toaster } from "../../components/ui/toaster";
import { useColorModeValue } from "../../theme/colorMode";

interface Shift {
  id: string;
  label: string;
}

interface EmployeeShiftDto {
  id?: string;
  shiftId?: string;
}

interface EmployeeResponse {
  id: string;
  name: string;
  cellphone: string;
  roleName: string;
  isAllowedBypassCoord: boolean;
  shiftDto?: EmployeeShiftDto[];
}

interface ShiftApiResponse {
  id: string | number;
  shiftType?: string;
  startTime?: string;
  endTime?: string;
  workShiftType?: string;
  workShiftStartTime?: { hour: number; minute: number };
  workShiftEndTime?: { hour: number; minute: number };
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

const formatTime = (time?: string | { hour: number; minute: number }) => {
  if (!time) {
    return "";
  }

  if (typeof time === "string") {
    return time.slice(0, 5);
  }

  const hour = String(time.hour ?? 0).padStart(2, "0");
  const minute = String(time.minute ?? 0).padStart(2, "0");
  return `${hour}:${minute}`;
};

const normalizeShift = (shift: ShiftApiResponse): Shift => {
  const type = shift.workShiftType ?? shift.shiftType ?? "Turno";
  const start = formatTime(shift.workShiftStartTime ?? shift.startTime);
  const end = formatTime(shift.workShiftEndTime ?? shift.endTime);
  const label = start && end ? `${type} (${start} - ${end})` : type;

  return {
    id: String(shift.id),
    label,
  };
};

const isGuid = (value?: string | null) =>
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(
    value ?? "",
  );

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
  const [success, setSuccess] = useState<string | null>(null);
  const successBg = useColorModeValue("green.50", "green.900");
  const successBorder = useColorModeValue("green.300", "green.700");
  const successText = useColorModeValue("green.700", "green.200");

  useEffect(() => {
    const fetchRequiredData = async () => {
      try {
        setLoading(true);

        const shiftsResponse = await api.get("/workshift/list");
        const shiftsData = (shiftsResponse.data?.data ??
          shiftsResponse.data) as ShiftApiResponse[];
        setShifts(shiftsData.map(normalizeShift));

        if (!id) {
          throw new Error("ID do funcionário não informado.");
        }

        const employeeResponse = await api.get("/user/list");
        const employees = (employeeResponse.data?.data ??
          employeeResponse.data) as EmployeeResponse[];
        const employee = employees.find((item) => item.id === id);

        if (!employee) {
          throw new Error("Funcionário não encontrado.");
        }

        const currentShift =
          employee.shiftDto && employee.shiftDto.length > 0
            ? employee.shiftDto[0]
            : undefined;

        const currentShiftId = currentShift?.shiftId ?? "";
        const currentUserShiftId = currentShift?.id ?? "";

        setFormData({
          id: employee.id,
          name: employee.name ?? "",
          cellPhone: employee.cellphone ?? "",
          roleName: employee.roleName ?? "",
          isAllowedBypassCoord: employee.isAllowedBypassCoord ?? false,
          shiftId: currentShiftId,
          userShiftId: currentUserShiftId,
        });
      } catch (err) {
        const description =
          "Não foi possível carregar os dados do funcionário ou os turnos.";

        toaster.error({
          title: "Erro ao carregar dados",
          description,
        });
      } finally {
        setLoading(false);
      }
    };

    void fetchRequiredData();
  }, [id]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const target = event.target;
    const fieldValue =
      target instanceof HTMLInputElement && target.type === "checkbox"
        ? target.checked
        : target.value;

    setFormData((prev) => ({
      ...prev,
      [target.name]: fieldValue,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setSuccess(null);

    const userShiftArray = [
      {
        ...(isGuid(formData.userShiftId) ? { id: formData.userShiftId } : {}),
        shiftId: formData.shiftId,
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        isActive: true,
      },
    ];

    const payload = {
      userUpdateDto: {
        id: formData.id,
        name: formData.name,
        cellPhone: formData.cellPhone,
        isAllowedBypassCoord: formData.isAllowedBypassCoord,
      },
      userShift: userShiftArray,
    };

    try {
      await api.patch("/user/update", payload);
      setSuccess(`Funcionário "${formData.name}" atualizado com sucesso!`);
      toaster.success({
        title: "Funcionário atualizado",
        description: `Funcionário "${formData.name}" atualizado com sucesso!`,
      });

      setTimeout(() => {
        navigate("/dashboard-empresa/funcionarios");
      }, 1500);
    } catch (err: unknown) {
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

      toaster.error({
        title: "Erro ao atualizar funcionário",
        description: message,
      });
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

  return (
    <Box
      p={6}
      bg="surface"
      borderRadius="lg"
      boxShadow="xl"
      w="full"
      h="fit-content"
    >
      {success && (
        <Box
          bg={successBg}
          borderColor={successBorder}
          color={successText}
          p={3}
          borderRadius="md"
          mb={4}
        >
          {success}
        </Box>
      )}
      <Box as="form" onSubmit={handleSubmit}>
        <Grid
          templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }}
          gap={6}
        >
          <Box>
            <Text mb={1} fontWeight="medium" color="fg">
              Nome Completo
            </Text>
            <Input
              type="text"
              placeholder="Insira o nome completo do funcionário"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </Box>

          <Box>
            <Text mb={1} fontWeight="medium" color="fg">
              Telefone
            </Text>
            <Input
              type="text"
              placeholder="Insira o telefone do funcionário"
              name="cellPhone"
              id="cellPhone"
              value={formData.cellPhone}
              onChange={handleChange}
              required
            />
          </Box>

          <Box>
            <Text
              mb={1}
              fontWeight="medium"
              color="fg"
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
              disabled
              bg="surface.subtle"
            />
          </Box>

          <Box>
            <Text
              mb={1}
              fontWeight="medium"
              color="fg"
              display="flex"
              alignItems="center"
              gap={2}
            >
              <FaClock /> Turno de Trabalho
            </Text>
            <select
              name="shiftId"
              id="shiftId"
              value={formData.shiftId}
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
              <option value="">Selecione o Turno</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.label}
                </option>
              ))}
            </select>
          </Box>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Flex align="center" gap={2} pt={2}>
              <input
                type="checkbox"
                name="isAllowedBypassCoord"
                id="isAllowedBypassCoord"
                checked={formData.isAllowedBypassCoord}
                onChange={handleChange}
              />
              <Text fontSize="sm" color="fg">
                Permitir marcação de ponto fora da coordenação (Bypass)
              </Text>
            </Flex>
          </GridItem>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Flex justify="center" pt={4} gap="14px" w="100%">
              <Button
                type="button"
                onClick={() => navigate(-1)}
                bg="red.500"
                color="white"
                _hover={{ bg: "red.600" }}
                w="210px"
                h="34px"
                borderRadius="full"
              >
                <FaTimes /> Cancelar
              </Button>
              <Button
                type="submit"
                colorPalette="green"
                disabled={submitting}
                w="210px"
                h="34px"
                borderRadius="full"
              >
                {submitting ? (
                  <>
                    <Spinner size="sm" mr={2} /> Atualizando...
                  </>
                ) : (
                  <>
                    <FaSave style={{ marginRight: 8 }} /> Salvar
                  </>
                )}
              </Button>
            </Flex>
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
};

export default EditarFuncionario;
