import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  Spinner,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { Input } from "../../components/ui/Input";
import { toaster } from "../../components/ui/toaster";

type PunchType = "IN" | "OUT";

interface RefreshInfoResponse {
  shiftType?: string;
  lastPunchType?: PunchType;
}

const PontoEmAtraso = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [punchType, setPunchType] = useState<PunchType | null>(null);
  const [shiftType, setShiftType] = useState<string | undefined>(
    user?.shiftType as string | undefined,
  );
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lateDate, setLateDate] = useState("");
  const [lateTime, setLateTime] = useState("");
  const [lateReason, setLateReason] = useState("");
  const [lateNote, setLateNote] = useState("");
  const [lateAttachmentBase64, setLateAttachmentBase64] = useState("");
  const [lateAttachmentName, setLateAttachmentName] = useState("");
  const [lateAttachmentType, setLateAttachmentType] = useState("");

  const maxNoteLength = 200;
  const remainingChars = maxNoteLength - lateNote.length;

  const formatDateInput = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatTimeInput = (date: Date) => {
    const hour = String(date.getHours()).padStart(2, "0");
    const minute = String(date.getMinutes()).padStart(2, "0");
    return `${hour}:${minute}`;
  };

  useEffect(() => {
    const now = new Date();
    setLateDate(formatDateInput(now));
    setLateTime(formatTimeInput(now));
  }, []);

  const resolveNextPunchType = (lastPunchType?: PunchType) =>
    lastPunchType === "IN" ? "OUT" : "IN";

  const fetchPunchInfo = useCallback(async () => {
    try {
      setLoading(true);

      const infoResponse = await api.get<RefreshInfoResponse>(
        "/user/refresh-information",
      );
      const info = infoResponse.data || {};
      const nextPunchType = resolveNextPunchType(info.lastPunchType);

      setShiftType(info.shiftType ?? (user?.shiftType as string | undefined));
      setPunchType(nextPunchType);
    } catch (err) {
      const description = "Não foi possível carregar o status de marcação.";

      toaster.error({
        title: "Erro ao carregar ponto",
        description,
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchPunchInfo();
  }, [fetchPunchInfo]);

  const handleLateAttachmentChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toaster.error({
        title: "Arquivo muito grande",
        description: "O anexo deve ter no máximo 5MB.",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const base64 = dataUrl.split(",")[1] ?? "";
      setLateAttachmentBase64(base64);
      setLateAttachmentName(file.name);
      setLateAttachmentType(file.type);
    };
    reader.onerror = () => {
      toaster.error({
        title: "Erro no anexo",
        description: "Não foi possível ler o arquivo selecionado.",
      });
      event.target.value = "";
    };

    reader.readAsDataURL(file);
  };

  const handlePunch = async (shouldExit: boolean) => {
    if (!punchType || submitting) return;

    if (!lateReason) {
      const description = "Selecione um motivo para o ponto em atraso.";
      toaster.error({
        title: "Motivo obrigatório",
        description,
      });
      return;
    }

    if (lateReason === "OUTRO" && !lateNote.trim()) {
      const description = "Descreva o motivo do atraso.";

      toaster.error({
        title: "Descrição obrigatória",
        description,
      });
      return;
    }

    if (!lateDate || !lateTime) {
      const description = "Informe a data e o horário do ponto.";

      toaster.error({
        title: "Data e horário obrigatórios",
        description,
      });
      return;
    }

    setSubmitting(true);

    const resolvedTime = new Date(`${lateDate}T${lateTime}`).toISOString();

    const payload = {
      type: punchType,
      timePunched: resolvedTime,
      shiftType: shiftType ?? "Matutino",
      lateReason,
      lateNote: lateNote.trim() || undefined,
      lateAttachmentBase64: lateAttachmentBase64 || undefined,
      lateAttachmentName: lateAttachmentName || undefined,
      lateAttachmentType: lateAttachmentType || undefined,
    };

    try {
      await api.post("/user/register-point", payload);
      toaster.success({
        title: "Ponto registrado",
        description: "Ponto em atraso registrado com sucesso!",
      });
      setLateReason("");
      setLateNote("");
      setLateAttachmentBase64("");
      setLateAttachmentName("");
      setLateAttachmentType("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      if (shouldExit) {
        navigate(-1);
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      const description = `Erro ao marcar ponto: ${
        message ?? "Verifique a jornada de trabalho."
      }`;

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
        <Text>Carregando informações...</Text>
      </Flex>
    );
  }

  return (
    <Box
      p={8}
      bg="white"
      borderRadius="lg"
      boxShadow="2xl"
      mx="auto"
      w="full"
      maxW="1100px"
    >
      <Heading mb={6} size="lg" color="gray.800">
        Ponto em atraso
      </Heading>

      <Grid
        templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }}
        gap={6}
      >
        <GridItem>
          <Text mb={1} fontWeight="medium" color="gray.700">
            Colaborador
          </Text>
          <select
            disabled
            value={user?.name ?? ""}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "0.375rem",
              border: "1px solid #E2E8F0",
              backgroundColor: "#F3F4F6",
              color: "#1A202C",
            }}
          >
            <option value={user?.name ?? ""}>{user?.name ?? ""}</option>
          </select>
        </GridItem>

        <GridItem>
          <Text mb={1} fontWeight="medium" color="gray.700">
            Justificativa
          </Text>
          <select
            value={lateReason}
            onChange={(event) => setLateReason(event.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "0.375rem",
              border: "1px solid #E2E8F0",
              backgroundColor: "#FFFFFF",
              color: "#1A202C",
            }}
          >
            <option value="">Escolha</option>
            <option value="ATESTADO_MEDICO">Atestado médico</option>
            <option value="ESQUECIMENTO">Esquecimento</option>
            <option value="SISTEMA_FORA">Sistema fora do ar</option>
            <option value="OUTRO">Outro</option>
          </select>
        </GridItem>

        <GridItem>
          <Text mb={1} fontWeight="medium" color="gray.700">
            Data
          </Text>
          <Input
            type="date"
            value={lateDate}
            onChange={(event) => setLateDate(event.target.value)}
          />
        </GridItem>

        <GridItem>
          <Text mb={1} fontWeight="medium" color="gray.700">
            Hora
          </Text>
          <Input
            type="time"
            value={lateTime}
            onChange={(event) => setLateTime(event.target.value)}
          />
        </GridItem>

        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Text mb={2} fontWeight="medium" color="gray.700">
            Anexo (opcional)
          </Text>
          <Flex align="center" gap={3} wrap="wrap">
            <Button
              type="button"
              p="10px"
              bg="primary.500"
              color="white"
              boxShadow="sm"
              transition="all 0.2s"
              _hover={{
                boxShadow: "md",
                bg: "purple.700",
              }}
              _active={{ boxShadow: "sm" }}
              onClick={() => fileInputRef.current?.click()}
            >
              Selecione um arquivo
            </Button>

            {lateAttachmentName && (
              <Text fontSize="sm" color="gray.600">
                {lateAttachmentName}
              </Text>
            )}
          </Flex>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleLateAttachmentChange}
            style={{ display: "none" }}
          />
        </GridItem>

        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Flex justify="space-between" align="center" mb={2} wrap="wrap">
            <Text fontWeight="medium" color="gray.700">
              Observação (opcional)
            </Text>
            <Text fontSize="sm" color="gray.500">
              Caracteres restantes: {remainingChars}
            </Text>
          </Flex>
          <Textarea
            value={lateNote}
            color="gray.700"
            onChange={(event) =>
              setLateNote(event.target.value.slice(0, maxNoteLength))
            }
            placeholder="Descreva o motivo do atraso"
            resize="vertical"
            minH="120px"
            maxH="120px"
          />
        </GridItem>
      </Grid>

      <Flex justify="flex-start" gap={3} mt={8} wrap="wrap">
        <Button
          type="button"
          onClick={() => handlePunch(true)}
          bg="transparent"
          color="black"
          borderWidth="1px"
          borderColor="gray.300"
          borderRadius="full"
          minW="180px"
          h="36px"
          isDisabled={submitting}
          boxShadow="sm"
          transition="all 0.2s"
          _hover={{ boxShadow: "md" }}
          _active={{ boxShadow: "sm" }}
        >
          {submitting ? (
            <>
              <Spinner size="sm" mr={2} /> Salvando...
            </>
          ) : (
            "Salvar e Sair"
          )}
        </Button>
        <Button
          type="button"
          onClick={() => handlePunch(false)}
          bg="primary.500"
          color="white"
          borderRadius="full"
          minW="200px"
          h="36px"
          isDisabled={submitting}
          boxShadow="sm"
          transition="all 0.2s"
          _hover={{
            boxShadow: "md",
            bg: "purple.700",
          }}
          _active={{ boxShadow: "sm" }}
        >
          Salvar e Continuar
        </Button>
      </Flex>
    </Box>
  );
};

export default PontoEmAtraso;
