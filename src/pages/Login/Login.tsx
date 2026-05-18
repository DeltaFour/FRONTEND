import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Building2,
  Hash,
  User,
} from "lucide-react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useAuth } from "../../context/AuthContext";
import LogoHorizontal from "../../assets/LogoHorizontal.png";
import DarkVeil from "../../components/background/background";
import { Input } from "../../components/ui/Input";
import { toaster } from "../../components/ui/toaster";

const maskCnpj = (value: string) => {
  return value
    .replace(/\D/g, "")
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2")
    .substring(0, 18);
};

type Mode = "login" | "register";

const Login = () => {
  const [mode, setMode] = useState<Mode>("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  // Register state
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (params.get("payment") === "true") {
      toaster.success({
        title: "Cadastro concluido!",
        description: "Pagamento confirmado. Voce ja pode fazer login.",
      });
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  const handleLoginSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const userData = await login(email, password, rememberMe);
    setLoading(false);

    if (!userData) {
      toaster.error({
        title: "Falha no login",
        description:
          "Não foi possível realizar o login. Verifique seu e-mail e senha.",
      });
      return;
    }

    const roleSuffix = (userData.role || "").toUpperCase();

    if (["SUPER_ADMIN", "ADMIN", "RH"].includes(roleSuffix)) {
      navigate("/dashboard-empresa");
      return;
    }

    if (roleSuffix === "EMPLOYEE") {
      navigate("/dashboard-funcionario");
      return;
    }

    toaster.error({
      title: "Perfil desconhecido",
      description: `Perfil desconhecido: ${roleSuffix}. Consulte o backend.`,
    });
  };

  const handleRegisterSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setRegisterLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BASE_URL}/api/v1/subscription/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: companyName,
            cnpj,
            user: {
              email: registerEmail,
              name: userName,
              password: registerPassword,
            },
          }),
        },
      );

      if (!response.ok) {
        throw new Error("Erro ao registrar");
      }

      const data = await response.json();

      if (data.checkoutUrl) {
        window.location.replace(data.checkoutUrl.toString());
        return;
      }

      toaster.success({
        title: "Cadastro realizado!",
        description: "Sua empresa foi registrada com sucesso. Faça o login.",
      });
      setCompanyName("");
      setCnpj("");
      setRegisterEmail("");
      setUserName("");
      setRegisterPassword("");
      setMode("login");
    } catch {
      toaster.error({
        title: "Falha no cadastro",
        description:
          "Não foi possível realizar o cadastro. Verifique os dados e tente novamente.",
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  const fieldLabelStyle = {
    fontSize: "sm" as const,
    fontWeight: "semibold" as const,
    color: "white",
  };

  const inputStyle = {
    border: "none",
    borderBottom: "1px solid white",
    bg: "transparent",
    pl: "3rem",
    pr: 4,
    py: 3,
  };

  return (
    <Flex minH="100vh" overflow="hidden" position="relative">
      <Box position="absolute" inset={0} zIndex={0}>
        <DarkVeil
          hueShift={0}
          noiseIntensity={0.02}
          scanlineIntensity={0.1}
          speed={0.5}
          scanlineFrequency={0.0}
          warpAmount={0.02}
          resolutionScale={1}
        />
      </Box>

      <Flex
        flex="1"
        align="center"
        justify="center"
        p={{ base: 4, md: 8 }}
        position="relative"
        zIndex={1}
      >
        <Box w="full" maxW="md">
          <Flex
            as="section"
            direction="column"
            align="center"
            justify="center"
            bg="transparent"
            p={{ base: 6, md: 8 }}
          >
            {/* Logo & subtitle */}
            <Box mb={8} textAlign="center">
              <Heading
                as="h2"
                fontSize="3xl"
                fontWeight="bold"
                color="white"
                justifyContent="center"
                display="flex"
              >
                <Image src={LogoHorizontal} alt="Logo" maxW="65%" />
              </Heading>
              <Text color="#ffff" mt={2}>
                {mode === "login"
                  ? "Entre com suas credenciais para acessar o sistema"
                  : "Preencha os dados para criar sua conta"}
              </Text>
            </Box>

            {/* ── LOGIN FORM ── */}
            {mode === "login" && (
              <form onSubmit={handleLoginSubmit} style={{ width: "100%" }}>
                <Flex direction="column" gap={6}>
                  {/* Email */}
                  <Box>
                    <Text {...fieldLabelStyle}>E-mail</Text>
                    <Box position="relative">
                      <Box
                        position="absolute"
                        insetY={0}
                        left={0}
                        pl={4}
                        display="flex"
                        alignItems="center"
                        pointerEvents="none"
                        zIndex={1}
                      >
                        <Mail size={20} color="#9CA3AF" />
                      </Box>
                      <Input
                        type="email"
                        id="email"
                        {...inputStyle}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Insira seu e-mail"
                        required
                      />
                    </Box>
                  </Box>

                  {/* Senha */}
                  <Box>
                    <Text {...fieldLabelStyle}>Senha</Text>
                    <Box position="relative">
                      <Box
                        position="absolute"
                        insetY={0}
                        left={0}
                        pl={4}
                        display="flex"
                        alignItems="center"
                        pointerEvents="none"
                        zIndex={1}
                      >
                        <Lock size={20} color="#9CA3AF" />
                      </Box>
                      <Input
                        type={showPassword ? "text" : "password"}
                        id="password"
                        border="none"
                        borderBottom="1px solid white"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        pl="3rem"
                        pr="3rem"
                        py={3}
                        bg="transparent"
                        placeholder="Insira sua senha"
                        color="white"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword((v) => !v)}
                        color="whiteAlpha.600"
                        _hover={{ color: "white", bg: "transparent" }}
                        position="absolute"
                        insetY={0}
                        right={0}
                        minW="36px"
                      >
                        {showPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </Button>
                    </Box>
                  </Box>

                  {/* Lembrar-me */}
                  <Flex align="center" justify="space-between">
                    <label
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        style={{ width: 16, height: 16 }}
                      />
                      <Text fontSize="sm" color="white">
                        Lembrar-me
                      </Text>
                    </label>
                  </Flex>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={loading}
                    w="full"
                    py={3}
                    borderRadius="lg"
                    fontWeight="semibold"
                    color="white"
                    bg="purple.900"
                    cursor={loading ? "not-allowed" : "pointer"}
                    boxShadow={loading ? undefined : "lg"}
                    _hover={
                      loading
                        ? undefined
                        : {
                            bgGradient: "linear(to-r, black, purple.900)",
                            boxShadow: "xl",
                          }
                    }
                  >
                    <Flex align="center" justify="center" gap={2}>
                      {loading ? (
                        <>
                          <Spinner size="sm" color="white" />
                          <Text>Entrando...</Text>
                        </>
                      ) : (
                        <>
                          <Text>Entrar</Text>
                        </>
                      )}
                    </Flex>
                  </Button>
                </Flex>
              </form>
            )}

            {/* ── REGISTER FORM ── */}
            {mode === "register" && (
              <form onSubmit={handleRegisterSubmit} style={{ width: "100%" }}>
                <Flex direction="column" gap={6}>
                  {/* Nome da empresa */}
                  <Box>
                    <Text {...fieldLabelStyle}>Nome da empresa</Text>
                    <Box position="relative">
                      <Box
                        position="absolute"
                        insetY={0}
                        left={0}
                        pl={4}
                        display="flex"
                        alignItems="center"
                        pointerEvents="none"
                        zIndex={1}
                      >
                        <Building2 size={20} color="#9CA3AF" />
                      </Box>
                      <Input
                        type="text"
                        {...inputStyle}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        placeholder="Nome da sua empresa"
                        required
                      />
                    </Box>
                  </Box>

                  {/* CNPJ */}
                  <Box>
                    <Text {...fieldLabelStyle}>CNPJ</Text>
                    <Box position="relative">
                      <Box
                        position="absolute"
                        insetY={0}
                        left={0}
                        pl={4}
                        display="flex"
                        alignItems="center"
                        pointerEvents="none"
                        zIndex={1}
                      >
                        <Hash size={20} color="#9CA3AF" />
                      </Box>
                      <Input
                        type="text"
                        {...inputStyle}
                        value={cnpj}
                        onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                        placeholder="00.000.000/0001-00"
                        maxLength={18}
                        required
                      />
                    </Box>
                  </Box>

                  {/* Email */}
                  <Box>
                    <Text {...fieldLabelStyle}>E-mail</Text>
                    <Box position="relative">
                      <Box
                        position="absolute"
                        insetY={0}
                        left={0}
                        pl={4}
                        display="flex"
                        alignItems="center"
                        pointerEvents="none"
                        zIndex={1}
                      >
                        <Mail size={20} color="#9CA3AF" />
                      </Box>
                      <Input
                        type="email"
                        {...inputStyle}
                        value={registerEmail}
                        color="white"
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        placeholder="Insira seu e-mail"
                        required
                      />
                    </Box>
                  </Box>

                  {/* Nome do usuário */}
                  <Box>
                    <Text {...fieldLabelStyle}>Nome do usuário</Text>
                    <Box position="relative">
                      <Box
                        position="absolute"
                        insetY={0}
                        left={0}
                        pl={4}
                        display="flex"
                        alignItems="center"
                        pointerEvents="none"
                        zIndex={1}
                      >
                        <User size={20} color="#9CA3AF" />
                      </Box>
                      <Input
                        type="text"
                        {...inputStyle}
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        placeholder="Seu nome completo"
                        required
                      />
                    </Box>
                  </Box>

                  {/* Senha */}
                  <Box>
                    <Text {...fieldLabelStyle}>Senha</Text>
                    <Box position="relative">
                      <Box
                        position="absolute"
                        insetY={0}
                        left={0}
                        pl={4}
                        display="flex"
                        alignItems="center"
                        pointerEvents="none"
                        zIndex={1}
                      >
                        <Lock size={20} color="#9CA3AF" />
                      </Box>
                      <Input
                        type={showRegisterPassword ? "text" : "password"}
                        border="none"
                        borderBottom="1px solid white"
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        pl="3rem"
                        pr="3rem"
                        py={3}
                        bg="transparent"
                        placeholder="Crie uma senha"
                        color="white"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowRegisterPassword((v) => !v)}
                        color="whiteAlpha.600"
                        _hover={{ color: "white", bg: "transparent" }}
                        position="absolute"
                        insetY={0}
                        right={0}
                        minW="36px"
                      >
                        {showRegisterPassword ? (
                          <EyeOff size={20} />
                        ) : (
                          <Eye size={20} />
                        )}
                      </Button>
                    </Box>
                  </Box>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={registerLoading}
                    w="full"
                    py={3}
                    borderRadius="lg"
                    fontWeight="semibold"
                    color="white"
                    bg="purple.900"
                    cursor={registerLoading ? "not-allowed" : "pointer"}
                    boxShadow={registerLoading ? undefined : "lg"}
                    _hover={
                      registerLoading
                        ? undefined
                        : {
                            bgGradient: "linear(to-r, black, purple.900)",
                            boxShadow: "xl",
                          }
                    }
                  >
                    <Flex align="center" justify="center" gap={2}>
                      {registerLoading ? (
                        <>
                          <Spinner size="sm" color="white" />
                          <Text>Cadastrando...</Text>
                        </>
                      ) : (
                        <>
                          <Text>Criar conta</Text>
                        </>
                      )}
                    </Flex>
                  </Button>
                </Flex>
              </form>
            )}

            {/* Footer toggle */}
            <Box
              mt={8}
              pt={6}
              borderTopWidth="1px"
              borderColor="whiteAlpha.200"
              textAlign="center"
              w="full"
              flexDir="column"
            >
              {mode === "login" ? (
                <>
                  <Text fontSize="sm" color="white">
                    Novo por aqui?{" "}
                  </Text>
                  <Text
                    as="button"
                    onClick={() => setMode("register")}
                    color="blue.500"
                    textDecoration="underline"
                    cursor="pointer"
                  >
                    Começar agora
                  </Text>
                </>
              ) : (
                <>
                  <Text fontSize="sm" color="white">
                    Já tem uma conta?{" "}
                  </Text>
                  <Text
                    as="button"
                    onClick={() => setMode("login")}
                    color="blue.500"
                    textDecoration="underline"
                    cursor="pointer"
                  >
                    Fazer login
                  </Text>
                </>
              )}
            </Box>

            <Text mt={4} textAlign="center" color="white" fontSize="xs">
              v1.0.0
            </Text>
          </Flex>
        </Box>
      </Flex>
    </Flex>
  );
};

export default Login;
