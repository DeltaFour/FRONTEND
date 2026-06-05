import {
  Badge,
  Box,
  Button,
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Flex,
  Grid,
  GridItem,
  Heading,
  IconButton,
  Portal,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FaDownload,
  FaEye,
  FaFilePdf,
  FaSignature,
  FaTimes,
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import { Input } from "../ui/Input";
import { toaster } from "../ui/toaster";
import { useColorModeValue } from "../../theme/colorMode";
import {
  fetchTimesheetData,
  fetchTimesheetPdfUrl,
  getTimeSheetStatus,
  type TimeSheetStatusResponse,
} from "../../services/timesheet";

interface Employee {
  id: string;
  name: string;
  email: string;
  roleName?: string;
}

interface GenerationResult {
  id: string;
  name: string;
  email?: string;
  status: "success" | "error";
  message?: string;
}

type ResolvedPeriod = {
  month: number;
  year: number;
};

const TimesheetGeneratorPanel = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(true);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationResults, setGenerationResults] = useState<
    GenerationResult[] | null
  >(null);
  const [periodMonth, setPeriodMonth] = useState(() =>
    String(new Date().getMonth() + 1),
  );
  const [periodYear, setPeriodYear] = useState(() =>
    String(new Date().getFullYear()),
  );
  const [statusByEmployeeId, setStatusByEmployeeId] = useState<
    Record<string, TimeSheetStatusResponse>
  >({});
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [pdfAction, setPdfAction] = useState<{
    id: string;
    type: "preview" | "download";
  } | null>(null);
  const panelGradient = useColorModeValue(
    "linear(to-r, #F8FAFC, #ECFEFF)",
    "linear(to-r, #111827, #1F2937)",
  );
  const checkboxAccent = useColorModeValue("#6D28D9", "#B794F4");

  const parsePeriod = (): ResolvedPeriod | null => {
    const month = Number(periodMonth);
    const year = Number(periodYear);

    if (!Number.isInteger(month) || month < 1 || month > 12) {
      return null;
    }

    if (!Number.isInteger(year) || year < 2000) {
      return null;
    }

    return { month, year };
  };

  const periodLabel = useMemo(() => {
    const period = parsePeriod();
    if (!period) return "--";
    return `${String(period.month).padStart(2, "0")}/${period.year}`;
  }, [periodMonth, periodYear]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoadingEmployees(true);
      const response = await api.get("/user/list");
      const data = (response.data?.data ?? response.data) as Employee[];
      const filtered = data.filter(
        (employee) =>
          !employee.roleName || employee.roleName.toUpperCase() === "EMPLOYEE",
      );

      setEmployees(filtered.length > 0 ? filtered : data);
    } catch (err) {
      toaster.error({
        title: "Erro ao carregar funcionários",
        description: "Não foi possível carregar a lista de funcionários.",
      });
    } finally {
      setLoadingEmployees(false);
    }
  }, []);

  useEffect(() => {
    void fetchEmployees();
  }, [fetchEmployees]);

  const loadStatuses = useCallback(async () => {
    const period = parsePeriod();
    if (!period || employees.length === 0) {
      setStatusByEmployeeId({});
      return;
    }

    setLoadingStatuses(true);

    const results = await Promise.all(
      employees.map(async (employee) => {
        try {
          const status = await getTimeSheetStatus(employee.id, period);
          return { id: employee.id, status };
        } catch {
          try {
            const data = await fetchTimesheetData(employee.id, period);
            const signedByHR = Boolean(
              data.signedByHR || data.rhSignedAt || data.rhSignature,
            );
            const signedByEmployee = Boolean(
              data.signedByEmployee ||
              data.employeeSignedAt ||
              data.employeeSignature,
            );
            return {
              id: employee.id,
              status: {
                exists: true,
                signedByHR,
                signedByEmployee,
                hrSignedAt: data.rhSignedAt,
                employeeSignedAt: data.employeeSignedAt,
              } as TimeSheetStatusResponse,
            };
          } catch {
            return {
              id: employee.id,
              status: { exists: false } as TimeSheetStatusResponse,
            };
          }
        }
      }),
    );

    const nextStatus: Record<string, TimeSheetStatusResponse> = {};
    results.forEach((result) => {
      nextStatus[result.id] = result.status;
    });

    setStatusByEmployeeId(nextStatus);
    setLoadingStatuses(false);
  }, [employees, periodMonth, periodYear]);

  useEffect(() => {
    void loadStatuses();
  }, [loadStatuses]);

  const filteredEmployees = useMemo(() => {
    const search = employeeSearch.trim().toLowerCase();
    if (!search) return employees;

    return employees.filter((employee) => {
      return (
        employee.name.toLowerCase().includes(search) ||
        employee.email.toLowerCase().includes(search)
      );
    });
  }, [employeeSearch, employees]);

  const allFilteredIds = useMemo(
    () => filteredEmployees.map((employee) => employee.id),
    [filteredEmployees],
  );

  const isAllSelected =
    allFilteredIds.length > 0 &&
    allFilteredIds.every((id) => selectedEmployeeIds.includes(id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedEmployeeIds((prev) =>
        prev.filter((id) => !allFilteredIds.includes(id)),
      );
    } else {
      setSelectedEmployeeIds((prev) => {
        const next = new Set(prev);
        allFilteredIds.forEach((id) => next.add(id));
        return Array.from(next);
      });
    }
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((prev) => {
      if (prev.includes(employeeId)) {
        return prev.filter((id) => id !== employeeId);
      }
      return [...prev, employeeId];
    });
  };

  const resolvePeriod = () => {
    const period = parsePeriod();
    if (!period) {
      toaster.error({
        title: "Periodo invalido",
        description: "Informe mes e ano validos para a competencia.",
      });
      return null;
    }

    return period;
  };

  const requestTimesheetPdf = (
    employeeId: string,
    period: { month: number; year: number },
  ) =>
    api.get(`/timesheet/pdf/${employeeId}`, {
      responseType: "blob",
      params: period,
    });

  const openTimesheet = (employeeId: string) => {
    const period = resolvePeriod();
    if (!period) return;

    setGenerationResults(null);
    navigate(
      `/dashboard-empresa/timesheet/${employeeId}?month=${period.month}&year=${period.year}`,
    );
  };

  const resolveStatusLabel = (data?: TimeSheetStatusResponse) => {
    if (!data) return "Nao gerado";
    if (data.exists === false) return "Nao gerado";
    if (data.signedByHR && data.signedByEmployee) return "Assinado";
    return "Pendente";
  };

  const handlePreviewPdf = async (employeeId: string) => {
    const period = resolvePeriod();
    if (!period) return;

    setPdfAction({ id: employeeId, type: "preview" });
    try {
      const url = await fetchTimesheetPdfUrl(employeeId, period);
      window.open(url, "_blank", "noopener,noreferrer");
      if (url.startsWith("blob:")) {
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (err) {
      toaster.error({
        title: "Erro ao abrir PDF",
        description: "Nao foi possivel carregar o PDF da folha de ponto.",
      });
    } finally {
      setPdfAction(null);
    }
  };

  const handleDownloadPdf = async (employeeId: string) => {
    const period = resolvePeriod();
    if (!period) return;

    setPdfAction({ id: employeeId, type: "download" });
    try {
      const url = await fetchTimesheetPdfUrl(employeeId, period);
      const link = document.createElement("a");
      link.href = url;
      link.download = `timesheet-${employeeId}-${period.month}-${period.year}.pdf`;
      link.click();
      if (url.startsWith("blob:")) {
        window.setTimeout(() => URL.revokeObjectURL(url), 60000);
      }
    } catch (err) {
      toaster.error({
        title: "Erro ao baixar PDF",
        description: "Nao foi possivel baixar o PDF da folha de ponto.",
      });
    } finally {
      setPdfAction(null);
    }
  };

  const generateTimesheets = async (targetIds: string[]) => {
    const period = resolvePeriod();
    if (!period) {
      return;
    }

    if (targetIds.length === 0) {
      toaster.error({
        title: "Selecione ao menos um funcionário",
        description: "Escolha colaboradores para gerar o TimeSheet.",
      });
      return;
    }

    const targetEmployees = employees.filter((employee) =>
      targetIds.includes(employee.id),
    );

    setIsGenerating(true);

    try {
      const results = await Promise.allSettled(
        targetEmployees.map((employee) =>
          requestTimesheetPdf(employee.id, period),
        ),
      );

      const formatted = targetEmployees.map((employee, index) => {
        const result = results[index];
        if (result.status === "fulfilled") {
          return {
            id: employee.id,
            name: employee.name,
            email: employee.email,
            status: "success" as const,
          };
        }

        const message =
          (result.reason as { response?: { data?: { message?: string } } })
            ?.response?.data?.message || "Não foi possível gerar o documento.";

        return {
          id: employee.id,
          name: employee.name,
          email: employee.email,
          status: "error" as const,
          message,
        };
      });

      setGenerationResults(formatted);
      void loadStatuses();
      const hasFailures = formatted.some((result) => result.status === "error");
      if (hasFailures) {
        toaster.error({
          title: "Geracao concluida com erros",
          description: "Alguns documentos nao puderam ser gerados.",
        });
      } else {
        toaster.success({
          title: "TimeSheet gerado",
          description: "Os documentos foram processados com sucesso.",
        });
      }
    } catch (err) {
      toaster.error({
        title: "Erro ao gerar TimeSheet",
        description: "Não foi possível gerar os documentos.",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateSelected = () => {
    void generateTimesheets(selectedEmployeeIds);
  };

  const handleGenerateAll = () => {
    void generateTimesheets(employees.map((employee) => employee.id));
  };

  return (
    <Box
      bg="surface"
      p={{ base: 3, md: 6 }}
      borderRadius="lg"
      boxShadow="xl"
      mb={6}
      borderWidth="1px"
      borderColor="border"
    >
      <Flex justify="space-between" align="center" gap={4} flexWrap="wrap">
        <Box>
          <Heading size="md" color="fg">
            TimeSheet (Folha de Ponto)
          </Heading>
          <Text mt={2} fontSize="sm" color="fg.muted">
            Selecione colaboradores para gerar e assinar a folha de ponto do
            periodo selecionado.
          </Text>
        </Box>

        <Flex gap={3} flexWrap="wrap">
          <Button
            onClick={handleGenerateSelected}
            borderRadius="full"
            colorPalette="purple"
            loading={isGenerating}
            disabled={selectedEmployeeIds.length === 0}
            p="10px"
          >
            Gerar TimeSheet
          </Button>
          <Button
            variant="outline"
            borderRadius="full"
            onClick={handleGenerateAll}
            loading={isGenerating}
            disabled={employees.length === 0}
            p="10px"
          >
            Gerar TimeSheet de Todos
          </Button>
        </Flex>
      </Flex>

      <Box
        mt={6}
        p={4}
        borderWidth="1px"
        borderRadius="lg"
        borderColor="border"
        bgGradient={panelGradient}
      >
        <Grid
          templateColumns={{
            base: "1fr",
            md: "minmax(0, 1fr) 140px 140px 220px",
          }}
          gap={4}
          alignItems="end"
        >
          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg">
              Buscar colaborador
            </Text>
            <Input
              value={employeeSearch}
              onChange={(event) => setEmployeeSearch(event.target.value)}
              placeholder="Digite nome ou e-mail"
            />
          </GridItem>
          <GridItem>
            <Text mb={1} fontSize="sm" fontWeight="medium" color="fg">
              Mes
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
            <Flex justify={{ base: "flex-start", md: "flex-end" }} gap={3}>
              <Flex align="center" gap={2}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  style={{ width: 16, height: 16, accentColor: checkboxAccent }}
                />
                <Text fontSize="sm" color="fg">
                  Selecionar todos
                </Text>
              </Flex>
            </Flex>
          </GridItem>
        </Grid>
      </Box>

      <Box
        mt={4}
        borderWidth="1px"
        borderRadius="md"
        borderColor="border"
        overflowX="auto"
      >
        {loadingEmployees ? (
          <Flex align="center" justify="center" py={6} gap={3}>
            <Spinner />
            <Text>Carregando colaboradores...</Text>
          </Flex>
        ) : (
          <Box as="table" width="100%" minW="900px" borderCollapse="collapse">
            <Box as="thead" bg="surface.subtle">
              <Box as="tr">
                <Box
                  as="th"
                  px={{ base: 3, md: 6 }}
                  py={3}
                  textAlign="left"
                  fontSize="xs"
                  color="fg.muted"
                  textTransform="uppercase"
                >
                  Selecionar
                </Box>
                <Box
                  as="th"
                  px={{ base: 3, md: 6 }}
                  py={3}
                  textAlign="left"
                  fontSize="xs"
                  color="fg.muted"
                  textTransform="uppercase"
                >
                  Nome
                </Box>
                <Box
                  as="th"
                  px={{ base: 3, md: 6 }}
                  py={3}
                  textAlign="left"
                  fontSize="xs"
                  color="fg.muted"
                  textTransform="uppercase"
                >
                  Periodo
                </Box>
                <Box
                  as="th"
                  px={{ base: 3, md: 6 }}
                  py={3}
                  textAlign="left"
                  fontSize="xs"
                  color="fg.muted"
                  textTransform="uppercase"
                >
                  Status
                </Box>
                <Box
                  as="th"
                  px={{ base: 3, md: 6 }}
                  py={3}
                  textAlign="left"
                  fontSize="xs"
                  color="fg.muted"
                  textTransform="uppercase"
                >
                  Assinaturas
                </Box>
                <Box
                  as="th"
                  px={{ base: 3, md: 6 }}
                  py={3}
                  textAlign="left"
                  fontSize="xs"
                  color="fg.muted"
                  textTransform="uppercase"
                >
                  Acoes
                </Box>
              </Box>
            </Box>
            <Box as="tbody">
              {filteredEmployees.length === 0 ? (
                <Box as="tr">
                  <Box as="td" px={6} py={6} color="fg.muted">
                    Nenhum colaborador encontrado.
                  </Box>
                  <Box as="td" />
                  <Box as="td" />
                  <Box as="td" />
                  <Box as="td" />
                  <Box as="td" />
                </Box>
              ) : (
                filteredEmployees.map((employee) => (
                  <Box as="tr" key={employee.id} borderTopWidth="1px">
                    <Box as="td" px={{ base: 3, md: 6 }} py={4} whiteSpace="nowrap">
                      <input
                        type="checkbox"
                        checked={selectedEmployeeIds.includes(employee.id)}
                        onChange={() => toggleEmployee(employee.id)}
                        style={{
                          width: 16,
                          height: 16,
                          accentColor: checkboxAccent,
                        }}
                      />
                    </Box>
                    <Box
                      as="td"
                      px={{ base: 3, md: 6 }}
                      py={4}
                      whiteSpace="nowrap"
                      fontSize="sm"
                      fontWeight="semibold"
                      color="fg"
                    >
                      <Text fontWeight="semibold" color="fg">
                        {employee.name}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {employee.email}
                      </Text>
                    </Box>
                    <Box as="td" px={{ base: 3, md: 6 }} py={4} color="fg.muted">
                      {periodLabel}
                    </Box>
                    <Box as="td" px={{ base: 3, md: 6 }} py={4}>
                      {loadingStatuses ? (
                        <Flex align="center" gap={2} color="fg.muted">
                          <Spinner size="xs" />
                          <Text fontSize="xs">Carregando</Text>
                        </Flex>
                      ) : (
                        (() => {
                          const statusLabel = resolveStatusLabel(
                            statusByEmployeeId[employee.id],
                          );
                          const statusColor = statusLabel
                            .toLowerCase()
                            .includes("assinado")
                            ? "green"
                            : statusLabel.toLowerCase().includes("pendente")
                              ? "orange"
                              : statusLabel.toLowerCase().includes("nao")
                                ? "gray"
                                : "blue";
                          return (
                            <Badge colorScheme={statusColor} p="5px" borderRadius="full">
                              {statusLabel}
                            </Badge>
                          );
                        })()
                      )}
                    </Box>
                    <Box as="td" px={{ base: 3, md: 6 }} py={4}>
                      {loadingStatuses ? (
                        <Text fontSize="xs" color="fg.muted">
                          --
                        </Text>
                      ) : (
                        (() => {
                          const status = statusByEmployeeId[employee.id];
                          const hasSheet = status?.exists !== false && !!status;
                          const rhSigned = Boolean(status?.signedByHR);
                          const employeeSigned = Boolean(
                            status?.signedByEmployee,
                          );
                          const rhLabel = !hasSheet
                            ? "--"
                            : rhSigned
                              ? "Assinado"
                              : "Pendente";
                          const employeeLabel = !hasSheet
                            ? "--"
                            : employeeSigned
                              ? "Assinado"
                              : "Pendente";
                          const rhColor = !hasSheet
                            ? "gray"
                            : rhSigned
                              ? "green"
                              : "orange";
                          const employeeColor = !hasSheet
                            ? "gray"
                            : employeeSigned
                              ? "green"
                              : "orange";
                          return (
                            <VStack align="start" gap={1} >
                              <Badge colorScheme={rhColor} p="5px" borderRadius="full">RH: {rhLabel}</Badge>
                              <Badge colorScheme={employeeColor} p="5px" borderRadius="full">
                                Colab: {employeeLabel}
                              </Badge>
                            </VStack>
                          );
                        })()
                      )}
                    </Box>
                    <Box as="td" px={{ base: 3, md: 6 }} py={4}>
                      <Flex gap={2} flexWrap="wrap">
                        {(() => {
                          const status = statusByEmployeeId[employee.id];
                          const hasSheet = status?.exists !== false && !!status;
                          const isSigned =
                            !!status?.signedByHR && !!status?.signedByEmployee;
                          const signLabel = isSigned ? "Assinado" : "Assinar";
                          return (
                            <Button
                              size="xs"
                              borderRadius="full"
                              colorPalette="purple"
                              onClick={() => openTimesheet(employee.id)}
                              disabled={!hasSheet || isSigned}
                              p="10px"
                            >
                              <Flex align="center" gap={2}>
                                <FaSignature />
                                <Text>{signLabel}</Text>
                              </Flex>
                            </Button>
                          );
                        })()}
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handlePreviewPdf(employee.id)}
                          loading={
                            pdfAction?.id === employee.id &&
                            pdfAction.type === "preview"
                          }
                          p="10px"
                        >
                          <Flex align="center" gap={2}>
                            <FaEye />
                            <Text>Ver PDF</Text>
                          </Flex>
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => handleDownloadPdf(employee.id)}
                          loading={
                            pdfAction?.id === employee.id &&
                            pdfAction.type === "download"
                          }
                          p="10px"
                        >
                          <Flex align="center" gap={2}>
                            <FaDownload />
                            <Text>Baixar</Text>
                          </Flex>
                        </Button>
                      </Flex>
                    </Box>
                  </Box>
                ))
              )}
            </Box>
          </Box>
        )}
      </Box>

      <Flex mt={3} justify="space-between" flexWrap="wrap" gap={2}>
        <Text fontSize="sm" color="fg.muted">
          Selecionados: {selectedEmployeeIds.length}
        </Text>
        <Button
          size="xs"
          variant="ghost"
          onClick={() => setSelectedEmployeeIds([])}
          disabled={selectedEmployeeIds.length === 0}
          p="10px"
        >
          Limpar selecao
        </Button>
      </Flex>

      <DialogRoot
        open={Boolean(generationResults)}
        onOpenChange={(details) => {
          if (!details.open) {
            setGenerationResults(null);
          }
        }}
        placement="center"
      >
        <Portal>
          <DialogBackdrop bg="blackAlpha.600" />
          <DialogPositioner>
            <DialogContent
              w={{ base: "92vw", md: "720px" }}
              borderRadius="16px"
              boxShadow="lg"
              bg="surface"
              borderWidth="1px"
              borderColor="border"
            >
              <DialogHeader px={6} pt={5} pb={3} position="relative">
                <DialogTitle fontSize="lg" fontWeight="semibold" color="fg">
                  Resultado da geracao
                </DialogTitle>
                <IconButton
                  aria-label="Fechar resultados"
                  variant="ghost"
                  onClick={() => setGenerationResults(null)}
                  position="absolute"
                  top={3}
                  right={3}
                  p="10px"
                >
                  <FaTimes />
                </IconButton>
              </DialogHeader>
              <DialogBody px={6} pb={6}>
                <VStack align="stretch" gap={3}>
                  {generationResults?.map((result) => (
                    <Flex
                      key={result.id}
                      align="center"
                      justify="space-between"
                      gap={3}
                      borderWidth="1px"
                      borderRadius="md"
                      borderColor="border"
                      p={3}
                      flexWrap="wrap"
                    >
                      <Box>
                        <Text fontWeight="semibold" color="fg">
                          {result.name}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          {result.email}
                        </Text>
                        {result.status === "error" && result.message ? (
                          <Text fontSize="xs" color="red.500" mt={1}>
                            {result.message}
                          </Text>
                        ) : null}
                      </Box>
                      <Flex align="center" gap={3} flexWrap="wrap">
                        <Badge
                          colorScheme={
                            result.status === "success" ? "green" : "red"
                          }
                        >
                          {result.status === "success" ? "Sucesso" : "Erro"}
                        </Badge>
                        {result.status === "success" ? (
                          <Button
                            size="sm"
                            borderRadius="full"
                            onClick={() => openTimesheet(result.id)}
                            p="10px"
                          >
                            <Flex align="center" gap={2}>
                              <FaFilePdf />
                              <Text>Ver TimeSheet</Text>
                            </Flex>
                          </Button>
                        ) : null}
                      </Flex>
                    </Flex>
                  ))}
                </VStack>
              </DialogBody>
            </DialogContent>
          </DialogPositioner>
        </Portal>
      </DialogRoot>
    </Box>
  );
};

export default TimesheetGeneratorPanel;
