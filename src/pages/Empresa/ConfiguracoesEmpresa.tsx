import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Grid,
  Spinner,
  Text,
  VStack,
  Heading,
} from "@chakra-ui/react";
import api from "../../services/api";
import { Input } from "../../components/ui/Input";
import { toaster } from "../../components/ui/toaster";
import { useColorModeValue } from "../../theme/colorMode";
import { maskCnpj, validateCnpj } from "../../utils/cnpj";

interface SubscriptionInfo {
  id: string;
  planName: string;
  status: string;
  startDate: string;
  endDate: string | null;
  customerId?: string;
}

interface CompanySettings {
  razaoSocial: string;
  nomeFantasia: string;
  cnpj: string;
  email: string;
  telefone: string;

  cep: string;
  rua: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  latitude: string;
  longitude: string;

  raioMetros: number;
}

const DEFAULT_SETTINGS: CompanySettings = {
  razaoSocial: "DeltaFour Solutions LTDA",
  nomeFantasia: "DeltaFour",
  cnpj: "12.ABC.345/01DE-35",
  email: "contato@deltafour.com.br",
  telefone: "(11) 99999-9999",

  cep: "01310-100",
  rua: "Avenida Paulista",
  numero: "1000",
  complemento: "Andar 10",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  estado: "SP",
  latitude: "-23.5615",
  longitude: "-46.6560",

  raioMetros: 100,
};

const LOCAL_STORAGE_KEY = "deltafour.company.settings";

