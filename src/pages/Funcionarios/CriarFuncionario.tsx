import {
  useEffect,
  useRef,
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
} from "@chakra-ui/react";
import {
  FaArrowLeft,
  FaClock,
  FaSave,
  FaTimes,
  FaUserPlus,
  FaUserShield,
} from "react-icons/fa";
import api from "../../services/api";
import { Input } from "../../components/ui/Input";
import { toaster } from "../../components/ui/toaster";
import { useColorModeValue } from "../../theme/colorMode";
import { validateEmail } from "../../utils/validation";

interface Shift {
  id: string;
  shiftType: string;
}

interface Department {
  id: string;
  name: string;
}

interface CreateEmployeeFormData {
  name: string;
  roleName: string;
  email: string;
  cellPhone: string;
  shiftId: string;
  departmentId: string;
  isAllowedBypassCoord?: boolean;
  imageBase64: string;
  isFacialRecognitionEnabled?: boolean;
}

const CriarFuncionario = () => {
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
  };

  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [shifts, setShifts] = useState<Shift[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState<CreateEmployeeFormData>({
    name: "",
    roleName: "",
    email: "",
    cellPhone: "",
    shiftId: "",
    departmentId: "",
    isAllowedBypassCoord: false,
    isFacialRecognitionEnabled: false,
    imageBase64: "",
  });
  const [loading, setLoading] = useState(false);
  const [loadingShifts, setLoadingShifts] = useState(true);
  const [success, setSuccess] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const warningBg = useColorModeValue("yellow.50", "yellow.900");
  const warningBorder = useColorModeValue("yellow.300", "yellow.700");
  const warningText = useColorModeValue("yellow.800", "yellow.200");
  const successBg = useColorModeValue("green.50", "green.900");
  const successBorder = useColorModeValue("green.300", "green.700");
  const successText = useColorModeValue("green.700", "green.200");

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        setLoadingShifts(true);
        const [shiftsRes, deptsRes] = await Promise.all([
          api.get("/workshift/list"),
          api.get("/department/list"),
        ]);
        const data = (shiftsRes.data?.data ?? shiftsRes.data) as Shift[];
        setShifts(data);

        const deptsData = (deptsRes.data?.departments ??
          deptsRes.data?.data ??
          []) as Department[];
        setDepartments(deptsData);

        if (data.length === 0) {
          toaster.info({
            title: "Nenhum turno cadastrado",
            description: "Cadastre um turno para conseguir criar funcionários.",
          });
        }
      } catch (err) {
        const description = "Não foi possível carregar os dados necessários.";

        toaster.error({
          title: "Erro ao carregar dados",
          description,
        });
      } finally {
        setLoadingShifts(false);
      }
    };

    void fetchShifts();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!cameraActive || !videoRef.current || !streamRef.current) {
      return;
    }

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
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [cameraActive]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
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
    if (!videoRef.current || !canvasRef.current) {
      return;
    }

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
    const width = video.videoWidth;
    const height = video.videoHeight;

    if (!width || !height) {
      toaster.error({
        title: "Erro ao capturar foto",
        description: "Não foi possível obter os dados da imagem da webcam.",
      });
      return;
    }

    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      toaster.error({
        title: "Erro ao capturar foto",
        description: "Não foi possível processar a imagem da webcam.",
      });
      return;
    }

    context.drawImage(video, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = dataUrl.split(",")[1] ?? "";

    setPhotoPreview(dataUrl);
    setFormData((prev) => ({ ...prev, imageBase64: base64 }));
    stopCamera();

    toaster.success({
      title: "Foto capturada",
      description: "A imagem da webcam foi adicionada com sucesso.",
    });
  };

  const handleFileUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      toaster.error({
        title: "Arquivo inválido",
        description: "Selecione um arquivo de imagem válido.",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      const dataUrl = String(reader.result ?? "");
      const base64 = dataUrl.split(",")[1] ?? "";

      setPhotoPreview(dataUrl);
      setFormData((prev) => ({ ...prev, imageBase64: base64 }));
      stopCamera();

      toaster.success({
        title: "Imagem adicionada",
        description: "Upload da imagem concluído com sucesso.",
      });
    };

    reader.onerror = () => {
      toaster.error({
        title: "Erro no upload",
        description: "Não foi possível ler o arquivo selecionado.",
      });
    };

    reader.readAsDataURL(file);
  };

  const clearPhoto = () => {
    setPhotoPreview(null);
    setFormData((prev) => ({ ...prev, imageBase64: "" }));

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    stopCamera();
  };

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

    const sanitizedEmail = formData.email.trim().toLowerCase();
    if (!validateEmail(sanitizedEmail)) {
      toaster.error({
        title: "E-mail Inválido",
        description: "Por favor, insira um endereço de e-mail válido para o funcionário.",
      });
      return;
    }

    if (!formData.imageBase64) {
      const description =
        "Adicione uma foto por upload ou webcam antes de salvar.";

      toaster.error({
        title: "Foto obrigatória",
        description,
      });
      return;
    }

    setLoading(true);
    setSuccess(null);

    const payload: Record<string, unknown> = {
      name: formData.name,
      roleName: formData.roleName,
      email: sanitizedEmail,
      cellPhone: formData.cellPhone,
      imageBase64: formData.imageBase64,
      isAllowedBypassCoord: formData.isAllowedBypassCoord,
      isAllowedBypassFacial: formData.isFacialRecognitionEnabled,
      userShift: [
        {
          shiftId: formData.shiftId,
          startDate: new Date().toISOString(),
          isActive: true,
        },
      ],
    };

    if (formData.departmentId) {
      payload.departmentId = formData.departmentId;
    }

    try {
      await api.post("/user/create", payload);
      setSuccess(`Funcionário "${formData.name}" cadastrado com sucesso!`);
      toaster.success({
        title: "Funcionário cadastrado",
        description: `Funcionário "${formData.name}" cadastrado com sucesso!`,
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

      let message = "Ocorreu um erro ao cadastrar o funcionário.";
      if (responseData?.errors) {
        message = Object.values(responseData.errors).flat().join(" | ");
      } else if (responseData?.message) {
        message = responseData.message;
      }

      toaster.error({
        title: "Erro ao cadastrar funcionário",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loadingShifts) {
    return (
      <Flex justify="center" align="center" py={10}>
        <Spinner mr={3} />
        <Text>Carregando dados necessários...</Text>
      </Flex>
    );
  }

  if (shifts.length === 0) {
    return (
      <Box
        bg={warningBg}
        borderWidth="1px"
        borderColor={warningBorder}
        color={warningText}
        p={4}
        borderRadius="md"
      >
        <Text fontWeight="bold">Nenhum turno disponível</Text>
        <Text mt={1}>
          Cadastre pelo menos um turno em "Turnos" para liberar a criação de
          funcionários.
        </Text>
      </Box>
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
          borderWidth="1px"
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
              E-mail
            </Text>
            <Input
              type="email"
              placeholder="Insira o e-mail do funcionário"
              name="email"
              id="email"
              value={formData.email}
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
              Perfil de Acesso
            </Text>
            <select
              name="roleName"
              id="roleName"
              value={formData.roleName}
              onChange={handleChange}
              required
              style={selectStyle}
            >
              <option value="">Selecione o Perfil</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="ADMIN">Administrador</option>
              <option value="RH">Recursos Humanos</option>
              <option value="EMPLOYEE">Funcionário</option>
            </select>
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
              Turno de Trabalho
            </Text>
            <select
              name="shiftId"
              id="shiftId"
              value={formData.shiftId}
              onChange={handleChange}
              required
              style={selectStyle}
            >
              <option value="">Selecione o Turno</option>
              {shifts.map((shift) => (
                <option key={shift.id} value={shift.id}>
                  {shift.shiftType}
                </option>
              ))}
            </select>
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
              Departamento
            </Text>
            <select
              name="departmentId"
              id="departmentId"
              value={formData.departmentId}
              onChange={handleChange}
              style={selectStyle}
            >
              <option value="">Selecione o Departamento (opcional)</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </Box>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Flex align="flex-start" gap={2} flexDir="column">
              <Flex>
                <input
                  type="checkbox"
                  name="isAllowedBypassCoord"
                  id="isAllowedBypassCoord"
                  checked={formData.isAllowedBypassCoord}
                  onChange={handleChange}
                />
                <Text fontSize="sm" color="fg" ml="5px">
                  Permitir marcação de ponto fora da empresa
                </Text>
              </Flex>
              <Flex>
                <input
                  type="checkbox"
                  name="isFacialRecognitionEnabled"
                  id="isFacialRecognitionEnabled"
                  checked={formData.isFacialRecognitionEnabled}
                  onChange={handleChange}
                />
                <Text fontSize="sm" color="fg" ml="5px">
                  Permitir marcação sem reconhecimento facial
                </Text>
              </Flex>
            </Flex>
          </GridItem>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Heading
              size="md"
              color="fg"
              pt={4}
              borderTopWidth="1px"
              borderColor="border"
            >
              Adicione uma foto *
            </Heading>
          </GridItem>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Box>
              <Text mb={2} fontSize="sm" color="fg.muted">
                Você pode enviar uma imagem do dispositivo ou tirar a foto na
                hora com a webcam.
              </Text>

              <Flex gap={3} flexWrap="wrap">
                <Button
                  type="button"
                  variant="outline"
                  p="10px"
                  onClick={startCamera}
                  disabled={loading}
                >
                  Tirar foto
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  p="10px"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                >
                  Selecionar Foto
                </Button>

                {formData.imageBase64 && (
                  <Button
                    type="button"
                    variant="ghost"
                    p="10px"
                    colorPalette="red"
                    onClick={clearPhoto}
                    disabled={loading}
                  >
                    Remover Foto
                  </Button>
                )}
              </Flex>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: "none" }}
              />
            </Box>
          </GridItem>

          {cameraActive && (
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <Box
                borderWidth="1px"
                borderRadius="md"
                p={3}
                borderColor="border"
              >
                <Text mb={2} fontWeight="medium" color="fg">
                  Prévia da Webcam
                </Text>

                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    maxWidth: "420px",
                    borderRadius: "8px",
                  }}
                />

                <Flex gap={3} mt={3}>
                  <Button
                    type="button"
                    colorPalette="green"
                    p="10px"
                    onClick={capturePhoto}
                  >
                    Capturar Foto
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={stopCamera}
                    p="10px"
                  >
                    Fechar Webcam
                  </Button>
                </Flex>
              </Box>
            </GridItem>
          )}

          {photoPreview && (
            <GridItem colSpan={{ base: 1, md: 2 }}>
              <Box>
                <Text mb={2} fontWeight="medium" color="fg">
                  Foto Selecionada
                </Text>
                <Box
                  maxW="260px"
                  borderWidth="1px"
                  borderRadius="md"
                  p={2}
                  borderColor="border"
                >
                  <img
                    src={photoPreview}
                    alt="Pré-visualização da foto"
                    style={{ width: "100%", borderRadius: "4px" }}
                  />
                </Box>
              </Box>
            </GridItem>
          )}

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <canvas ref={canvasRef} style={{ display: "none" }} />
          </GridItem>

          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Flex justify="center" pt={4} gap="14px" w="100%" flexDir={{ base: "column", sm: "row" }} align="center">
              <Button
                onClick={() => navigate(-1)}
                bg="none"
                border="1px solid"
                borderColor="gray.400"
                color="white"
                w={{ base: "100%", sm: "210px" }}
                h="34px"
                borderRadius="full"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                colorPalette="green"
                disabled={loading}
                w={{ base: "100%", sm: "210px" }}
                h="34px"
                borderRadius="full"
              >
                {loading ? (
                  <>
                    <Spinner size="sm" mr={2} /> Cadastrando...
                  </>
                ) : (
                  <>Salvar</>
                )}
              </Button>
            </Flex>
          </GridItem>
        </Grid>
      </Box>
    </Box>
  );
};

export default CriarFuncionario;
