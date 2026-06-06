import { useEffect, useState } from "react";
import { Badge, Box, Flex, Grid, Spinner, Text } from "@chakra-ui/react";
import { useColorModeValue } from "../../theme/colorMode";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { motion } from "framer-motion";
import {
  Users,
  Clock,
  AlertTriangle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  CalendarClock,
  FileWarning,
  ChevronRight,
} from "lucide-react";
import api from "../../services/api";

// ─── tipos ────────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent?: "purple" | "green" | "red" | "amber";
  delay?: number;
}

interface AlertItemProps {
  icon: React.ReactNode;
  message: string;
  type: "danger" | "warning" | "info" | "success";
}

interface TopLateEmployee {
  name: string;
  dept: string;
  count: number;
}

// ─── dados fallback/mock para abas extras ─────────────────────────────────────
const deptData = [
  { dept: "TI", presenca: 95 },
  { dept: "RH", presenca: 88 },
  { dept: "Comercial", presenca: 82 },
  { dept: "Financeiro", presenca: 91 },
  { dept: "Operações", presenca: 78 },
];

const alerts: AlertItemProps[] = [
  {
    icon: <AlertTriangle size={14} />,
    message: "Juliana Costa — sem registro desde segunda-feira",
    type: "danger",
  },
  {
    icon: <Clock size={14} />,
    message: "Marcos Oliveira — limite de horas extras atingido",
    type: "warning",
  },
  {
    icon: <CalendarClock size={14} />,
    message: "5 funcionários com férias vencendo em 30 dias",
    type: "info",
  },
  {
    icon: <FileWarning size={14} />,
    message: "12 atestados médicos pendentes de validação",
    type: "info",
  },
];

// ─── paleta ───────────────────────────────────────────────────────────────────
const PURPLE = "#7C3AED";
const PURPLE_LIGHT = "#EDE9FE";
const PURPLE_MID = "#A78BFA";
const GREEN = "#16A34A";
const GREEN_LIGHT = "#DCFCE7";
const RED = "#DC2626";
const RED_LIGHT = "#FEE2E2";
const AMBER = "#D97706";
const AMBER_LIGHT = "#FEF3C7";
const BLUE_LIGHT = "#EFF6FF";
const BLUE = "#2563EB";

const accentMapLight = {
  purple: { bg: PURPLE_LIGHT, color: PURPLE },
  green: { bg: GREEN_LIGHT, color: GREEN },
  red: { bg: RED_LIGHT, color: RED },
  amber: { bg: AMBER_LIGHT, color: AMBER },
};

const accentMapDark = {
  purple: { bg: "rgba(124,58,237,0.2)", color: "#c4b5fd" },
  green: { bg: "rgba(34,197,94,0.2)", color: "#86efac" },
  red: { bg: "rgba(239,68,68,0.2)", color: "#fca5a5" },
  amber: { bg: "rgba(245,158,11,0.2)", color: "#fcd34d" },
};

const alertMapLight = {
  danger: { bg: RED_LIGHT, color: RED, border: "#FECACA" },
  warning: { bg: AMBER_LIGHT, color: AMBER, border: "#FDE68A" },
  info: { bg: BLUE_LIGHT, color: BLUE, border: "#BFDBFE" },
  success: { bg: GREEN_LIGHT, color: GREEN, border: "#BBF7D0" },
};

const alertMapDark = {
  danger: {
    bg: "rgba(239,68,68,0.18)",
    color: "#fca5a5",
    border: "rgba(239,68,68,0.4)",
  },
  warning: {
    bg: "rgba(245,158,11,0.18)",
    color: "#fcd34d",
    border: "rgba(245,158,11,0.45)",
  },
  info: {
    bg: "rgba(59,130,246,0.18)",
    color: "#bfdbfe",
    border: "rgba(59,130,246,0.45)",
  },
  success: {
    bg: "rgba(34,197,94,0.18)",
    color: "#86efac",
    border: "rgba(34,197,94,0.4)",
  },
};

// ─── componentes auxiliares ───────────────────────────────────────────────────
const MotionBox = motion(Box);

