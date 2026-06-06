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
  Check,
  X,
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
import LogoComEscrita from "../../assets/LogoComEscrita.svg";
import DarkVeil from "../../components/background/background";
import { Input } from "../../components/ui/Input";
import { toaster } from "../../components/ui/toaster";

import { maskCnpj, validateCnpj } from "../../utils/cnpj";
import { validateEmail, validatePassword } from "../../utils/validation";

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, registerCompany } = useAuth();

  const handleLoginSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);

    const sanitizedEmail = email.trim().toLowerCase();
    if (!validateEmail(sanitizedEmail)) {
      toaster.error({
        title: "E-mail Inválido",
        description: "Por favor, insira um endereço de e-mail válido.",
      });
      setLoading(false);
      return;
    }

    try {
      await login(sanitizedEmail, password);
      toaster.success({
        title: "Sucesso",
        description: "Login realizado com sucesso!",
      });

      const destination = location.state?.from || "/dashboard-empresa";
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      const description =
        message ?? "Verifique suas credenciais e tente novamente.";

      toaster.error({
        title: "Falha no Login",
        description,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setRegisterLoading(true);

    const sanitizedEmail = registerEmail.trim().toLowerCase();
    if (!validateEmail(sanitizedEmail)) {
      toaster.error({
        title: "E-mail Inválido",
        description: "Por favor, insira um endereço de e-mail válido.",
      });
      setRegisterLoading(false);
      return;
    }

    if (!validateCnpj(cnpj)) {
      toaster.error({
        title: "Erro de Validação",
        description: "O CNPJ informado é inválido.",
      });
      setRegisterLoading(false);
      return;
    }

    const passwordValidation = validatePassword(registerPassword);
    if (!passwordValidation.isValid) {
      toaster.error({
        title: "Senha não atende aos requisitos",
        description: "A senha precisa ter pelo menos: 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial, e nenhum espaço.",
      });
      setRegisterLoading(false);
      return;
    }

    if (registerPassword !== confirmPassword) {
      toaster.error({
        title: "Confirmação Incorreta",
        description: "As senhas não coincidem.",
      });
      setRegisterLoading(false);
      return;
    }

    const payload = {
      companyName,
      cnpj,
      email: sanitizedEmail,
      name: userName,
      password: registerPassword,
    };

    try {
      await registerCompany(payload);
      toaster.success({
        title: "Sucesso",
        description: "Empresa cadastrada com sucesso! Faça login.",
      });
      setMode("login");
      setEmail(registerEmail);
      setPassword("");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      const description = message ?? "Erro ao cadastrar empresa.";

      toaster.error({
        title: "Falha no Cadastro",
        description,
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  const fieldLabelStyle = {
    fontSize: "sm",
    fontWeight: "semibold",
    color: "#ffff",
    mb: 2,
  };

  const inputStyle = {
    w: "full",
    h: 12,
    pl: 12,
    pr: 4,
    borderRadius: "xl",
    borderWidth: "1.5px",
    borderColor: "whiteAlpha.300",
    bg: "rgba(255,255,255,0.05)",
    color: "white",
    fontSize: "md",
    _placeholder: { color: "whiteAlpha.400" },
    _focus: {
      borderColor: "purple.500",
      bg: "rgba(255,255,255,0.08)",
    },
  };

  return (
    <Flex minH="100vh" bg="#0B0B0E" position="relative" overflow="hidden">
      {/* Background veil */}
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
            <Box mb={8} textAlign="center" w="100%">
              <Heading
                as="h2"
                fontSize="3xl"
                fontWeight="bold"
                color="white"
                justifyContent="center"
                display="flex"
                mb={4}
              >
                <Box
                  w="240px"
                  h="62px"
                  bg="#E9D5FF"
                  style={{
                    maskImage: `url(${LogoComEscrita})`,
                    WebkitMaskImage: `url(${LogoComEscrita})`,
                    maskSize: "contain",
                    WebkitMaskSize: "contain",
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    maskPosition: "center",
                    WebkitMaskPosition: "center",
                  }}
                />
              </Heading>
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
                        autocomplete="username"
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
                        autocomplete="current-password"
                        {...inputStyle}
                        pr={12}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Insira sua senha"
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
                        id="companyName"
                        autocomplete="organization"
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
                        id="cnpj"
                        autocomplete="off"
                        {...inputStyle}
                        value={cnpj}
                        onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                        placeholder="00.000.000/0001-00 ou AA.AAA.AAA/AAAA-99"
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
                        id="registerEmail"
                        autocomplete="email"
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
                        id="userName"
                        autocomplete="name"
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
                        id="registerPassword"
                        autocomplete="new-password"
                        {...inputStyle}
                        pr={12}
                        value={registerPassword}
                        onChange={(e) => setRegisterPassword(e.target.value)}
                        placeholder="Crie uma senha"
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

                    {/* Feedback visual dos requisitos da senha */}
                    {registerPassword && (() => {
                      const criteria = validatePassword(registerPassword).criteria;
                      return (
                        <Flex direction="column" gap={1} mt={2} pl={1}>
                          <Text fontSize="xs" color="whiteAlpha.700">Requisitos da senha:</Text>
                          <Flex align="center" gap={1.5} fontSize="xs" color={criteria.hasMinLength ? "green.300" : "red.300"}>
                            {criteria.hasMinLength ? <Check size={12} /> : <X size={12} />} Mínimo de 8 caracteres
                          </Flex>
                          <Flex align="center" gap={1.5} fontSize="xs" color={criteria.hasUpper ? "green.300" : "red.300"}>
                            {criteria.hasUpper ? <Check size={12} /> : <X size={12} />} Pelo menos 1 letra maiúscula
                          </Flex>
                          <Flex align="center" gap={1.5} fontSize="xs" color={criteria.hasLower ? "green.300" : "red.300"}>
                            {criteria.hasLower ? <Check size={12} /> : <X size={12} />} Pelo menos 1 letra minúscula
                          </Flex>
                          <Flex align="center" gap={1.5} fontSize="xs" color={criteria.hasNumber ? "green.300" : "red.300"}>
                            {criteria.hasNumber ? <Check size={12} /> : <X size={12} />} Pelo menos 1 número
                          </Flex>
                          <Flex align="center" gap={1.5} fontSize="xs" color={criteria.hasSpecial ? "green.300" : "red.300"}>
                            {criteria.hasSpecial ? <Check size={12} /> : <X size={12} />} Pelo menos 1 caractere especial
                          </Flex>
                          <Flex align="center" gap={1.5} fontSize="xs" color={criteria.noSpaces ? "green.300" : "red.300"}>
                            {criteria.noSpaces ? <Check size={12} /> : <X size={12} />} Sem espaços em branco
                          </Flex>
                        </Flex>
                      );
                    })()}
                  </Box>

                  {/* Confirmar Senha */}
                  <Box>
                    <Text {...fieldLabelStyle}>Confirmar Senha</Text>
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
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        autocomplete="new-password"
                        {...inputStyle}
                        pr={12}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirme sua senha"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        color="whiteAlpha.600"
                        _hover={{ color: "white", bg: "transparent" }}
                        position="absolute"
                        insetY={0}
                        right={0}
                        minW="36px"
                      >
                        {showConfirmPassword ? (
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
