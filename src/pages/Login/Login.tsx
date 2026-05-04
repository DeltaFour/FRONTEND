import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, Clock, ArrowRight } from "lucide-react";
import {
  Box,
  Button,
  Flex,
  Heading,
  Image,
  Input,
  Spinner,
  Text,
} from "@chakra-ui/react";
import { useAuth } from "../../context/AuthContext";
import LogoHorizontal from "../../assets/LogoHorizontal.png";
import DarkVeil from "../../components/background/background";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    const userData = await login(email, password);
    setLoading(false);

    if (!userData) {
      setError(
        "Não foi possível realizar o login. Verifique seu e-mail e senha.",
      );
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

    setError(`Perfil desconhecido: ${roleSuffix}. Consulte o backend.`);
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
                Entre com suas credenciais para acessar o sistema
              </Text>
            </Box>

            <form onSubmit={handleSubmit} style={{ width: "100%" }}>
              <Flex direction="column" gap={6}>
                {error && (
                  <Flex
                    p={4}
                    bg="red.50"
                    borderWidth="1px"
                    borderColor="red.200"
                    borderRadius="lg"
                    align="flex-start"
                    gap={3}
                  >
                    <Flex
                      w={5}
                      h={5}
                      bg="red.500"
                      borderRadius="full"
                      align="center"
                      justify="center"
                      flexShrink={0}
                      mt={0.5}
                    >
                      <Text fontSize="xs" fontWeight="bold" color="white">
                        !
                      </Text>
                    </Flex>
                    <Text fontSize="sm" color="red.700" flex="1">
                      {error}
                    </Text>
                  </Flex>
                )}

                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="white">
                    E-mail
                  </Text>
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
                      border="none"
                      borderBottom="1px solid white"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      pl="3rem"
                      pr={4}
                      py={3}
                      bg="transparent"
                      placeholder="Insira seu e-mail"
                      required
                    />
                  </Box>
                </Box>

                <Box>
                  <Text fontSize="sm" fontWeight="semibold" color="white">
                    Senha
                  </Text>
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
                      onChange={(event) => setPassword(event.target.value)}
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
                      onClick={() => setShowPassword((value) => !value)}
                      color="gray.500"
                      _hover={{ color: "white", bg: "transparent" }}
                      position="absolute"
                      insetY={0}
                      right={0}
                      minW="36px"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </Button>
                  </Box>
                </Box>

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
                      onChange={(event) => setRememberMe(event.target.checked)}
                      style={{ width: 16, height: 16 }}
                    />
                    <Text fontSize="sm" color="white">
                      Lembrar-me
                    </Text>
                  </label>
                </Flex>

                <Button
                  type="submit"
                  disabled={loading}
                  w="full"
                  py={3}
                  borderRadius="lg"
                  fontWeight="semibold"
                  color="white"
                  bgGradient={
                    loading ? undefined : "linear(to-r, black, purple.900)"
                  }
                  bg={loading ? "purple.900" : undefined}
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
                        <ArrowRight size={20} />
                      </>
                    )}
                  </Flex>
                </Button>
              </Flex>
            </form>

            <Box
              mt={8}
              pt={6}
              borderTopWidth="1px"
              borderColor="gray.200"
              textAlign="center"
              w="full"
              flexDir="column"
            >
              <Text fontSize="sm" color="white">
                Não tem uma conta?{" "}
              </Text>
              <Text as="span" fontWeight="semibold" color="blue.700">
                Entre em contato com o administrador
              </Text>
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
