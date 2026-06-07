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
  FaSitemap,
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import { Input } from "../../components/ui/Input";
import { ConfirmDeleteModal } from "../../components/Modal/ConfirmDeleteModal";
import { toaster } from "../../components/ui/toaster";
import { useColorModeValue } from "../../theme/colorMode";

const MotionBox = motion(Box);
const MotionFlex = motion(Flex);

interface DepartmentListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string | null;
}

interface DepartmentFormData {
  id?: string;
  name: string;
}

const initialDepartmentForm: DepartmentFormData = {
  name: "",
};

export const GerenciarDepartamentos = () => {
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

  const [departments, setDepartments] = useState<DepartmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] =
    useState<DepartmentFormData>(initialDepartmentForm);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departmentToDelete, setDepartmentToDelete] =
    useState<DepartmentListItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchDepartments = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await api.get("/department/list");
      const data = response.data?.departments ?? response.data?.data ?? [];
      const formatted: DepartmentListItem[] = (
        data as Array<Record<string, unknown>>
      ).map((dept) => ({
        id: String(dept.id),
        name: String(dept.name),
        createdAt: String(dept.createdAt),
        updatedAt: dept.updatedAt ? String(dept.updatedAt) : null,
      }));
      setDepartments(formatted);
    } catch {
      if (showLoading) {
        toaster.error({
          title: "Erro ao carregar departamentos",
          description: "Não foi possível carregar a lista de departamentos.",
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void fetchDepartments(true);

    const interval = setInterval(() => {
      void fetchDepartments(false);
    }, 45000); // Poll every 45 seconds

    return () => clearInterval(interval);
  }, [fetchDepartments]);

  const handleChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const openModal = (department?: DepartmentListItem) => {
    if (department) {
      setIsEditing(true);
      setFormData({
        id: department.id,
        name: department.name,
      });
    } else {
      setIsEditing(false);
      setFormData(initialDepartmentForm);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData(initialDepartmentForm);
    setIsEditing(false);
  };

  const handleSave = async (event: FormEvent<HTMLDivElement>) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      if (isEditing && formData.id) {
        await api.put(`/department/update/${formData.id}`, {
          name: formData.name,
        });
        toaster.success({
          title: "Departamento atualizado",
          description: "Departamento atualizado com sucesso!",
        });
      } else {
        await api.post("/department/create", {
          name: formData.name,
        });
        toaster.success({
          title: "Departamento criado",
          description: "Departamento criado com sucesso!",
        });
      }
      closeModal();
      void fetchDepartments();
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { message?: string } } })
        .response?.data;
      toaster.error({
        title: "Erro ao salvar departamento",
        description: `Erro ao salvar: ${errorData?.message ?? "Verifique os dados informados."}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteModal = (department: DepartmentListItem) =>
    setDepartmentToDelete(department);
  const closeDeleteModal = () => {
    if (!isDeleting) setDepartmentToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!departmentToDelete) return;
    try {
      setIsDeleting(true);
      await api.delete(`/department/delete/${departmentToDelete.id}`);
      toaster.success({
        title: "Departamento excluído",
        description: `Departamento "${departmentToDelete.name}" excluído com sucesso!`,
      });
      setDepartmentToDelete(null);
      void fetchDepartments();
    } catch (err: unknown) {
      const errorData = (err as { response?: { data?: { message?: string } } })
        .response?.data;
      toaster.error({
        title: "Erro ao excluir departamento",
        description:
          errorData?.message ??
          "Não foi possível excluir o departamento selecionado.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "—";
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" py={10}>
        <Spinner mr={3} />
        <Text>Carregando departamentos...</Text>
      </Flex>
    );
  }

  return (
    <Box bg="surface" p={{ base: 3, md: 6 }} borderRadius="lg" boxShadow="xl">
      <Flex
        justify="space-between"
        align="center"
        mb={6}
        pb={3}
        borderBottomWidth="1px"
      >
        <Text fontSize="lg" fontWeight="semibold" color="fg">
          Lista de departamentos
        </Text>
        <Button
          colorPalette="green"
          onClick={() => openModal()}
          display="flex"
          p="10px"
          alignItems="center"
          gap={2}
        >
          <FaPlus /> Novo Departamento
        </Button>
      </Flex>

      {departments.length === 0 ? (
        <Box
          mt={4}
          p={4}
          textAlign="center"
          color="fg.muted"
          bg="surface.subtle"
          borderRadius="lg"
        >
          Nenhum departamento cadastrado.
        </Box>
      ) : (
        <Box
          overflowX="auto"
          borderWidth="1px"
          borderRadius="lg"
          borderColor="border"
        >
          <Box as="table" w="full" borderCollapse="collapse" minW="500px">
            <Box as="thead" bg="surface.subtle">
              <Box as="tr">
                {["Nome", "Criado em", "Atualizado em", "Ações"].map(
                  (h, i) => (
                    <Box
                      key={h}
                      as="th"
                      textAlign={i === 3 ? "right" : "left"}
                      px={{ base: 3, md: 6 }}
                      py={3}
                      fontSize="xs"
                      color="fg.muted"
                      textTransform="uppercase"
                      letterSpacing="wide"
                    >
                      {h}
                    </Box>
                  ),
                )}
              </Box>
            </Box>
            <Box as="tbody" bg="surface">
              {departments.map((dept) => (
                <Box as="tr" key={dept.id} borderTopWidth="1px">
                  <Box
                    as="td"
                    px={{ base: 3, md: 6 }}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    fontWeight="semibold"
                    color="fg"
                  >
                    {dept.name}
                  </Box>
                  <Box
                    as="td"
                    px={{ base: 3, md: 6 }}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="fg.muted"
                  >
                    {formatDate(dept.createdAt)}
                  </Box>
                  <Box
                    as="td"
                    px={{ base: 3, md: 6 }}
                    py={4}
                    whiteSpace="nowrap"
                    fontSize="sm"
                    color="fg.muted"
                  >
                    {formatDate(dept.updatedAt)}
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
                            aria-label={`Ações para ${dept.name}`}
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
                                value={`editar-${dept.id}`}
                                onSelect={() => openModal(dept)}
                              >
                                <FaEdit style={{ marginRight: 8 }} /> Editar
                              </MenuItem>
                              <MenuItem
                                p="10px"
                                value={`excluir-${dept.id}`}
                                onSelect={() => openDeleteModal(dept)}
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

      {/* ── Modal de Criar/Editar Departamento ─────────────────── */}
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
                      <FaSitemap color="#818CF8" size={15} />
                    </Flex>
                    <Box>
                      <Text
                        fontSize="md"
                        fontWeight="700"
                        color={textColor}
                        letterSpacing="-0.01em"
                      >
                        {isEditing
                          ? "Editar Departamento"
                          : "Criar Novo Departamento"}
                      </Text>
                      <Text fontSize="xs" color={textMuted} mt="1px">
                        {isEditing
                          ? "Atualize as informações do departamento"
                          : "Preencha os dados do novo departamento"}
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
                  {/* Nome do Departamento */}
                  <Box>
                    <Text
                      mb={2}
                      fontSize="xs"
                      fontWeight="600"
                      color={textLabel}
                      textTransform="uppercase"
                      letterSpacing="0.08em"
                    >
                      Nome do Departamento
                    </Text>
                    <Input
                      type="text"
                      name="name"
                      placeholder="Ex: Recursos Humanos, TI, Financeiro"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                    <Text mt={1.5} fontSize="xs" color={textSubtle}>
                      Identifique o setor ou área da empresa
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
                      disabled={submitting || !formData.name.trim()}
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
                          submitting || !formData.name.trim()
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          submitting || !formData.name.trim() ? 0.6 : 1,
                      }}
                    >
                      {submitting ? (
                        <Flex align="center" gap={2}>
                          <Spinner size="xs" /> Salvando...
                        </Flex>
                      ) : (
                        <Flex align="center" gap={2}>
                          <FaSave size={13} />
                          {isEditing
                            ? "Atualizar Departamento"
                            : "Criar Departamento"}
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
        isOpen={Boolean(departmentToDelete)}
        onClose={closeDeleteModal}
        onConfirm={handleConfirmDelete}
        itemName={departmentToDelete?.name}
        isLoading={isDeleting}
      />
    </Box>
  );
};

export default GerenciarDepartamentos;
