import {
  useCallback,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FaClock,
  FaEdit,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
} from "react-icons/fa";
import api from "../services/api";

interface ShiftListItem {
  id: number;
  workShiftType: string;
  startTime: string;
  endTime: string;
  workShiftToleranceMinutes: number;
}

interface ShiftFormData {
  id?: number;
  workShiftType: string;
  startTime: string;
  endTime: string;
  workShiftToleranceMinutes: number;
}

const initialShiftForm: ShiftFormData = {
  workShiftType: "",
  startTime: "08:00:00",
  endTime: "17:00:00",
  workShiftToleranceMinutes: 15,
};

const GerenciarTurnos = () => {
  const [shifts, setShifts] = useState<ShiftListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ShiftFormData>(initialShiftForm);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get("workshift/list");
      const raw = (response.data?.data ?? response.data) as any[];

      const formatted: ShiftListItem[] = raw.map((shift) => ({
        id: shift.id,
        workShiftType: shift.shiftType,
        startTime: String(shift.startTime).slice(0, 8),
        endTime: String(shift.endTime).slice(0, 8),
        workShiftToleranceMinutes: Number(shift.toleranceMinutes ?? 0),
      }));

      setShifts(formatted);
    } catch {
      setError("Não foi possível carregar a lista de turnos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchShifts();
  }, [fetchShifts]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "workShiftToleranceMinutes" ? Number(value) : value,
    }));
  };

  const openModal = (shift?: ShiftListItem) => {
    if (shift) {
      setIsEditing(true);
      setFormData({
        id: shift.id,
        workShiftType: shift.workShiftType,
        startTime: shift.startTime,
        endTime: shift.endTime,
        workShiftToleranceMinutes: shift.workShiftToleranceMinutes,
      });
    } else {
      setIsEditing(false);
      setFormData(initialShiftForm);
    }
    setIsModalOpen(true);
    setError(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialShiftForm);
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async (event: FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const payload: Record<string, unknown> = {
      shiftType: formData.workShiftType,
      startTime: formData.startTime.includes(":")
        ? formData.startTime
        : `${formData.startTime}:00`,
      endTime: formData.endTime.includes(":")
        ? formData.endTime
        : `${formData.endTime}:00`,
      toleranceMinutes: Number(formData.workShiftToleranceMinutes),
    };

    if (isEditing && formData.id != null) {
      payload.id = formData.id;
    }

    const endpoint = isEditing ? "/workshift/update" : "/workshift/create";
    const method = isEditing ? api.patch : api.post;

    try {
      await method(endpoint, payload);
      // eslint-disable-next-line no-alert
      alert(`Turno ${isEditing ? "atualizado" : "criado"} com sucesso!`);
      closeModal();
      void fetchShifts();
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { message?: string } } })
        .response?.data;
      setError(
        `Erro ao salvar: ${
          errorData?.message ?? "Verifique os dados informados."
        }`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (shiftId: number, shiftType: string) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm(
      `Tem certeza que deseja EXCLUIR o turno "${shiftType}"?`,
    );
    if (!confirmed) return;

    try {
      await api.delete(`/workshift/change-status/${shiftId}`);
      // eslint-disable-next-line no-alert
      alert(`Turno "${shiftType}" excluído com sucesso!`);
      void fetchShifts();
    } catch {
      // eslint-disable-next-line no-alert
      alert("Erro ao excluir turno.");
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" py={10}>
        <Spinner mr={3} />
        <Text>Carregando jornadas de trabalho...</Text>
      </Flex>
    );
  }

  if (error && !isModalOpen) {
    return (
      <Box
        bg="red.50"
        borderWidth="1px"
        borderColor="red.300"
        color="red.700"
        p={4}
        borderRadius="md"
      >
        {error}
      </Box>
    );
  }

  return (
    <Box bg="white" p={6} borderRadius="lg" boxShadow="xl">
      <Flex
        justify="space-between"
        align="center"
        mb={6}
        pb={3}
        borderBottomWidth="1px"
      >
        <Heading
          size="lg"
          color="gray.800"
          display="flex"
          alignItems="center"
          gap={3}
        >
          <FaClock color="#4F46E5" /> Gerenciar Jornadas de Trabalho
        </Heading>
        <Button
          colorPalette="green"
          onClick={() => openModal()}
          display="flex"
          alignItems="center"
          gap={2}
        >
          <FaPlus /> Novo Turno
        </Button>
      </Flex>

      {shifts.length === 0 ? (
        <Box
          mt={4}
          p={4}
          textAlign="center"
          color="gray.500"
          bg="gray.50"
          borderRadius="lg"
        >
          Nenhuma jornada de trabalho cadastrada.
        </Box>
      ) : (
        <Box overflowX="auto" borderWidth="1px" borderRadius="lg">
          <Box as="table" w="full" borderCollapse="collapse">
            <Box as="thead" bg="gray.50">
              <Box as="tr">
                <Box
                  as="th"
                  textAlign="left"
                  px={6}
                  py={3}
                  fontSize="xs"
                  color="gray.500"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Nome do Turno
                </Box>
                <Box
                  as="th"
                  textAlign="left"
                  px={6}
                  py={3}
                  fontSize="xs"
                  color="gray.500"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Início
                </Box>
                <Box
                  as="th"
                  textAlign="left"
                  px={6}
                  py={3}
                  fontSize="xs"
                  color="gray.500"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Fim
                </Box>
                <Box
                  as="th"
                  textAlign="left"
                  px={6}
                  py={3}
                  fontSize="xs"
                  color="gray.500"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Tolerância (min)
                </Box>
                <Box
                  as="th"
                  textAlign="right"
                  px={6}
                  py={3}
                  fontSize="xs"
                  color="gray.500"
                  textTransform="uppercase"
                  letterSpacing="wide"
                >
                  Ações
                </Box>
              </Box>
            </Box>
            <Box as="tbody" bg="white">
              {shifts.map((shift) => (
                <Box as="tr" key={shift.id} borderTopWidth="1px">
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    fontWeight="semibold"
                    color="gray.800"
                  >
                    {shift.workShiftType}
                  </Box>
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="gray.600"
                  >
                    {shift.startTime}
                  </Box>
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="gray.600"
                  >
                    {shift.endTime}
                  </Box>
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="gray.600"
                  >
                    {shift.workShiftToleranceMinutes}
                  </Box>
                  <Box as="td" px={6} py={4} textAlign="right">
                    <Button
                      size="sm"
                      variant="ghost"
                      colorPalette="blue"
                      mr={2}
                      onClick={() => openModal(shift)}
                    >
                      <FaEdit style={{ marginRight: 4 }} /> Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorPalette="red"
                      onClick={() =>
                        handleDelete(shift.id, shift.workShiftType)
                      }
                    >
                      <FaTrash style={{ marginRight: 4 }} /> Excluir
                    </Button>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {isModalOpen && (
        <Flex
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          align="center"
          justify="center"
          zIndex={50}
        >
          <Box
            bg="white"
            p={8}
            borderRadius="lg"
            boxShadow="2xl"
            w="full"
            maxW="md"
          >
            <Flex
              justify="space-between"
              align="center"
              pb={3}
              mb={4}
              borderBottomWidth="1px"
            >
              <Heading size="md" color="gray.800">
                {isEditing ? "Editar Turno" : "Criar Novo Turno"}
              </Heading>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeModal}
                color="gray.500"
                _hover={{ color: "gray.700" }}
              >
                <FaTimes />
              </Button>
            </Flex>

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
                {error}
              </Box>
            )}

            <Box as="form" onSubmit={handleSave}>
              <VStack align="stretch" gap={4}>
                <Box>
                  <Text mb={1} fontWeight="medium" color="gray.700">
                    Tipo de Turno
                  </Text>
                  <select
                    name="workShiftType"
                    value={formData.workShiftType}
                    onChange={handleChange}
                    required
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: "0.375rem",
                      border: "1px solid #E2E8F0",
                    }}
                  >
                    <option value="">Selecione</option>
                    <option value="Matutino">Matutino</option>
                    <option value="Diurno">Diurno</option>
                    <option value="Noturno">Noturno</option>
                  </select>
                </Box>

                <Flex gap={4}>
                  <Box flex={1}>
                    <Text mb={1} fontWeight="medium" color="gray.700">
                      Horário de Início
                    </Text>
                    <Input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      step="1"
                      required
                    />
                  </Box>
                  <Box flex={1}>
                    <Text mb={1} fontWeight="medium" color="gray.700">
                      Horário de Fim
                    </Text>
                    <Input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      step="1"
                      required
                    />
                  </Box>
                </Flex>

                <Box>
                  <Text mb={1} fontWeight="medium" color="gray.700">
                    Tolerância (minutos)
                  </Text>
                  <Input
                    type="number"
                    name="workShiftToleranceMinutes"
                    value={formData.workShiftToleranceMinutes}
                    onChange={handleChange}
                    min={0}
                    required
                  />
                </Box>

                <Flex justify="flex-end" pt={4} gap={3}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeModal}
                    disabled={submitting}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    colorPalette="indigo"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Spinner size="sm" mr={2} /> Salvar...
                      </>
                    ) : (
                      <>
                        <FaSave style={{ marginRight: 6 }} /> Salvar Turno
                      </>
                    )}
                  </Button>
                </Flex>
              </VStack>
            </Box>
          </Box>
        </Flex>
      )}
    </Box>
  );
};

export default GerenciarTurnos;
