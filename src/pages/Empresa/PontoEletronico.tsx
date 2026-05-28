import { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Icon,
  Input,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useColorModeValue } from "../../theme/colorMode";
import {
  FaCalendarAlt,
  FaCamera,
  FaCheckCircle,
  FaClock,
  FaDoorOpen,
  FaFolderOpen,
  FaImage,
} from "react-icons/fa";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import { toaster } from "../../components/ui/toaster";

type PunchType = "IN" | "OUT";

const NomePonto = {
  IN: "Entrada",
  OUT: "Saída",
} as const;

interface RefreshInfoResponse {
  shiftType?: string;
  lastPunchType?: PunchType;
  hasFacialBypass?: boolean;
}

const PontoEletronico = () => {
  const { user } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [punchType, setPunchType] = useState<PunchType | null>(null);
  const [canPunch, setCanPunch] = useState(false);
  const [shiftType, setShiftType] = useState<string | undefined>(
    user?.shiftType as string | undefined,
  );
  const [hasFacialBypass, setHasFacialBypass] = useState(false);
  const [imageBase64, setImageBase64] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [cameraActive, setCameraActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const accentCardBg = useColorModeValue("purple.50", "purple.900");
  const accentCardBorder = useColorModeValue("purple.100", "purple.700");
  const accentIcon = useColorModeValue("purple.500", "purple.300");
  const accentLabel = useColorModeValue("purple.400", "purple.300");
  const accentText = useColorModeValue("purple.800", "purple.100");
  const dragBorder = useColorModeValue("purple.400", "purple.300");
  const dragBg = useColorModeValue("purple.50", "purple.900");
  const dropHoverBorder = useColorModeValue("purple.300", "purple.400");
  const dropHoverBg = useColorModeValue("purple.50", "purple.900");
  const accentAction = useColorModeValue("purple.600", "purple.300");
  const removeHoverBg = useColorModeValue("red.50", "red.900");
  const actionInBg = useColorModeValue("green.50", "green.900");
  const actionInBorder = useColorModeValue("green.100", "green.700");
  const actionInIcon = useColorModeValue("green.500", "green.300");
  const actionOutBg = useColorModeValue("orange.50", "orange.900");
  const actionOutBorder = useColorModeValue("orange.100", "orange.700");
  const actionOutIcon = useColorModeValue("orange.400", "orange.300");
  const availableBg = useColorModeValue("green.50", "green.900");
  const availableBorder = useColorModeValue("green.100", "green.700");
  const availableDot = useColorModeValue("green.400", "green.300");
  const availableText = useColorModeValue("green.600", "green.300");
  const submitEnabledBg = useColorModeValue("purple.600", "purple.500");
  const submitHoverBg = useColorModeValue("purple.700", "purple.400");
  const submitActiveBg = useColorModeValue("purple.800", "purple.300");
  const submitDisabledBg = useColorModeValue("surface.subtle", "surface.muted");
  const loadingSpinner = useColorModeValue("purple.500", "purple.300");
  const horarioAtual = now.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const dataAtual = now.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  useEffect(() => {
    const intervalId = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    void video.play().catch(() => {
      toaster.error({
        title: "Erro ao iniciar vídeo",
        description: "Não foi possível iniciar a prévia da webcam.",
      });
      stopCamera();
    });
    return () => {
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [cameraActive]);

  const formatTimeOnly = (date: Date) => date.toISOString().slice(11, 19);

  const resolveNextPunchType = (lastPunchType?: PunchType) =>
    lastPunchType === "IN" ? "OUT" : "IN";

  const fetchAllowedPunch = useCallback(async () => {
    try {
      setLoading(true);
      const infoResponse = await api.get<RefreshInfoResponse>(
        "/user/refresh-information",
      );
      const info = infoResponse.data || {};
      const nextPunchType = resolveNextPunchType(info.lastPunchType);
      setShiftType(info.shiftType ?? (user?.shiftType as string | undefined));
      setHasFacialBypass(Boolean(info.hasFacialBypass));
      setPunchType(nextPunchType);
      const canPunchResponse = await api.post<boolean>("/user/allowed-punch", {
        timePunched: formatTimeOnly(new Date()),
        punchType: nextPunchType,
      });
      setCanPunch(Boolean(canPunchResponse.data));
    } catch {
      toaster.error({
        title: "Erro ao carregar ponto",
        description: "Não foi possível carregar o status de marcação.",
      });
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void fetchAllowedPunch();
  }, [fetchAllowedPunch]);

  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      toaster.error({
        title: "Arquivo inválido",
        description: "Selecione uma imagem válida.",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const base64 = dataUrl.split(",")[1] ?? "";
      setImageBase64(base64);
      setPhotoPreview(dataUrl);
      stopCamera();
    };
    reader.onerror = () => {
      toaster.error({
        title: "Erro ao carregar imagem",
        description: "Não foi possível ler o arquivo selecionado.",
      });
    };
    reader.readAsDataURL(file);
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    processImageFile(file);
    event.target.value = "";
  };

  const handleDropAreaDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDropAreaDragLeave = () => {
    setIsDragging(false);
  };

  const handleDropAreaDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      toaster.error({
        title: "Webcam indisponível",
        description: "Seu navegador não suporta acesso à câmera.",
      });
      return;
    }
    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
      });
      streamRef.current = stream;
      setCameraActive(true);
    } catch {
      toaster.error({
        title: "Erro ao abrir webcam",
        description: "Permita acesso à câmera e tente novamente.",
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    if (
      !video.srcObject ||
      video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA
    ) {
      toaster.info({
        title: "Aguarde a câmera",
        description: "Espere a webcam carregar antes de capturar a foto.",
      });
      return;
    }
    const canvas = canvasRef.current;
    const { videoWidth: width, videoHeight: height } = video;
    if (!width || !height) {
      toaster.error({
        title: "Erro ao capturar foto",
        description: "Não foi possível obter os dados da imagem.",
      });
      return;
    }
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) {
      toaster.error({
        title: "Erro ao capturar foto",
        description: "Não foi possível processar a imagem.",
      });
      return;
    }
    context.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setPhotoPreview(dataUrl);
    setImageBase64(dataUrl.split(",")[1] ?? "");
    stopCamera();
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setImageBase64("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    stopCamera();
  };

  const getCoordinates = (): Promise<{
    latitude: number;
    longitude: number;
  } | null> =>
    new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          }),
        () => resolve(null),
        { enableHighAccuracy: true, timeout: 8000 },
      );
    });

  const handlePunch = async () => {
    if (!punchType || submitting || !canPunch) return;

    if (!hasFacialBypass && !imageBase64) {
      toaster.error({
        title: "Foto obrigatória",
        description: "Adicione uma foto antes de registrar o ponto.",
      });
      return;
    }
    setSubmitting(true);
    const coords = await getCoordinates();
    const payload = {
      type: punchType,
      timePunched: new Date().toISOString(),
      shiftType: shiftType ?? "Matutino",
      imageBase64: hasFacialBypass ? "" : imageBase64,
      latitude: coords?.latitude ?? 0,
      longitude: coords?.longitude ?? 0,
    };
    try {
      await api.post("/user/register-point", payload);
      toaster.success({
        title: "Ponto registrado",
        description: `Ponto de ${NomePonto[punchType]} registrado com sucesso!`,
      });
      void fetchAllowedPunch();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      toaster.error({
        title: "Erro ao registrar ponto",
        description: `Erro ao marcar ponto: ${message ?? "Verifique a jornada de trabalho."}`,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" py={10} gap={3}>
        <Spinner color="loading.spinner" />
        <Text color="fg.muted" fontSize="sm">
          Verificando status de ponto...
        </Text>
      </Flex>
    );
  }

  const isPunchOut = punchType === "OUT";
  const actionBg = isPunchOut ? actionOutBg : actionInBg;
  const actionBorder = isPunchOut ? actionOutBorder : actionInBorder;
  const actionIcon = isPunchOut ? actionOutIcon : actionInIcon;
  const availabilityBg = canPunch ? availableBg : "surface.subtle";
  const availabilityBorder = canPunch ? availableBorder : "border";
  const availabilityDot = canPunch ? availableDot : "fg.muted";
  const availabilityText = canPunch ? availableText : "fg.muted";

  return (
    <Box
      bg="surface"
      borderRadius="xl"
      boxShadow="sm"
      borderWidth="1px"
      borderColor="border"
      p={6}
      mx="auto"
      w="800px"
      maxW="100%"
    >
      {/* Header: Date & Time */}
      <Flex gap={3} mb={6}>
        <Flex
          flex={1}
          align="center"
          gap={3}
          bg={accentCardBg}
          borderRadius="lg"
          px={4}
          py={3}
          border="1px solid"
          borderColor={accentCardBorder}
        >
          <Box color={accentIcon} lineHeight={1}>
            <Icon as={FaClock} boxSize={6} />
          </Box>
          <Box>
            <Text
              fontSize="11px"
              fontWeight="600"
              color="accent.label"
              textTransform="uppercase"
              letterSpacing="0.6px"
              mb="1px"
            >
              Horário
            </Text>
            <Text
              fontSize="22px"
              fontWeight="700"
              color={accentText}
              letterSpacing="1px"
              fontFamily="mono"
            >
              {horarioAtual}
            </Text>
          </Box>
        </Flex>
        <Flex
          flex={1}
          align="center"
          gap={3}
          bg="surface.subtle"
          borderRadius="lg"
          px={4}
          py={3}
          border="1px solid"
          borderColor="border"
        >
          <Box color="fg.muted" lineHeight={1}>
            <Icon as={FaCalendarAlt} boxSize={6} />
          </Box>
          <Box>
            <Text
              fontSize="11px"
              fontWeight="600"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="0.6px"
              mb="1px"
            >
              Data
            </Text>
            <Text
              fontSize="22px"
              fontWeight="700"
              color="fg"
              letterSpacing="0.5px"
            >
              {dataAtual}
            </Text>
          </Box>
        </Flex>
      </Flex>

      {/* Main Grid */}
      <Flex gap={4} mb={6} align="stretch">
        {/* Photo Column */}
        {!hasFacialBypass && (
          <Box flex={1}>
            <Text
              fontSize="11px"
              fontWeight="600"
              color="fg.muted"
              textTransform="uppercase"
              letterSpacing="0.6px"
              mb={3}
            >
              Verificação por foto
            </Text>

            {!photoPreview && !cameraActive && (
              <Flex
                direction="column"
                align="center"
                justify="center"
                gap={2}
                border="1.5px dashed"
                borderColor={isDragging ? dragBorder : "border"}
                borderRadius="lg"
                p={5}
                minH="300px"
                bg={isDragging ? dragBg : "surface.subtle"}
                cursor="pointer"
                transition="all 0.15s"
                _hover={{ borderColor: dropHoverBorder, bg: dropHoverBg }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDropAreaDragOver}
                onDragLeave={handleDropAreaDragLeave}
                onDrop={handleDropAreaDrop}
              >
                <Icon as={FaImage} boxSize={7} color="fg.muted" opacity={0.6} />
                <Text fontSize="13px" color="fg.muted" textAlign="center">
                  {isDragging
                    ? "Solte para enviar a foto"
                    : "Clique para enviar ou use a câmera"}
                </Text>
              </Flex>
            )}

            {cameraActive && (
              <Box
                border="1px solid"
                borderColor="border"
                borderRadius="lg"
                overflow="hidden"
                bg="black"
              >
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    display: "block",
                    maxHeight: "200px",
                    objectFit: "cover",
                  }}
                />
                <Flex gap={2} p={2} bg="surface.muted">
                  <Button
                    size="sm"
                    colorPalette="green"
                    flex={1}
                    onClick={capturePhoto}
                    fontSize="13px"
                  >
                    Capturar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    color="fg.muted"
                    onClick={stopCamera}
                    fontSize="13px"
                    _hover={{ bg: "surface.subtle", color: "fg" }}
                  >
                    Cancelar
                  </Button>
                </Flex>
              </Box>
            )}

            {photoPreview && (
              <Box
                position="relative"
                borderRadius="lg"
                overflow="hidden"
                border="1px solid"
                borderColor="border"
              >
                <img
                  src={photoPreview}
                  alt="Foto capturada"
                  style={{
                    width: "100%",
                    maxHeight: "300px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <Flex
                  position="absolute"
                  top={2}
                  right={2}
                  bg="green.500"
                  color="white"
                  borderRadius="full"
                  px={2}
                  py="2px"
                  align="center"
                  gap={1}
                >
                  <Icon as={FaCheckCircle} boxSize={3} />
                  <Text fontSize="11px" fontWeight="600">
                    Foto adicionada
                  </Text>
                </Flex>
              </Box>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
            />

            <Flex gap={2} mt={3} flexWrap="wrap">
              <Button
                size="sm"
                variant="outline"
                onClick={startCamera}
                fontSize="13px"
                borderColor="border"
                color="fg.muted"
                p="10px"
                _hover={{ borderColor: dropHoverBorder, color: accentAction }}
              >
                <Icon as={FaCamera} boxSize={4} mr={2} />
                Câmera
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                fontSize="13px"
                borderColor="border"
                color="fg.muted"
                p="10px"
                _hover={{ borderColor: dropHoverBorder, color: accentAction }}
              >
                <Icon as={FaFolderOpen} boxSize={4} mr={2} />
                Arquivo
              </Button>
              {imageBase64 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={clearPhoto}
                  fontSize="13px"
                  color="red.400"
                  p="10px"
                  _hover={{ bg: removeHoverBg }}
                >
                  Remover
                </Button>
              )}
            </Flex>
          </Box>
        )}

        {/* Status Column */}
        <Box flex={hasFacialBypass ? 1 : 1}>
          <Text
            fontSize="11px"
            fontWeight="600"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="0.6px"
            mb={3}
          >
            Status
          </Text>

          <Box
            border="1px solid"
            borderColor="border"
            borderRadius="lg"
            p={4}
            bg="surface"
            h="200px"
            display="flex"
            flexDirection="column"
            gap={4}
          >
            {/* Shift type */}
            {shiftType && (
              <Flex
                align="center"
                gap={2}
                bg="surface.subtle"
                px={3}
                py={2}
                borderRadius="md"
                border="1px solid"
                borderColor="border"
                w="fit-content"
              >
                <Box w="6px" h="6px" borderRadius="full" bg="fg.muted" />
                <Text fontSize="12px" color="fg.muted" fontWeight="500">
                  {shiftType}
                </Text>
              </Flex>
            )}

            {/* Next action */}
            <Flex align="center" gap={3}>
              <Flex
                w="40px"
                h="40px"
                borderRadius="full"
                bg={actionBg}
                align="center"
                justify="center"
                flexShrink={0}
                border="1px solid"
                borderColor={actionBorder}
              >
                <Icon
                  as={isPunchOut ? FaDoorOpen : FaCheckCircle}
                  boxSize={5}
                  color={actionIcon}
                />
              </Flex>
              <Box>
                <Text fontSize="11px" color="fg.muted" mb="1px">
                  Próxima ação
                </Text>
                <Text fontSize="15px" fontWeight="600" color="fg">
                  {punchType ? NomePonto[punchType] : "—"}
                </Text>
              </Box>
            </Flex>

            {/* Availability */}
            <Flex
              align="center"
              gap={2}
              mt="auto"
              px={3}
              py={2}
              borderRadius="md"
              bg={availabilityBg}
              border="1px solid"
              borderColor={availabilityBorder}
            >
              <Box
                w="7px"
                h="7px"
                borderRadius="full"
                bg={availabilityDot}
                flexShrink={0}
              />
              <Text fontSize="12px" color={availabilityText} fontWeight="500">
                {canPunch
                  ? "Disponível para registro"
                  : "Indisponível no momento"}
              </Text>
            </Flex>
          </Box>
        </Box>
      </Flex>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Submit Button */}
      <Button
        w="full"
        h="52px"
        fontSize="15px"
        fontWeight="600"
        bg={canPunch && !submitting ? submitEnabledBg : submitDisabledBg}
        color={canPunch && !submitting ? "white" : "fg.muted"}
        borderRadius="lg"
        cursor={canPunch && !submitting ? "pointer" : "not-allowed"}
        onClick={handlePunch}
        disabled={!canPunch || submitting}
        _hover={canPunch && !submitting ? { bg: submitHoverBg } : {}}
        _active={
          canPunch && !submitting
            ? { bg: submitActiveBg, transform: "scale(0.99)" }
            : {}
        }
        transition="all 0.15s"
        letterSpacing="0.3px"
      >
        {submitting ? (
          <Flex align="center" gap={3}>
            <Spinner size="sm" color="white" />
            <Text>Registrando...</Text>
          </Flex>
        ) : (
          <Flex align="center" gap={2}>
            <Text>Registrar Ponto</Text>
          </Flex>
        )}
      </Button>
    </Box>
  );
};

export default PontoEletronico;