function StatCard({
  label,
  value,
  icon,
  accent = "purple",
  delay = 0,
}: StatCardProps) {
  const accentMap = useColorModeValue(accentMapLight, accentMapDark);
  const { bg, color } = accentMap[accent];
  const hoverBorder = useColorModeValue("purple.200", "purple.500");
  const hoverShadow = useColorModeValue(
    "0 4px 16px rgba(124,58,237,0.10)",
    "0 8px 18px rgba(0,0,0,0.45)",
  );
  return (
    <MotionBox
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      bg="surface"
      borderRadius="12px"
      border="1px solid"
      borderColor="border"
      p={4}
      display="flex"
      alignItems="center"
      gap={3}
      _hover={{
        boxShadow: hoverShadow,
        borderColor: hoverBorder,
      }}
      style={{ transition: "box-shadow 0.2s, border-color 0.2s" }}
    >
      <Box
        bg={bg}
        color={color}
        borderRadius="10px"
        p={2.5}
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexShrink={0}
      >
        {icon}
      </Box>
      <Box>
        <Text
          fontSize="11px"
          color="fg.muted"
          fontWeight={500}
          letterSpacing="0.04em"
          textTransform="uppercase"
        >
          {label}
        </Text>
        <Text
          fontSize="22px"
          fontWeight={700}
          color="fg"
          lineHeight={1.2}
          mt={0.5}
        >
          {value}
        </Text>
      </Box>
    </MotionBox>
  );
}

