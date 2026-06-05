import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  IconButton,
  Spinner,
  Text,
  VStack,
  Badge,
} from "@chakra-ui/react";
import { FaArrowLeft, FaFilePdf, FaRedo, FaCheckCircle, FaPen } from "react-icons/fa";
import { useColorModeValue } from "../../theme/colorMode";
import { toaster } from "../../components/ui/toaster";
import { Input } from "../../components/ui/Input";
import {
  fetchTimesheetData,
  fetchTimesheetPdfUrl,
  getTimeSheetStatus,
  signTimeSheetByEmployee,
  signTimeSheetByHR,
  type TimesheetData,
  type TimeSheetStatusResponse,
} from "../../services/timesheet";

const formatDateTime = (value?: string) => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("pt-BR");
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
    <Text fontSize="sm" color="fg.muted">
      {label}
    </Text>
    <Text fontSize="sm" fontWeight="medium" color="fg" textAlign="right">
      {value}
    </Text>
  </Flex>
);

const TimeSheetView = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState<TimesheetData | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [signatureStatus, setSignatureStatus] = useState<TimeSheetStatusResponse | null>(null);

  const [loading, setLoading] = useState(true);
  const [loadingPdf, setLoadingPdf] = useState(true);
  const [signing, setSigning] = useState(false);

  const now = useMemo(() => new Date(), []);
  const defaultMonth = now.getMonth() + 1;
  const defaultYear = now.getFullYear();

  const readParam = (value: string | null, fallback: number, max?: number) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
    if (max && parsed > max) return fallback;
    return parsed;
  };

  const appliedMonth = readParam(searchParams.get("month"), defaultMonth, 12);
  const appliedYear = readParam(searchParams.get("year"), defaultYear);

  const [periodMonth, setPeriodMonth] = useState(() => String(appliedMonth));
  const [periodYear, setPeriodYear] = useState(() => String(appliedYear));

  useEffect(() => {
    setPeriodMonth(String(appliedMonth));
    setPeriodYear(String(appliedYear));
  }, [appliedMonth, appliedYear]);

  const loadTimesheet = useCallback(async () => {
    setLoading(true);
    setLoadingPdf(true);

    try {
      const [dataResult, pdfResult] = await Promise.allSettled([
        fetchTimesheetData(userId, { month: appliedMonth, year: appliedYear }),
        fetchTimesheetPdfUrl(userId, { month: appliedMonth, year: appliedYear }),
      ]);

      if (dataResult.status === "fulfilled") {
        setData(dataResult.value);
      } else {
        toaster.error({
          title: "Erro ao carregar dados",
          description: "Não foi possível carregar os dados da folha de ponto.",
        });
      }

      if (pdfResult.status === "fulfilled") {
        setPdfUrl(pdfResult.value);
      } else {
        toaster.error({
          title: "Erro ao carregar PDF",
          description: "Não foi possível carregar o PDF da folha de ponto.",
        });
      }

      // Busca o status apenas DEPOIS que os dados/PDF garantiram a criação da folha no backend
      try {
        const statusResult = await getTimeSheetStatus(userId, { month: appliedMonth, year: appliedYear });
        setSignatureStatus(statusResult);
      } catch (err) {
        console.error("Erro ao carregar status da assinatura", err);
        toaster.error({
          title: "Erro de assinatura",
          description: "Não foi possível carregar o status das assinaturas.",
        });
      }
    } catch (err) {
      toaster.error({
        title: "Erro ao carregar Timesheet",
        description: "Não foi possível carregar as informacoes do documento.",
      });
    } finally {
      setLoading(false);
      setLoadingPdf(false);
    }
  }, [userId, appliedMonth, appliedYear]);

  useEffect(() => {
    void loadTimesheet();
  }, [loadTimesheet]);

  useEffect(() => {
    return () => {
      if (pdfUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const periodLabel = useMemo(() => {
    if (data?.referenceMonth) return data.referenceMonth;
    return `${String(appliedMonth).padStart(2, "0")}/${appliedYear}`;
  }, [data, appliedMonth, appliedYear]);

  const resolvePeriod = () => {
    const month = Number(periodMonth);
    const year = Number(periodYear);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      toaster.error({
        title: "Mês inválido",
        description: "Informe um mês entre 1 e 12.",
      });
      return null;
    }

    if (!Number.isInteger(year) || year < 2000) {
      toaster.error({
        title: "Ano inválido",
        description: "Informe um ano válido.",
      });
      return null;
    }

    return { month, year };
  };

  const handleApplyPeriod = () => {
    const period = resolvePeriod();
    if (!period) return;
    setSearchParams({
      month: String(period.month),
      year: String(period.year),
    });
  };

  const handleOpenPdf = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank", "noopener,noreferrer");
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `timesheet-${userId || "me"}.pdf`;
    link.click();
  };

  const handleSign = async () => {
    if (!signatureStatus?.timeSheetId) return;
    setSigning(true);
    try {
      if (userId) {
        // Se tem userId na URL, estamos vendo a folha de outra pessoa, logo somos RH/Admin
        await signTimeSheetByHR(signatureStatus.timeSheetId);
        toaster.success({ title: "Sucesso", description: "Folha assinada pelo RH." });
      } else {
        // Sem userId, somos o próprio funcionário
        await signTimeSheetByEmployee(signatureStatus.timeSheetId);
        toaster.success({ title: "Sucesso", description: "Folha assinada com sucesso!" });
      }
      void loadTimesheet(); // Recarrega o status após assinar
    } catch (err: any) {
      toaster.error({
        title: "Erro ao assinar",
        description: err.response?.data?.message || "Ocorreu um erro ao assinar a folha.",
      });
    } finally {
      setSigning(false);
    }
  };

  const panelBorder = useColorModeValue("gray.200", "whiteAlpha.200");
  const isHRView = !!userId;

  if (loading) {
    return (
      <Flex align="center" justify="center" py={10} gap={3}>
        <Spinner />
        <Text>Carregando Timesheet...</Text>
      </Flex>
    );
  }

  return (
    <Box bg="surface" p={{ base: 3, md: 6 }} borderRadius="lg" boxShadow="xl">
      <Flex
        justify="space-between"
        align="center"
        mb={6}
        flexWrap="wrap"
        gap={3}
      >
        <Box>
          <Heading size="lg" color="fg">
            Folha de ponto
          </Heading>
          <Text mt={2} fontSize="sm" color="fg.muted">
            Visualize o PDF do documento.
          </Text>
        </Box>
        <HStack gap={2}>
          <IconButton
            aria-label="Atualizar Timesheet"
            variant="outline"
            borderRadius="full"
            onClick={() => void loadTimesheet()}
          >
            <FaRedo />
          </IconButton>
          <Button
            variant="outline"
            borderRadius="full"
            onClick={() => navigate(-1)}
          >
            <Flex p="10px" align="center" gap={2}>
              <FaArrowLeft />
              <Text>Voltar</Text>
            </Flex>
          </Button>
        </HStack>
      </Flex>

      <Box
        mb={6}
        p={4}
        borderWidth="1px"
        borderColor={panelBorder}
        borderRadius="lg"
        bg="surface.subtle"
      >
        <Grid
          templateColumns={{ base: "1fr", md: "160px 160px 1fr" }}
          gap={4}
          alignItems="end"
        >
          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg">
              Mês
            </Text>
            <Input
              type="number"
              min={1}
              max={12}
              value={periodMonth}
              onChange={(event) => setPeriodMonth(event.target.value)}
            />
          </GridItem>
          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg">
              Ano
            </Text>
            <Input
              type="number"
              min={2000}
              value={periodYear}
              onChange={(event) => setPeriodYear(event.target.value)}
            />
          </GridItem>
          <GridItem>
            <Flex justify={{ base: "flex-start", md: "flex-end" }} gap={3} w="100%">
              <Button borderRadius="full" w={{ base: "100%", md: "auto" }} p="10px" onClick={handleApplyPeriod}>
                Aplicar periodo
              </Button>
            </Flex>
          </GridItem>
        </Grid>
      </Box>

      <Grid templateColumns={{ base: "1fr", lg: "1.2fr 0.8fr" }} gap={6}>
        <GridItem order={{ base: 2, lg: 1 }}>
          <Box
            borderWidth="1px"
            borderColor={panelBorder}
            borderRadius="lg"
            overflow="hidden"
          >
            <Flex
              justify="space-between"
              align="center"
              px={5}
              py={4}
              borderBottomWidth="1px"
              borderColor={panelBorder}
              bg="surface.subtle"
            >
              <Text fontWeight="semibold" color="fg">
                Documento
              </Text>
              <HStack gap={2}>
                <Button
                  size="sm"
                  p="10px"
                  variant="outline"
                  borderRadius="full"
                  onClick={handleOpenPdf}
                  disabled={!pdfUrl}
                >
                  <Flex align="center" gap={2}>
                    <FaFilePdf />
                    <Text>Abrir PDF</Text>
                  </Flex>
                </Button>
                <Button
                  size="sm"
                  p="10px"
                  borderRadius="full"
                  onClick={handleDownloadPdf}
                  disabled={!pdfUrl}
                >
                  Baixar
                </Button>
              </HStack>
            </Flex>

            <Box p={4} minH="520px">
              {loadingPdf ? (
                <Flex align="center" justify="center" py={10} gap={3}>
                  <Spinner />
                  <Text>Carregando PDF...</Text>
                </Flex>
              ) : pdfUrl ? (
                <iframe
                  src={pdfUrl}
                  title="Timesheet PDF"
                  style={{ width: "100%", height: "520px", border: "none" }}
                />
              ) : (
                <Text color="fg.muted">
                  PDF indisponível. Tente gerar novamente.
                </Text>
              )}
            </Box>
          </Box>
        </GridItem>

        <GridItem order={{ base: 1, lg: 2 }}>
          <VStack align="stretch" gap={4}>

            {/* NOVO PAINEL DE ASSINATURAS */}
            <Box
              borderWidth="1px"
              borderColor={panelBorder}
              borderRadius="lg"
              p={5}
              bg="surface.subtle"
            >
              <Heading size="sm" color="fg" mb={4}>
                Status de Assinaturas
              </Heading>

              {signatureStatus === null ? (
                <Text fontSize="sm" color="fg.muted">Carregando status de assinaturas...</Text>
              ) : signatureStatus.exists === false ? (
                <Text fontSize="sm" color="fg.muted">A folha deste período ainda não foi gerada no sistema.</Text>
              ) : (
                <VStack align="stretch" gap={4}>
                  {/* Status Colaborador */}
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm" color="fg.muted">Colaborador:</Text>
                    {signatureStatus.signedByEmployee ? (
                      <Badge colorPalette="green" display="flex" alignItems="center" gap={1}>
                        <FaCheckCircle /> Assinado em {formatDateTime(signatureStatus.employeeSignedAt)}
                      </Badge>
                    ) : (
                      <Badge colorPalette="orange" p="5px" borderRadius="full">Pendente</Badge>
                    )}
                  </Flex>

                  {/* Status RH */}
                  <Flex justify="space-between" align="center">
                    <Text fontSize="sm" color="fg.muted">RH:</Text>
                    {signatureStatus.signedByHR ? (
                      <Badge colorPalette="green" display="flex" alignItems="center" gap={1}>
                        <FaCheckCircle /> Assinado por {signatureStatus.hrSignerName}
                      </Badge>
                    ) : (
                      <Badge colorPalette="orange" p="5px" borderRadius="full">Pendente</Badge>
                    )}
                  </Flex>

                  {/* Botão de Ação Condicional */}
                  {(!isHRView && !signatureStatus.signedByEmployee) && (
                    <Button
                      colorPalette="blue"
                      onClick={handleSign}
                      loading={signing}
                      mt={2}
                    >
                      <Flex align="center" gap={2} p="10px">
                        <FaPen />
                        <Text>Assinar como Colaborador</Text>
                      </Flex>
                    </Button>
                  )}

                  {(isHRView && !signatureStatus.signedByHR) && (
                    <Button
                      colorPalette="purple"
                      onClick={handleSign}
                      loading={signing}
                      mt={2}
                    >
                      <Flex align="center" gap={2} p="10px">
                        <FaPen />
                        <Text>Assinar como RH</Text>
                      </Flex>
                    </Button>
                  )}
                </VStack>
              )}
            </Box>

            <Box
              borderWidth="1px"
              borderColor={panelBorder}
              borderRadius="lg"
              p={5}
            >
              <Heading size="sm" color="fg" mb={4}>
                Detalhes do Documento
              </Heading>
              <VStack align="stretch" gap={3}>
                <InfoRow
                  label="Colaborador"
                  value={data?.employeeName || "--"}
                />
                <InfoRow label="Email" value={data?.employeeEmail || "--"} />
                <InfoRow label="Empresa" value={data?.companyName || "--"} />
                <InfoRow label="Período" value={periodLabel} />
                <InfoRow
                  label="Gerado em"
                  value={formatDateTime(data?.generatedAt)}
                />
              </VStack>
            </Box>
          </VStack>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default TimeSheetView;