export default function ConfiguracoesEmpresa() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<CompanySettings>(DEFAULT_SETTINGS);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [loadingSub, setLoadingSub] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancellingSub, setCancellingSub] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [fetchingCep, setFetchingCep] = useState(false);
  const [fetchingCoords, setFetchingCoords] = useState(false);

  const cardBg = useColorModeValue("surface", "surface");
  const cardBorder = "1px solid";
  const cardBorderColor = "border";

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        setLoadingSettings(true);
        const response = await api.get<CompanySettings>("/company/settings");
        setSettings(response.data);
      } catch (error: any) {
        console.warn("Backend settings endpoint returned error, falling back to LocalStorage:", error);
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          try {
            setSettings(JSON.parse(saved));
          } catch (e) {
            setSettings(DEFAULT_SETTINGS);
          }
        } else {
          setSettings(DEFAULT_SETTINGS);
        }
      } finally {
        setLoadingSettings(false);
      }

      try {
        setLoadingSub(true);
        const response = await api.get<SubscriptionInfo>("/subscription");
        setSubscription(response.data);
      } catch (error) {
        console.error("Failed to load subscription details:", error);
        setSubscription({
          id: "sub_mock123",
          planName: "Plano Premium",
          status: "active",
          startDate: new Date().toISOString(),
          endDate: null,
        });
      } finally {
        setLoadingSub(false);
      }
    };

    void fetchAllData();
  }, []);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCnpjChange = (e: ChangeEvent<HTMLInputElement>) => {
    const masked = maskCnpj(e.target.value);
    setSettings((prev) => ({ ...prev, cnpj: masked }));
  };

  const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, "");
    if (val.length > 11) val = val.slice(0, 11);
    let formatted = val;
    if (val.length > 2) {
      formatted = `(${val.slice(0, 2)}) ${val.slice(2)}`;
    }
    if (val.length > 7) {
      formatted = `(${val.slice(0, 2)}) ${val.slice(2, 7)}-${val.slice(7)}`;
    }
    setSettings((prev) => ({ ...prev, telefone: formatted }));
  };

  const handleCepBlur = async () => {
    const rawCep = settings.cep.replace(/\D/g, "");
    if (rawCep.length !== 8) return;

    try {
      setFetchingCep(true);
      const res = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
      const data = await res.json();

      if (data.erro) {
        toaster.error({
          title: "CEP não encontrado",
          description: "Verifique o CEP digitado.",
        });
        return;
      }

      setSettings((prev) => ({
        ...prev,
        rua: data.logradouro || "",
        bairro: data.bairro || "",
        cidade: data.localidade || "",
        estado: data.uf || "",
      }));

      toaster.success({
        title: "Endereço localizado",
        description: "Campos preenchidos automaticamente via CEP.",
      });

      void fetchGeocodingCoords(data.logradouro, data.localidade, data.uf);
    } catch (error) {
      console.error(error);
      toaster.error({
        title: "Erro ao buscar CEP",
        description: "Não foi possível carregar as informações do CEP.",
      });
    } finally {
      setFetchingCep(false);
    }
  };

  const fetchGeocodingCoords = async (street?: string, city?: string, state?: string) => {
    const qStreet = street || settings.rua;
    const qCity = city || settings.cidade;
    const qState = state || settings.estado;

    if (!qStreet || !qCity) return;

    try {
      setFetchingCoords(true);
      const query = `${qStreet}, ${qCity}, ${qState}, Brasil`;
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`;

      const res = await fetch(url, {
        headers: {
          "Accept-Language": "pt-BR",
        },
      });
      const data = await res.json();

      if (data && data.length > 0) {
        const { lat, lon } = data[0];
        setSettings((prev) => ({
          ...prev,
          latitude: String(lat),
          longitude: String(lon),
        }));
      }
    } catch (err) {
      console.warn("Could not retrieve geocoded coordinates from Nominatim:", err);
    } finally {
      setFetchingCoords(false);
    }
  };

  const handleSaveSettings = async (e: FormEvent) => {
    e.preventDefault();

    if (!settings.razaoSocial || !settings.nomeFantasia || !settings.email) {
      toaster.error({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
      });
      return;
    }

    if (settings.cnpj && !validateCnpj(settings.cnpj)) {
      toaster.error({
        title: "CNPJ inválido",
        description: "O CNPJ inserido não atende ao padrão de validação.",
      });
      return;
    }

    try {
      setSaving(true);
      await fetchGeocodingCoords();

      try {
        await api.patch("/company/settings", settings);
      } catch (err) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(settings));
      }

      toaster.success({
        title: "Configurações salvas",
        description: "As configurações da empresa foram salvas com sucesso.",
      });
    } catch (error) {
      toaster.error({
        title: "Erro ao salvar",
        description: "Ocorreu um problema inesperado ao salvar as configurações.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleManageBilling = async () => {
    try {
      const response = await api.get<{ url: string }>("/subscription/billing-portal");
      if (response.data?.url) {
        window.location.href = response.data.url;
      } else {
        throw new Error("No URL returned from portal.");
      }
    } catch (error) {
      console.error(error);
      toaster.error({
        title: "Portal Stripe indisponível",
        description: "Não foi possível carregar a página de pagamentos no momento.",
      });
    }
  };

  const handleCancelSubscription = async () => {
    try {
      setCancellingSub(true);
      await api.post("/subscription/cancel");
      setSubscription((prev) => prev ? { ...prev, status: "canceled" } : null);
      setShowCancelModal(false);
      toaster.success({
        title: "Assinatura cancelada",
        description: "A assinatura foi cancelada com sucesso.",
      });
    } catch (error) {
      console.error(error);
      toaster.error({
        title: "Erro ao cancelar",
        description: "Ocorreu um erro ao tentar cancelar a assinatura.",
      });
    } finally {
      setCancellingSub(false);
    }
  };

  const getNextBillingInfo = (startDateStr: string) => {
    const start = new Date(startDateStr);
    const today = new Date();
    const day = start.getDate();
    let nextDate = new Date(today.getFullYear(), today.getMonth(), day);

    if (nextDate.getTime() <= today.getTime()) {
      nextDate = new Date(today.getFullYear(), today.getMonth() + 1, day);
    }

    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return { nextDate, diffDays };
  };

  const billingInfo = subscription?.startDate ? getNextBillingInfo(subscription.startDate) : null;
  const isSoon = billingInfo ? billingInfo.diffDays <= 5 : false;

  if (loadingSettings) {
    return (
      <Flex justify="center" align="center" py={10}>
        <Spinner mr={3} />
        <Text>Carregando configurações da empresa...</Text>
      </Flex>
    );
  }

  return (
    <Box w="full" h="fit-content">
      <Box as="form" onSubmit={handleSaveSettings}>
        <VStack spaceY={6} align="stretch">

          {/* Setor: Informações da Empresa */}
          <Box p={6} bg={cardBg} borderRadius="lg" border={cardBorder} borderColor={cardBorderColor} boxShadow="md">
            <Heading size="md" color="fg" mb={5} pb={2} borderBottomWidth="1px" borderColor="border">
              Informações da Empresa
            </Heading>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }} gap={5}>
              <Box>
                <Text mb={1} fontWeight="medium" color="fg">Razão Social *</Text>
                <Input
                  name="razaoSocial"
                  value={settings.razaoSocial}
                  onChange={handleInputChange}
                  placeholder="Razão Social"
                  required
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium" color="fg">Nome Fantasia *</Text>
                <Input
                  name="nomeFantasia"
                  value={settings.nomeFantasia}
                  onChange={handleInputChange}
                  placeholder="Nome Fantasia"
                  required
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium" color="fg">CNPJ</Text>
                <Input
                  name="cnpj"
                  value={settings.cnpj}
                  onChange={handleCnpjChange}
                  placeholder="AA.AAA.AAA/AAAA-99"
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium" color="fg">Telefone</Text>
                <Input
                  name="telefone"
                  value={settings.telefone}
                  onChange={handlePhoneChange}
                  placeholder="(11) 99999-9999"
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium" color="fg">E-mail Corporativo *</Text>
                <Input
                  type="email"
                  name="email"
                  value={settings.email}
                  onChange={handleInputChange}
                  placeholder="contato@empresa.com"
                  required
                />
              </Box>
            </Grid>
          </Box>

          {/* Setor: Localização */}
          <Box p={6} bg={cardBg} borderRadius="lg" border={cardBorder} borderColor={cardBorderColor} boxShadow="md">
            <Heading size="md" color="fg" mb={5} pb={2} borderBottomWidth="1px" borderColor="border">
              Localização da Empresa
            </Heading>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }} gap={5}>
              <Box>
                <Text mb={1} fontWeight="medium" color="fg">CEP</Text>
                <Flex align="center" gap={2}>
                  <Input
                    name="cep"
                    value={settings.cep}
                    onChange={(e) => setSettings((prev) => ({ ...prev, cep: e.target.value }))}
                    onBlur={handleCepBlur}
                    placeholder="00000-000"
                  />
                  {fetchingCep && <Spinner size="sm" />}
                </Flex>
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium" color="fg">Rua</Text>
                <Input
                  name="rua"
                  value={settings.rua}
                  onChange={handleInputChange}
                  placeholder="Logradouro"
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium" color="fg">Número</Text>
                <Input
                  name="numero"
                  value={settings.numero}
                  onChange={handleInputChange}
                  placeholder="Número"
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium" color="fg">Complemento</Text>
                <Input
                  name="complemento"
                  value={settings.complemento}
                  onChange={handleInputChange}
                  placeholder="Complemento"
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium" color="fg">Bairro</Text>
                <Input
                  name="bairro"
                  value={settings.bairro}
                  onChange={handleInputChange}
                  placeholder="Bairro"
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium" color="fg">Cidade</Text>
                <Input
                  name="cidade"
                  value={settings.cidade}
                  onChange={handleInputChange}
                  placeholder="Cidade"
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium" color="fg">Estado (UF)</Text>
                <Input
                  name="estado"
                  value={settings.estado}
                  onChange={handleInputChange}
                  placeholder="UF"
                  maxLength={2}
                />
              </Box>

              <Box>
                <Text mb={1} fontWeight="medium" color="fg">Coordenadas de Referência</Text>
                <Flex align="center" gap={2} h="40px">
                  <Text fontSize="sm" fontFamily="mono" color="fg.muted">
                    {fetchingCoords ? "Buscando coordenadas..." : `Lat: ${settings.latitude || "---"} / Lon: ${settings.longitude || "---"}`}
                  </Text>
                </Flex>
              </Box>
            </Grid>
          </Box>

          {/* Setor: Geolocalização */}
          <Box p={6} bg={cardBg} borderRadius="lg" border={cardBorder} borderColor={cardBorderColor} boxShadow="md">
            <Heading size="md" color="fg" mb={5} pb={2} borderBottomWidth="1px" borderColor="border">
              Regras de Geolocalização
            </Heading>
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }} gap={5}>
              <Box>
                <Text mb={1} fontWeight="medium" color="fg">Raio Permitido (metros)</Text>
                <Input
                  type="number"
                  name="raioMetros"
                  value={settings.raioMetros}
                  onChange={(e) => setSettings((prev) => ({ ...prev, raioMetros: Number(e.target.value) }))}
                  min={10}
                  placeholder="100"
                />
              </Box>
            </Grid>
          </Box>

          {/* Setor: Assinatura e Cobrança */}
          <Box p={6} bg={cardBg} borderRadius="lg" border={cardBorder} borderColor={cardBorderColor} boxShadow="md">
            <Heading size="md" color="fg" mb={5} pb={2} borderBottomWidth="1px" borderColor="border">
              Assinatura e Cobrança
            </Heading>

            {isSoon && billingInfo && (
              <Box p={4} mb={4} bg="red.muted" borderWidth="1px" borderColor="red.border" borderRadius="md">
                <Text color="red.fg" fontWeight="semibold" fontSize="sm">
                  Sua assinatura renovará em {billingInfo.diffDays} {billingInfo.diffDays === 1 ? "dia" : "dias"} (em {billingInfo.nextDate.toLocaleDateString("pt-BR")}).
                </Text>
              </Box>
            )}

            {loadingSub ? (
              <Spinner size="sm" />
            ) : subscription ? (
              <Grid templateColumns={{ base: "1fr", md: "repeat(2, minmax(0, 1fr))" }} gap={5}>
                <Box>
                  <Text fontSize="sm" color="fg.muted">Plano Atual</Text>
                  <Text fontSize="md" fontWeight="bold" color="fg">{subscription.planName}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="fg.muted">Status da Assinatura</Text>
                  <Text fontSize="md" fontWeight="semibold" color={subscription.status === "active" ? "green.500" : "red.500"}>
                    {subscription.status === "active" ? "Ativa" : "Inativa"}
                  </Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="fg.muted">Início do Ciclo</Text>
                  <Text fontSize="md" color="fg">{new Date(subscription.startDate).toLocaleDateString("pt-BR")}</Text>
                </Box>
                <Box>
                  <Text fontSize="sm" color="fg.muted">Próximo Faturamento (Renovação)</Text>
                  <Text fontSize="md" fontWeight="bold" color="fg">
                    {billingInfo ? billingInfo.nextDate.toLocaleDateString("pt-BR") : "Não disponível"}
                  </Text>
                </Box>
                <Box>
                  <Flex gap={3} pt={2}>
                    <Button type="button" variant="outline" size="sm" onClick={handleManageBilling} p="10px">
                      Portal Financeiro
                    </Button>
                    {subscription.status === "active" && (
                      <Button type="button" variant="outline" colorPalette="red" size="sm" onClick={() => setShowCancelModal(true)}>
                        Cancelar Plano
                      </Button>
                    )}
                  </Flex>
                </Box>
              </Grid>
            ) : (
              <Text fontSize="sm" color="fg.muted">Dados de assinatura não disponíveis.</Text>
            )}
          </Box>

          {/* Rodapé de Ações */}
          <Flex justify="center" gap="14px" w="100%" flexDir={{ base: "column", sm: "row" }} align="center" pt={4}>
            <Button
              type="button"
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
              disabled={saving}
              w={{ base: "100%", sm: "210px" }}
              h="34px"
              borderRadius="full"
            >
              {saving ? (
                <>
                  <Spinner size="sm" mr={2} /> Salvando...
                </>
              ) : (
                <>Salvar</>
              )}
            </Button>
          </Flex>

        </VStack>
      </Box>

      {/* Confirmation Modal */}
      {showCancelModal && (
        <Box position="fixed" top="0" left="0" w="100%" h="100%" bg="rgba(0,0,0,0.6)" zIndex="9999" display="flex" alignItems="center" justifyContent="center">
          <Box maxW="500px" w="90%" p={6} bg="surface" borderWidth="1px" borderColor="border" borderRadius="xl" boxShadow="2xl">
            <Heading size="md" color="fg" mb={4}>
              Confirmar Cancelamento
            </Heading>
            <Text fontSize="sm" color="fg" mb={6}>
              Tem certeza que deseja cancelar sua assinatura? O acesso continuará ativo até o final do período vigente.
            </Text>
            <Flex justify="flex-end" gap={3}>
              <Button size="sm" variant="outline" onClick={() => setShowCancelModal(false)}>
                Manter Assinatura
              </Button>
              <Button size="sm" colorPalette="red" loading={cancellingSub} onClick={handleCancelSubscription}>
                Confirmar Cancelamento
              </Button>
            </Flex>
          </Box>
        </Box>
      )}
    </Box>
  );
}