function AlertItem({ icon, message, type }: AlertItemProps) {
  const alertMap = useColorModeValue(alertMapLight, alertMapDark);
  const { bg, color, border } = alertMap[type];
  const textColor = "fg";
  return (
    <Flex
      align="flex-start"
      gap={2.5}
      p="10px 12px"
      borderRadius="8px"
      border="1px solid"
      mb={2}
      style={{ background: bg, borderColor: border }}
    >
      <Box color={color} mt={0.5} flexShrink={0}>
        {icon}
      </Box>
      <Text fontSize="12px" color={textColor} lineHeight={1.5}>
        {message}
      </Text>
    </Flex>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  const tooltipBg = "surface";
  const tooltipBorder = "border";
  const tooltipTitle = "fg.muted";
  if (active && payload?.length) {
    return (
      <Box
        bg={tooltipBg}
        border="1px solid"
        borderColor={tooltipBorder}
        borderRadius="8px"
        p="8px 12px"
        boxShadow="sm"
      >
        <Text fontSize="11px" fontWeight={600} color={tooltipTitle} mb={1}>
          {label}
        </Text>
        {payload.map((p: any) => (
          <Text key={p.name} fontSize="12px" color={p.color}>
            {p.name}: {p.value}%
          </Text>
        ))}
      </Box>
    );
  }
  return null;
};

// ─── componente principal ─────────────────────────────────────────────────────
export default function DashboardRH() {
  const [activeTab, setActiveTab] = useState<"semana" | "departamento">(
    "semana",
  );
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const cardBg = "surface";
  const cardBorder = "border";
  const mutedText = "fg.muted";
  const tabBg = "surface.subtle";
  const activeTabBg = "surface";
  const activeTabColor = useColorModeValue(PURPLE, "#c4b5fd");
  const tabText = "fg.muted";
  const gridStroke = useColorModeValue("#F0F0F0", "rgba(255,255,255,0.08)");
  const axisTick = useColorModeValue("#9CA3AF", "#94A3B8");
  const alertBadgeBg = useColorModeValue(RED_LIGHT, "rgba(239,68,68,0.2)");
  const alertBadgeColor = useColorModeValue(RED, "#fca5a5");
  const rankFirstBg = useColorModeValue(PURPLE_LIGHT, "rgba(124,58,237,0.2)");
  const rankOtherBg = "surface.subtle";
  const rankFirstColor = useColorModeValue(PURPLE, "#c4b5fd");
  const rankOtherColor = "fg.muted";
  const deptColor = "fg.muted";
  const badgeFirstBg = useColorModeValue(RED_LIGHT, "rgba(239,68,68,0.2)");
  const badgeOtherBg = "surface.subtle";
  const badgeFirstColor = useColorModeValue(RED, "#fca5a5");
  const badgeOtherColor = "fg.muted";
  const trackBg = "surface.subtle";
  const captionText = "fg.muted";

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get("/user/attendance-dashboard");
        setDashboardData(response.data);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    void loadDashboardData();
  }, []);

  if (loading) {
    return (
      <Flex align="center" justify="center" minH="50vh" gap={3}>
        <Spinner />
        <Text>Carregando métricas da dashboard...</Text>
      </Flex>
    );
  }

  // Map charts data from API response
  const summary = dashboardData?.summary || {
    activeEmployees: 0,
    punctualityRate: 0,
    noClockToday: 0,
    monthlyOvertimeHours: 0,
  };

  const weeklyChartData = dashboardData?.weeklyPresence?.map((w: any) => ({
    semana: w.weekLabel,
    pontual: w.punctual,
    atrasado: w.late,
  })) || [];

  const topLateChartData = dashboardData?.topLateEmployees?.map((e: any) => ({
    name: e.name,
    dept: "Geral",
    count: e.lateCount,
  })) || [];

  const trendChartData = dashboardData?.punctualityTrend?.map((t: any) => ({
    mes: t.month,
    taxa: t.rate,
  })) || [];

  return (
    <Box
      bg="surface.muted"
      minH="100vh"
      px={{ base: 4, md: 6 }}
      fontFamily="'Inter', sans-serif"
    >
      {/* cabeçalho */}
      <MotionBox
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        mb={6}
      >
        <Flex align="center" justify="space-between" flexWrap="wrap" gap={3}>
          <Text
            fontSize="13px"
            color={mutedText}
            mt={0.5}
            textTransform="capitalize"
          >
            {today}
          </Text>
        </Flex>
      </MotionBox>

      {/* cards de resumo */}
      <Grid
        templateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
        gap={3}
        mb={5}
      >
        <StatCard
          label="Funcionários ativos"
          value={String(summary.activeEmployees)}
          icon={<Users size={18} />}
          accent="purple"
          delay={0.05}
        />
        <StatCard
          label="Taxa de pontualidade"
          value={`${summary.punctualityRate}%`}
          icon={<CheckCircle2 size={18} />}
          accent="green"
          delay={0.1}
        />
        <StatCard
          label="Sem ponto hoje"
          value={String(summary.noClockToday)}
          icon={<XCircle size={18} />}
          accent="red"
          delay={0.15}
        />
        <StatCard
          label="Horas extras (mês)"
          value={`${summary.monthlyOvertimeHours}h`}
          icon={<TrendingUp size={18} />}
          accent="amber"
          delay={0.2}
        />
      </Grid>

      {/* linha 2: gráfico principal + alertas */}
      <Grid templateColumns={{ base: "1fr", lg: "1.5fr 1fr" }} gap={4} mb={4}>
        {/* gráfico de pontualidade com tabs */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          bg={cardBg}
          borderRadius="12px"
          border="1px solid"
          borderColor={cardBorder}
          p={5}
        >
          <Flex justify="space-between" align="center" mb={1}>
            <Box>
              <Text fontSize="14px" fontWeight={600} color="fg">
                Análise de presença
              </Text>
              <Text fontSize="12px" color={captionText} mt={0.5}>
                Período Atual
              </Text>
            </Box>
            <Flex gap={1} bg={tabBg} borderRadius="8px" p={0.5}>
              {(["semana", "departamento"] as const).map((tab) => (
                <Box
                  key={tab}
                  px={3}
                  py={1.5}
                  borderRadius="6px"
                  fontSize="11px"
                  fontWeight={500}
                  cursor="pointer"
                  onClick={() => setActiveTab(tab)}
                  bg={activeTab === tab ? activeTabBg : "transparent"}
                  color={activeTab === tab ? activeTabColor : tabText}
                  boxShadow={
                    activeTab === tab ? "0 1px 4px rgba(0,0,0,0.08)" : "none"
                  }
                  style={{
                    transition: "all 0.2s",
                    textTransform: "capitalize",
                  }}
                >
                  {tab === "semana" ? "Por semana" : "Por depto"}
                </Box>
              ))}
            </Flex>
          </Flex>

          {/* legenda */}
          <Flex gap={4} mb={4} mt={3}>
            {activeTab === "semana" ? (
              <>
                <Flex align="center" gap={1.5}>
                  <Box w="10px" h="10px" borderRadius="2px" bg={PURPLE} />
                  <Text fontSize="11px" color={mutedText}>
                    Pontual
                  </Text>
                </Flex>
                <Flex align="center" gap={1.5}>
                  <Box w="10px" h="10px" borderRadius="2px" bg={RED} />
                  <Text fontSize="11px" color={mutedText}>
                    Atrasado
                  </Text>
                </Flex>
              </>
            ) : (
              <Flex align="center" gap={1.5}>
                <Box w="10px" h="10px" borderRadius="2px" bg={PURPLE} />
                <Text fontSize="11px" color={mutedText}>
                  % Presença
                </Text>
              </Flex>
            )}
          </Flex>

          {activeTab === "semana" ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyChartData} barSize={28} barGap={4}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridStroke}
                  vertical={false}
                />
                <XAxis
                  dataKey="semana"
                  tick={{ fontSize: 11, fill: axisTick }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: axisTick }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="pontual"
                  name="Pontual"
                  fill={PURPLE}
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
                <Bar
                  dataKey="atrasado"
                  name="Atrasado"
                  fill={RED}
                  radius={[4, 4, 0, 0]}
                  stackId="a"
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData} layout="vertical" barSize={16}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={gridStroke}
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: axisTick }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `${v}%`}
                  domain={[0, 100]}
                />
                <YAxis
                  type="category"
                  dataKey="dept"
                  tick={{ fontSize: 11, fill: axisTick }}
                  axisLine={false}
                  tickLine={false}
                  width={70}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="presenca"
                  name="Presença"
                  fill={PURPLE}
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </MotionBox>

        {/* alertas do dia */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          bg={cardBg}
          borderRadius="12px"
          border="1px solid"
          borderColor={cardBorder}
          p={5}
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Box>
              <Text fontSize="14px" fontWeight={600} color="fg">
                Alertas do dia
              </Text>
              <Text fontSize="12px" color={captionText} mt={0.5}>
                Requer atenção
              </Text>
            </Box>
            <Badge
              bg={alertBadgeBg}
              color={alertBadgeColor}
              fontSize="11px"
              px={2}
              py={0.5}
              borderRadius="6px"
            >
              {alerts.length} novos
            </Badge>
          </Flex>
          {alerts.map((a, i) => (
            <AlertItem key={i} {...a} />
          ))}
        </MotionBox>
      </Grid>

      {/* linha 3: ranking de atrasos + evolução de área */}
      <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={4}>
        {/* top atrasos */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.35 }}
          bg={cardBg}
          borderRadius="12px"
          border="1px solid"
          borderColor={cardBorder}
          p={5}
        >
          <Flex justify="space-between" align="center" mb={4}>
            <Box>
              <Text fontSize="14px" fontWeight={600} color="fg">
                Top mais atrasos
              </Text>
              <Text fontSize="12px" color={captionText} mt={0.5}>
                Registros no mês atual
              </Text>
            </Box>
            <Flex
              align="center"
              gap={1}
              fontSize="11px"
              color={activeTabColor}
              fontWeight={500}
              cursor="pointer"
              _hover={{ textDecoration: "underline" }}
            >
              Ver todos <ChevronRight size={13} />
            </Flex>
          </Flex>

          {topLateChartData.length > 0 ? (
            topLateChartData.map((f, i) => {
              const maxCount = topLateChartData[0]?.count || 1;
              const pct = Math.round((f.count / maxCount) * 100);
              const isFirst = i === 0;
              return (
                <Box key={f.name} mb={i < topLateChartData.length - 1 ? 3 : 0}>
                  <Flex justify="space-between" align="center" mb={1}>
                    <Flex align="center" gap={2}>
                      <Box
                        w="22px"
                        h="22px"
                        borderRadius="50%"
                        bg={isFirst ? rankFirstBg : rankOtherBg}
                        color={isFirst ? rankFirstColor : rankOtherColor}
                        fontSize="10px"
                        fontWeight={700}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        flexShrink={0}
                      >
                        {i + 1}
                      </Box>
                      <Text
                        fontSize="12px"
                        fontWeight={isFirst ? 600 : 400}
                        color="fg"
                      >
                        {f.name}
                      </Text>
                    </Flex>
                    <Flex align="center" gap={2}>
                      <Text fontSize="11px" color={deptColor}>
                        {f.dept}
                      </Text>
                      <Badge
                        bg={isFirst ? badgeFirstBg : badgeOtherBg}
                        color={isFirst ? badgeFirstColor : badgeOtherColor}
                        fontSize="10px"
                        px={1.5}
                        borderRadius="4px"
                      >
                        {f.count}x
                      </Badge>
                    </Flex>
                  </Flex>
                  <Box bg={trackBg} borderRadius="full" h="5px" overflow="hidden">
                    <Box
                      bg={isFirst ? RED : PURPLE_MID}
                      h="100%"
                      borderRadius="full"
                      style={{ width: `${pct}%`, transition: "width 0.6s ease" }}
                    />
                  </Box>
                </Box>
              );
            })
          ) : (
            <Text fontSize="12px" color="fg.muted">Sem dados de atraso no mês.</Text>
          )}
        </MotionBox>

        {/* área — evolução de pontualidade */}
        <MotionBox
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          bg={cardBg}
          borderRadius="12px"
          border="1px solid"
          borderColor={cardBorder}
          p={5}
        >
          <Box mb={4}>
            <Text fontSize="14px" fontWeight={600} color="fg">
              Evolução da pontualidade
            </Text>
            <Text fontSize="12px" color={captionText} mt={0.5}>
              Histórico Mensal
            </Text>
          </Box>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={trendChartData}>
              <defs>
                <linearGradient id="gradPontual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={PURPLE} stopOpacity={0.18} />
                  <stop offset="95%" stopColor={PURPLE} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={gridStroke}
                vertical={false}
              />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 11, fill: axisTick }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: axisTick }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
                domain={[0, 100]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="taxa"
                name="Pontualidade"
                stroke={PURPLE}
                strokeWidth={2.5}
                fill="url(#gradPontual)"
                dot={{ fill: PURPLE, r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: PURPLE }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </MotionBox>
      </Grid>
    </Box>
  );
}
