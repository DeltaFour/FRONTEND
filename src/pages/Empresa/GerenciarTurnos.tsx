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
  IconButton,
  MenuContent,
  MenuItem,
  MenuPositioner,
  MenuRoot,
  MenuTrigger,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  FaEdit,
  FaEllipsisV,
  FaPlus,
  FaSave,
  FaTimes,
  FaTrash,
  FaClock,
  FaShieldAlt,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { Input } from "../../components/ui/Input";
import { ConfirmDeleteModal } from "../../components/Modal/ConfirmDeleteModal";
import { toaster } from "../../components/ui/toaster";
import { useColorModeValue } from "../../theme/colorMode";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

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

export const GerenciarTurnos = () => {
  const modalBg = useColorModeValue("#FFFFFF", "#0D0D0F");
  const modalBorder = useColorModeValue(
    "rgba(0,0,0,0.08)",
    "rgba(255,255,255,0.08)",
  );
  const textColor = useColorModeValue("gray.800", "white");
  const textMuted = useColorModeValue("gray.500", "whiteAlpha.500");
  const textSubtle = useColorModeValue("gray.400", "whiteAlpha.400");
  const textLabel = useColorModeValue("gray.600", "whiteAlpha.600");
  const closeBtnBg = useColorModeValue(
    "rgba(0,0,0,0.05)",
    "rgba(255,255,255,0.05)",
  );
  const closeBtnHoverBg = useColorModeValue(
    "rgba(0,0,0,0.1)",
    "rgba(255,255,255,0.1)",
  );
  const cancelBtnHoverBg = useColorModeValue(
    "blackAlpha.100",
    "whiteAlpha.100",
  );

  const [shifts, setShifts] = useState<ShiftListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<ShiftFormData>(initialShiftForm);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [shiftToDelete, setShiftToDelete] = useState<ShiftListItem | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchShifts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/workshift/list");
      const raw = (response.data?.data ?? response.data) as unknown[];
      const formatted: ShiftListItem[] = (
        raw as Array<Record<string, unknown>>
      ).map((shift) => ({
        id: shift.id as number,
        workShiftType: shift.shiftType as unknown as string,
        startTime: String(shift.startTime).slice(0, 8),
        endTime: String(shift.endTime).slice(0, 8),
        workShiftToleranceMinutes: Number(shift.toleranceMinutes ?? 0),
      }));
      setShifts(formatted);
    } catch {
      toaster.error({
        title: "Erro ao carregar turnos",
        description: "Não foi possível carregar a lista de turnos.",
      });
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
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialShiftForm);
    setIsEditing(false);
  };

  const handleSave = async (event: FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    setSubmitting(true);
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
    if (isEditing && formData.id != null) payload.id = formData.id;
    const endpoint = isEditing ? "/workshift/update" : "/workshift/create";
    const method = isEditing ? api.patch : api.post;
    try {
      await method(endpoint, payload);
      toaster.success({
        title: "Turno salvo",
        description: `Turno ${isEditing ? "atualizado" : "criado"} com sucesso!`,
      });
      closeModal();
      void fetchShifts();
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { message?: string } } })
        .response?.data;
      toaster.error({
        title: "Erro ao salvar turno",
        description: `Erro ao salvar: ${errorData?.message ?? "Verifique os dados informados."}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (shift: ShiftListItem) => setShiftToDelete(shift);
  const closeDeleteModal = () => {
    if (!isDeleting) setShiftToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!shiftToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/workshift/change-status/${shiftToDelete.id}`);
      toaster.success({
        title: "Turno excluído",
        description: `Turno "${shiftToDelete.workShiftType}" excluído com sucesso!`,
      });
      setShiftToDelete(null);
      void fetchShifts();
    } catch {
      toaster.error({
        title: "Erro ao excluir turno",
        description: "Não foi possível excluir o turno selecionado.",
      });
    } finally {
      setIsDeleting(false);
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

  return (
    <Box bg="surface" p={6} borderRadius="lg" boxShadow="xl">
      <Flex
        justify="space-between"
        align="center"
        mb={6}
        pb={3}
        borderBottomWidth="1px"
      >
        <Text fontSize="lg" fontWeight="semibold" color="fg">
          Lista de turnos
        </Text>
        <Button
          colorPalette="green"
          onClick={() => openModal()}
          display="flex"
          p="10px"
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
          color="fg.muted"
          bg="surface.subtle"
          borderRadius="lg"
        >
          Nenhuma jornada de trabalho cadastrada.
        </Box>
      ) : (
        <Box
          overflowX="auto"
          borderWidth="1px"
          borderRadius="lg"
          borderColor="border"
        >
          <Box as="table" w="full" borderCollapse="collapse">
            <Box as="thead" bg="surface.subtle">
              <Box as="tr">
                {[
                  "Nome do Turno",
                  "Início",
                  "Fim",
                  "Tolerância (min)",
                  "Ações",
                ].map((h, i) => (
                  <Box
                    key={h}
                    as="th"
                    textAlign={i === 4 ? "right" : "left"}
                    px={6}
                    py={3}
                    fontSize="xs"
                    color="fg.muted"
                    textTransform="uppercase"
                    letterSpacing="wide"
                  >
                    {h}
                  </Box>
                ))}
              </Box>
            </Box>
            <Box as="tbody" bg="surface">
              {shifts.map((shift) => (
                <Box as="tr" key={shift.id} borderTopWidth="1px">
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    fontWeight="semibold"
                    color="fg"
                  >
                    {shift.workShiftType}
                  </Box>
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="fg.muted"
                  >
                    {shift.startTime}
                  </Box>
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="fg.muted"
                  >
                    {shift.endTime}
                  </Box>
                  <Box
                    as="td"
                    px={6}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="fg.muted"
                  >
                    {shift.workShiftToleranceMinutes}
                  </Box>
                  <Box as="td" px={6} py={4} textAlign="right">
                    <Flex justify="flex-end">
                      <MenuRoot
                        positioning={{
                          placement: "top-end",
                          strategy: "fixed",
                        }}
                      >
                        <MenuTrigger asChild>
                          <IconButton
                            aria-label={`Ações para ${shift.workShiftType}`}
                            variant="ghost"
                            size="sm"
                          >
                            <FaEllipsisV />
                          </IconButton>
                        </MenuTrigger>
                        <Portal>
                          <MenuPositioner>
                            <MenuContent>
                              <MenuItem
                                p="10px"
                                value={`editar-${shift.id}`}
                                onSelect={() => openModal(shift)}
                              >
                                <FaEdit style={{ marginRight: 8 }} /> Editar
                              </MenuItem>
                              <MenuItem
                                p="10px"
                                value={`excluir-${shift.id}`}
                                onSelect={() => openDeleteModal(shift)}
                              >
                                <FaTrash style={{ marginRight: 8 }} /> Excluir
                              </MenuItem>
                            </MenuContent>
                          </MenuPositioner>
                        </Portal>
                      </MenuRoot>
                    </Flex>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
      )}

      {/* ── Modal melhorado ─────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <MotionFlex
            position="fixed"
            inset={0}
            align="center"
            justify="center"
            zIndex={50}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              backgroundColor: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(4px)",
            }}
          >
            <MotionBox
              bg={modalBg}
              borderRadius="xl"
              boxShadow="0 25px 60px rgba(0,0,0,0.6)"
              w="full"
              maxW="420px"
              mx={4}
              overflow="hidden"
              borderWidth="1px"
              borderColor={modalBorder}
              initial={{ opacity: 0, y: 24, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            >
              {/* Header com gradiente */}
              <Box
                px={6}
                py={5}
                position="relative"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.1) 100%)",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                {/* Glow sutil no topo */}
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  h="1px"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent, rgba(139,92,246,0.6), transparent)",
                  }}
                />
                <Flex justify="space-between" align="center">
                  <Flex align="center" gap={3}>
                    <Flex
                      align="center"
                      justify="center"
                      w="36px"
                      h="36px"
                      borderRadius="10px"
                      style={{
                        background: "rgba(99,102,241,0.2)",
                        border: "1px solid rgba(99,102,241,0.3)",
                      }}
                    >
                      <FaClock color="#818CF8" size={15} />
                    </Flex>
                    <Box>
                      <Text
                        fontSize="md"
                        fontWeight="700"
                        color={textColor}
                        letterSpacing="-0.01em"
                      >
                        {isEditing ? "Editar Turno" : "Criar Novo Turno"}
                      </Text>
                      <Text fontSize="xs" color={textMuted} mt="1px">
                        {isEditing
                          ? "Atualize as informações do turno"
                          : "Preencha os dados do novo turno"}
                      </Text>
                    </Box>
                  </Flex>
                  <Box
                    as="button"
                    onClick={closeModal}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    w="28px"
                    h="28px"
                    borderRadius="8px"
                    color={textMuted}
                    style={{
                      background: closeBtnBg,
                      border: `1px solid ${modalBorder}`,
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                    _hover={{ color: textColor, background: closeBtnHoverBg }}
                  >
                    <FaTimes size={11} />
                  </Box>
                </Flex>
              </Box>

              {/* Body */}
              <Box as="form" onSubmit={handleSave} px={6} py={5}>
                <VStack align="stretch" gap={5}>
                  {/* Tipo de Turno — input de texto */}
                  <Box>
                    <Text
                      mb={2}
                      fontSize="xs"
                      fontWeight="600"
                      color={textLabel}
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      Nome do Turno
                    </Text>
                    <Input
                      type="text"
                      name="workShiftType"
                      placeholder="Ex: Matutino, Diurno, Noturno ou outro"
                      value={formData.workShiftType}
                      onChange={handleChange}
                      required
                    />
                  </Box>

                  {/* Horários */}
                  <Box>
                    <Text
                      mb={2}
                      fontSize="xs"
                      fontWeight="600"
                      color={textLabel}
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      Horários
                    </Text>
                    <Flex gap={3}>
                      <Box flex={1}>
                        <Text mb={1.5} fontSize="xs" color={textMuted}>
                          Início
                        </Text>
                        <Box position="relative">
                          <Input
                            type="time"
                            name="startTime"
                            value={formData.startTime}
                            onChange={handleChange}
                            step="1"
                            required
                          />
                        </Box>
                      </Box>
                      <Flex align="flex-end" pb={2} color={textSubtle}>
                        <Text fontSize="lg">→</Text>
                      </Flex>
                      <Box flex={1}>
                        <Text mb={1.5} fontSize="xs" color={textMuted}>
                          Fim
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
                  </Box>

                  {/* Tolerância */}
                  <Box>
                    <Flex align="center" gap={2} mb={2}>
                      <FaShieldAlt size={11} color="#6366F1" />
                      <Text
                        fontSize="xs"
                        fontWeight="600"
                        color={textLabel}
                        textTransform="uppercase"
                        letterSpacing="0.08em"
                      >
                        Tolerância
                      </Text>
                    </Flex>
                    <Flex align="center" gap={3}>
                      <Box flex={1}>
                        <Input
                          type="number"
                          name="workShiftToleranceMinutes"
                          value={formData.workShiftToleranceMinutes}
                          onChange={handleChange}
                          min={0}
                          required
                        />
                      </Box>
                      <Text
                        fontSize="sm"
                        color={textSubtle}
                        whiteSpace="nowrap"
                      >
                        minutos
                      </Text>
                    </Flex>
                    <Text mt={1.5} fontSize="xs" color={textSubtle}>
                      Margem aceita para entrada e saída
                    </Text>
                  </Box>

                  {/* Botões */}
                  <Flex gap={2} pt={1}>
                    <Button
                      type="button"
                      flex={1}
                      variant="ghost"
                      onClick={closeModal}
                      disabled={submitting}
                      h="38px"
                      borderRadius="10px"
                      fontSize="sm"
                      color={textMuted}
                      _hover={{ color: textColor, bg: cancelBtnHoverBg }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      flex={2}
                      disabled={submitting || !formData.workShiftType}
                      h="38px"
                      borderRadius="10px"
                      fontSize="sm"
                      fontWeight="600"
                      style={{
                        background:
                          "linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)",
                        border: "1px solid rgba(139,92,246,0.4)",
                        boxShadow: "0 4px 15px rgba(99,102,241,0.3)",
                        color: "white",
                        cursor:
                          submitting || !formData.workShiftType
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          submitting || !formData.workShiftType ? 0.6 : 1,
                      }}
                    >
                      {submitting ? (
                        <Flex align="center" gap={2}>
                          <Spinner size="xs" /> Salvando...
                        </Flex>
                      ) : (
                        <Flex align="center" gap={2}>
                          <FaSave size={13} />
                          {isEditing ? "Atualizar Turno" : "Criar Turno"}
                        </Flex>
                      )}
                    </Button>
                  </Flex>
                </VStack>
              </Box>
            </MotionBox>
          </MotionFlex>
        )}
      </AnimatePresence>

      <ConfirmDeleteModal
        isOpen={Boolean(shiftToDelete)}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        itemName={shiftToDelete?.workShiftType}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default GerenciarTurnos;
