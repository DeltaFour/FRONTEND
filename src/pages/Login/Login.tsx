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
import api from "../../services/api";

import { maskCnpj, validateCnpj } from "../../utils/cnpj";
import { maskCpf, validateCpf } from "../../utils/cpf";
import { validateEmail, validatePassword } from "../../utils/validation";

type Mode = "login" | "register" | "forgot" | "reset" | "firstAccess";

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
  const [registerCpf, setRegisterCpf] = useState("");

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);

  // Reset password state
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmPassword, setResetConfirmPassword] = useState("");
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // First access (primeiro acesso) state
  const [firstPassword, setFirstPassword] = useState("");
  const [firstConfirmPassword, setFirstConfirmPassword] = useState("");
  const [showFirstPassword, setShowFirstPassword] = useState(false);
  const [showFirstConfirmPassword, setShowFirstConfirmPassword] = useState(false);
  const [firstAccessLoading, setFirstAccessLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { login, registerCompany, user, updateUser } = useAuth();

  useEffect(() => {
    if (user?.mustChangePassword) {
      setMode("firstAccess");
    }
  }, [user]);

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
      const loggedUser = await login(sanitizedEmail, password);

      if (loggedUser && loggedUser.mustChangePassword) {
        setMode("firstAccess");
        setFirstPassword("");
        setFirstConfirmPassword("");
        toaster.info({
          title: "Primeiro acesso",
          description: "Crie uma nova senha pessoal para continuar.",
        });
        return;
      }

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

    if (!validateCpf(registerCpf)) {
      toaster.error({
        title: "Erro de Validação",
        description: "O CPF informado é inválido.",
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
      cpf: registerCpf,
    };

    try {
      const result = await registerCompany(payload);

      if (result.checkoutUrl) {
        toaster.success({
          title: "Sucesso",
          description: "Empresa cadastrada! Redirecionando para o pagamento...",
        });
        window.location.href = result.checkoutUrl;
        return;
      }

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

  const handleForgotSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setForgotLoading(true);

    const sanitizedEmail = forgotEmail.trim().toLowerCase();
    if (!validateEmail(sanitizedEmail)) {
      toaster.error({
        title: "E-mail Inválido",
        description: "Por favor, insira um endereço de e-mail válido.",
      });
      setForgotLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/forgot-password", { email: sanitizedEmail });
      toaster.success({
        title: "Código Enviado",
        description: response.data?.message || "Se o e-mail estiver cadastrado, um código de recuperação foi enviado.",
      });
      setMode("reset");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      const description = message ?? "Erro ao solicitar redefinição de senha.";

      toaster.error({
        title: "Falha na Solicitação",
        description,
      });
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setResetLoading(true);

    const sanitizedEmail = forgotEmail.trim().toLowerCase();
    if (!validateEmail(sanitizedEmail)) {
      toaster.error({
        title: "E-mail Inválido",
        description: "Por favor, confirme seu endereço de e-mail.",
      });
      setResetLoading(false);
      return;
    }

    if (!resetCode || resetCode.length !== 6) {
      toaster.error({
        title: "Código Inválido",
        description: "O código de verificação deve conter 6 dígitos.",
      });
      setResetLoading(false);
      return;
    }

    const passwordValidation = validatePassword(resetNewPassword);
    if (!passwordValidation.isValid) {
      toaster.error({
        title: "Senha não atende aos requisitos",
        description: "A senha precisa ter pelo menos: 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial, e nenhum espaço.",
      });
      setResetLoading(false);
      return;
    }

    if (resetNewPassword !== resetConfirmPassword) {
      toaster.error({
        title: "Confirmação Incorreta",
        description: "As senhas não coincidem.",
      });
      setResetLoading(false);
      return;
    }

    try {
      const response = await api.post("/auth/reset-password", {
        email: sanitizedEmail,
        code: resetCode,
        newPassword: resetNewPassword,
      });
      toaster.success({
        title: "Sucesso",
        description: response.data?.message || "Senha redefinida com sucesso! Faça login.",
      });
      setMode("login");
      setEmail(sanitizedEmail);
      setPassword("");
      setResetCode("");
      setResetNewPassword("");
      setResetConfirmPassword("");
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })
        .response?.data?.message;
      const description = message ?? "Erro ao redefinir senha.";

      toaster.error({
        title: "Falha na Redefinição",
        description,
      });
    } finally {
      setResetLoading(false);
    }
  };

  const handleFirstAccessSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setFirstAccessLoading(true);

    const passwordValidation = validatePassword(firstPassword);
    if (!passwordValidation.isValid) {
      toaster.error({
        title: "Senha não atende aos requisitos",
        description:
          "A senha precisa ter pelo menos: 8 caracteres, 1 maiúscula, 1 minúscula, 1 número, 1 caractere especial, e nenhum espaço.",
      });
      setFirstAccessLoading(false);
      return;
    }

    if (firstPassword !== firstConfirmPassword) {
      toaster.error({
        title: "Confirmação Incorreta",
        description: "As senhas não coincidem.",
      });
      setFirstAccessLoading(false);
      return;
    }

    try {
      await api.post(
        "/auth/set-initial-password",
        { newPassword: firstPassword },
        { withCredentials: true },
      );

      updateUser({ mustChangePassword: false });

      toaster.success({
        title: "Senha criada",
        description: "Bem-vindo! Sua senha foi definida com sucesso.",
      });

      const destination =
        user?.role === "EMPLOYEE"
          ? "/dashboard-funcionario"
          : "/dashboard-empresa";
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      const message =
        typeof data === "string"
          ? data
          : (data as { message?: string })?.message;
      toaster.error({
        title: "Erro ao criar senha",
        description: message ?? "Tente novamente.",
      });
    } finally {
      setFirstAccessLoading(false);
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

                    <Text
                      as="button"
                      type="button"
                      onClick={() => {
                        setMode("forgot");
                        setForgotEmail(email);
                      }}
                      fontSize="sm"
                      color="blue.400"
                      _hover={{ color: "blue.300", textDecoration: "underline" }}
                      cursor="pointer"
                    >
                      Esqueceu a senha?
                    </Text>
                  </Flex>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={loading}
                    w="full"
                    py="10px"
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

            {/* ── FIRST ACCESS (PRIMEIRO ACESSO) FORM ── */}
            {mode === "firstAccess" && (
              <form onSubmit={handleFirstAccessSubmit} style={{ width: "100%" }}>
                <Flex direction="column" gap={6}>
                  <Box>
                    <Heading
                      as="h3"
                      fontSize="xl"
                      fontWeight="semibold"
                      color="white"
                      mb={2}
                    >
                      Bem-vindo{user?.name ? `, ${user.name.split(" ")[0]}` : ""}!
                    </Heading>
                    <Text fontSize="sm" color="whiteAlpha.700">
                      Você entrou com uma senha temporária. Crie uma nova senha
                      pessoal para continuar.
                    </Text>
                  </Box>

                  {/* Nova Senha */}
                  <Box>
                    <Text {...fieldLabelStyle}>Nova Senha</Text>
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
                        type={showFirstPassword ? "text" : "password"}
                        id="firstPassword"
                        autocomplete="new-password"
                        {...inputStyle}
                        pr={12}
                        value={firstPassword}
                        onChange={(e) => setFirstPassword(e.target.value)}
                        placeholder="Crie uma senha forte"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFirstPassword((v) => !v)}
                        color="whiteAlpha.600"
                        _hover={{ color: "white", bg: "transparent" }}
                        position="absolute"
                        insetY={0}
                        right={0}
                        minW="36px"
                      >
                        {showFirstPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </Button>
                    </Box>

                    {/* Requirements Feedback */}
                    {firstPassword && (() => {
                      const criteria = validatePassword(firstPassword).criteria;
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

                  {/* Confirmar Nova Senha */}
                  <Box>
                    <Text {...fieldLabelStyle}>Confirmar Nova Senha</Text>
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
                        type={showFirstConfirmPassword ? "text" : "password"}
                        id="firstConfirmPassword"
                        autocomplete="new-password"
                        {...inputStyle}
                        pr={12}
                        value={firstConfirmPassword}
                        onChange={(e) => setFirstConfirmPassword(e.target.value)}
                        placeholder="Confirme a nova senha"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowFirstConfirmPassword((v) => !v)}
                        color="whiteAlpha.600"
                        _hover={{ color: "white", bg: "transparent" }}
                        position="absolute"
                        insetY={0}
                        right={0}
                        minW="36px"
                      >
                        {showFirstConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </Button>
                    </Box>
                    {firstConfirmPassword.length > 0 &&
                      firstPassword !== firstConfirmPassword && (
                        <Text fontSize="xs" color="red.300" mt={1}>
                          As senhas não coincidem.
                        </Text>
                      )}
                  </Box>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={firstAccessLoading}
                    w="full"
                    py="10px"
                    borderRadius="lg"
                    fontWeight="semibold"
                    color="white"
                    bg="purple.900"
                    cursor={firstAccessLoading ? "not-allowed" : "pointer"}
                    boxShadow={firstAccessLoading ? undefined : "lg"}
                    _hover={
                      firstAccessLoading
                        ? undefined
                        : {
                            bgGradient: "linear(to-r, black, purple.900)",
                            boxShadow: "xl",
                          }
                    }
                  >
                    <Flex align="center" justify="center" gap={2}>
                      {firstAccessLoading ? (
                        <>
                          <Spinner size="sm" color="white" />
                          <Text>Salvando...</Text>
                        </>
                      ) : (
                        <Text>Criar senha e entrar</Text>
                      )}
                    </Flex>
                  </Button>
                </Flex>
              </form>
            )}

            {/* ── FORGOT PASSWORD FORM ── */}
            {mode === "forgot" && (
              <form onSubmit={handleForgotSubmit} style={{ width: "100%" }}>
                <Flex direction="column" gap={6}>
                  <Box>
                    <Heading as="h3" fontSize="xl" fontWeight="semibold" color="white" mb={2}>
                      Recuperação de Senha
                    </Heading>
                    <Text fontSize="sm" color="whiteAlpha.700">
                      Digite seu e-mail para receber um código de redefinição de 6 dígitos.
                    </Text>
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
                        id="forgotEmail"
                        {...inputStyle}
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Insira seu e-mail"
                        required
                      />
                    </Box>
                  </Box>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={forgotLoading}
                    w="full"
                    py="10px"
                    borderRadius="lg"
                    fontWeight="semibold"
                    color="white"
                    bg="purple.900"
                    cursor={forgotLoading ? "not-allowed" : "pointer"}
                    _hover={
                      forgotLoading
                        ? undefined
                        : {
                            bgGradient: "linear(to-r, black, purple.900)",
                            boxShadow: "xl",
                          }
                    }
                  >
                    <Flex align="center" justify="center" gap={2}>
                      {forgotLoading ? (
                        <>
                          <Spinner size="sm" color="white" />
                          <Text>Enviando...</Text>
                        </>
                      ) : (
                        <>
                          <Text>Enviar Código</Text>
                          <ArrowRight size={18} />
                        </>
                      )}
                    </Flex>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setMode("login")}
                    color="white"
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    Voltar para o Login
                  </Button>
                </Flex>
              </form>
            )}

            {/* ── RESET PASSWORD FORM ── */}
            {mode === "reset" && (
              <form onSubmit={handleResetSubmit} style={{ width: "100%" }}>
                <Flex direction="column" gap={6}>
                  <Box>
                    <Heading as="h3" fontSize="xl" fontWeight="semibold" color="white" mb={2}>
                      Redefinir Senha
                    </Heading>
                    <Text fontSize="sm" color="whiteAlpha.700">
                      Insira o código de 6 dígitos enviado para seu e-mail e escolha uma nova senha.
                    </Text>
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
                        id="resetEmail"
                        {...inputStyle}
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="Confirmar e-mail"
                        required
                      />
                    </Box>
                  </Box>

                  {/* Código */}
                  <Box>
                    <Text {...fieldLabelStyle}>Código de Verificação</Text>
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
                        id="resetCode"
                        {...inputStyle}
                        value={resetCode}
                        onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        maxLength={6}
                        required
                      />
                    </Box>
                  </Box>

                  {/* Nova Senha */}
                  <Box>
                    <Text {...fieldLabelStyle}>Nova Senha</Text>
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
                        type={showResetPassword ? "text" : "password"}
                        id="resetNewPassword"
                        {...inputStyle}
                        pr={12}
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Nova senha"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowResetPassword((v) => !v)}
                        color="whiteAlpha.600"
                        _hover={{ color: "white", bg: "transparent" }}
                        position="absolute"
                        insetY={0}
                        right={0}
                        minW="36px"
                      >
                        {showResetPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </Button>
                    </Box>

                    {/* Requirements Feedback */}
                    {resetNewPassword && (() => {
                      const criteria = validatePassword(resetNewPassword).criteria;
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

                  {/* Confirmar Nova Senha */}
                  <Box>
                    <Text {...fieldLabelStyle}>Confirmar Nova Senha</Text>
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
                        type={showResetConfirmPassword ? "text" : "password"}
                        id="resetConfirmPassword"
                        {...inputStyle}
                        pr={12}
                        value={resetConfirmPassword}
                        onChange={(e) => setResetConfirmPassword(e.target.value)}
                        placeholder="Confirme a nova senha"
                        required
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowResetConfirmPassword((v) => !v)}
                        color="whiteAlpha.600"
                        _hover={{ color: "white", bg: "transparent" }}
                        position="absolute"
                        insetY={0}
                        right={0}
                        minW="36px"
                      >
                        {showResetConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </Button>
                    </Box>
                  </Box>

                  {/* Submit */}
                  <Button
                    type="submit"
                    disabled={resetLoading}
                    w="full"
                    py="10px"
                    borderRadius="lg"
                    fontWeight="semibold"
                    color="white"
                    bg="purple.900"
                    cursor={resetLoading ? "not-allowed" : "pointer"}
                    _hover={
                      resetLoading
                        ? undefined
                        : {
                            bgGradient: "linear(to-r, black, purple.900)",
                            boxShadow: "xl",
                          }
                    }
                  >
                    <Flex align="center" justify="center" gap={2}>
                      {resetLoading ? (
                        <>
                          <Spinner size="sm" color="white" />
                          <Text>Redefinindo...</Text>
                        </>
                      ) : (
                        <Text>Redefinir Senha</Text>
                      )}
                    </Flex>
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setMode("login")}
                    color="white"
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    Cancelar
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

                  {/* CPF */}
                  <Box>
                    <Text {...fieldLabelStyle}>CPF do Administrador</Text>
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
                        id="registerCpf"
                        autocomplete="off"
                        {...inputStyle}
                        value={registerCpf}
                        onChange={(e) => setRegisterCpf(maskCpf(e.target.value))}
                        placeholder="000.000.000-00"
                        maxLength={14}
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
                    py="10px"
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
              {mode === "login" && (
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
              )}
              {mode === "register" && (
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
              {mode === "forgot" && (
                <>
                  <Text fontSize="sm" color="white">
                    Lembrou da senha?{" "}
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
              {mode === "reset" && (
                <>
                  <Text fontSize="sm" color="white">
                    Não recebeu o código?{" "}
                  </Text>
                  <Text
                    as="button"
                    onClick={() => setMode("forgot")}
                    color="blue.500"
                    textDecoration="underline"
                    cursor="pointer"
                  >
                    Reenviar código
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
