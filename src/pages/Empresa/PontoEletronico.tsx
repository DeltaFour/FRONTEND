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
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [imageBase64, setImageBase64] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [cameraActive, setCameraActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

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
    if (!email.trim() || !password) {
      toaster.error({
        title: "Credenciais obrigatórias",
        description: "Informe email e senha para registrar o ponto.",
      });
      return;
    }
    if (!imageBase64) {
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
      imageBase64,
      latitude: coords?.latitude ?? 0,
      longitude: coords?.longitude ?? 0,
      email: email.trim(),
      password,
    };
    try {
      await api.post("/user/punch-by-email", payload);
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
        <Spinner color="purple.500" />
        <Text color="gray.500" fontSize="sm">
          Verificando status de ponto...
        </Text>
      </Flex>
    );
  }

  const isPunchOut = punchType === "OUT";

  return (
    <Box
      bg="white"
      borderRadius="xl"
      boxShadow="sm"
      border="1px solid"
      borderColor="gray.100"
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
          bg="purple.50"
          borderRadius="lg"
          px={4}
          py={3}
          border="1px solid"
          borderColor="purple.100"
        >
          <Box color="purple.500" lineHeight={1}>
            <Icon as={FaClock} boxSize={6} />
          </Box>
          <Box>
            <Text
              fontSize="11px"
              fontWeight="600"
              color="purple.400"
              textTransform="uppercase"
              letterSpacing="0.6px"
              mb="1px"
            >
              Horário
            </Text>
            <Text
              fontSize="22px"
              fontWeight="700"
              color="purple.800"
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
          bg="gray.50"
          borderRadius="lg"
          px={4}
          py={3}
          border="1px solid"
          borderColor="gray.200"
        >
          <Box color="gray.400" lineHeight={1}>
            <Icon as={FaCalendarAlt} boxSize={6} />
          </Box>
          <Box>
            <Text
              fontSize="11px"
              fontWeight="600"
              color="gray.400"
              textTransform="uppercase"
              letterSpacing="0.6px"
              mb="1px"
            >
              Data
            </Text>
            <Text
              fontSize="22px"
              fontWeight="700"
              color="gray.700"
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
        <Box flex={1}>
          <Text
            fontSize="11px"
            fontWeight="600"
            color="gray.400"
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
              borderColor={isDragging ? "purple.400" : "gray.200"}
              borderRadius="lg"
              p={5}
              minH="300px"
              bg={isDragging ? "purple.50" : "gray.50"}
              cursor="pointer"
              transition="all 0.15s"
              _hover={{ borderColor: "purple.300", bg: "purple.50" }}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDropAreaDragOver}
              onDragLeave={handleDropAreaDragLeave}
              onDrop={handleDropAreaDrop}
            >
              <Icon as={FaImage} boxSize={7} color="gray.400" opacity={0.6} />
              <Text fontSize="13px" color="gray.400" textAlign="center">
                {isDragging
                  ? "Solte para enviar a foto"
                  : "Clique para enviar ou use a câmera"}
              </Text>
            </Flex>
          )}

          {cameraActive && (
            <Box
              border="1px solid"
              borderColor="gray.200"
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
              <Flex gap={2} p={2} bg="gray.900">
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
                  color="gray.300"
                  onClick={stopCamera}
                  fontSize="13px"
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
              borderColor="gray.200"
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
              borderColor="gray.200"
              color="gray.600"
              p="10px"
              _hover={{ borderColor: "purple.400", color: "purple.600" }}
            >
              <Icon as={FaCamera} boxSize={4} mr={2} />
              Câmera
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              fontSize="13px"
              borderColor="gray.200"
              color="gray.600"
              p="10px"
              _hover={{ borderColor: "purple.400", color: "purple.600" }}
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
                _hover={{ bg: "red.50" }}
              >
                Remover
              </Button>
            )}
          </Flex>
        </Box>

        {/* Status Column */}
        <Box flex={1}>
          <Text
            fontSize="11px"
            fontWeight="600"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="0.6px"
            mb={3}
          >
            Status
          </Text>

          <Box
            border="1px solid"
            borderColor="gray.100"
            borderRadius="lg"
            p={4}
            bg="white"
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
                bg="gray.50"
                px={3}
                py={2}
                borderRadius="md"
                border="1px solid"
                borderColor="gray.100"
                w="fit-content"
              >
                <Box w="6px" h="6px" borderRadius="full" bg="gray.400" />
                <Text fontSize="12px" color="gray.500" fontWeight="500">
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
                bg={isPunchOut ? "orange.50" : "green.50"}
                align="center"
                justify="center"
                flexShrink={0}
                border="1px solid"
                borderColor={isPunchOut ? "orange.100" : "green.100"}
              >
                <Icon
                  as={isPunchOut ? FaDoorOpen : FaCheckCircle}
                  boxSize={5}
                  color={isPunchOut ? "orange.400" : "green.500"}
                />
              </Flex>
              <Box>
                <Text fontSize="11px" color="gray.400" mb="1px">
                  Próxima ação
                </Text>
                <Text fontSize="15px" fontWeight="600" color="gray.700">
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
              bg={canPunch ? "green.50" : "gray.50"}
              border="1px solid"
              borderColor={canPunch ? "green.100" : "gray.100"}
            >
              <Box
                w="7px"
                h="7px"
                borderRadius="full"
                bg={canPunch ? "green.400" : "gray.300"}
                flexShrink={0}
              />
              <Text
                fontSize="12px"
                color={canPunch ? "green.600" : "gray.400"}
                fontWeight="500"
              >
                {canPunch
                  ? "Disponível para registro"
                  : "Indisponível no momento"}
              </Text>
            </Flex>
          </Box>
        </Box>
      </Flex>

      {/* Credentials */}
      <Box mb={6}>
        <Text
          fontSize="11px"
          fontWeight="600"
          color="gray.400"
          textTransform="uppercase"
          letterSpacing="0.6px"
          mb={3}
        >
          Credenciais
        </Text>
        <Flex gap={4} direction={{ base: "column", md: "row" }}>
          <Box flex={1}>
            <Text fontSize="12px" color="gray.600" mb={1}>
              Email
            </Text>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              bg="white"
              borderColor="gray.200"
              size="sm"
            />
          </Box>
          <Box flex={1}>
            <Text fontSize="12px" color="gray.600" mb={1}>
              Senha
            </Text>
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
              bg="white"
              borderColor="gray.200"
              size="sm"
            />
          </Box>
        </Flex>
      </Box>

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* Submit Button */}
      <Button
        w="full"
        h="52px"
        fontSize="15px"
        fontWeight="600"
        bg={canPunch && !submitting ? "purple.600" : "gray.200"}
        color={canPunch && !submitting ? "white" : "gray.400"}
        borderRadius="lg"
        cursor={canPunch && !submitting ? "pointer" : "not-allowed"}
        onClick={handlePunch}
        disabled={!canPunch || submitting}
        _hover={canPunch && !submitting ? { bg: "purple.700" } : {}}
        _active={
          canPunch && !submitting
            ? { bg: "purple.800", transform: "scale(0.99)" }
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
