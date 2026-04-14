import { useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Flex,
  Heading,
  Input,
  Spinner,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaSave } from "react-icons/fa";
import api from "../../services/api";

interface CreateCompanyFormData {
  nome: string;
  cnpj: string;
  emailAdmin: string;
  nameAdmin: string;
  senhaAdmin: string;
}

const CriarEmpresa = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CreateCompanyFormData>({
    nome: "",
    cnpj: "",
    emailAdmin: "",
    nameAdmin: "",
    senhaAdmin: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    const payload = {
      name: formData.nome,
      cnpj: formData.cnpj,
      Employee: {
        email: formData.emailAdmin,
        name: formData.nameAdmin,
        password: formData.senhaAdmin,
      },
    };

    try {
      await api.post("/super-admin/company", payload);

      setSuccess(`Empresa "${formData.nome}" criada com sucesso!`);

      setTimeout(() => {
        navigate("/dashboard-admin/empresas", { replace: true });
      }, 1500);
    } catch (err: unknown) {
      const errorData = (
        err as {
          response?: {
            data?: { errors?: Record<string, string[]>; message?: string };
          };
        }
      )?.response?.data;

      let message = "Ocorreu um erro ao criar a empresa. Verifique os dados.";

      if (errorData?.errors) {
        const validationErrors = Object.values(errorData.errors)
          .flat()
          .join(" | ");
        message = `Falha na validação: ${validationErrors}`;
      } else if (errorData) {
        message = errorData.message || message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="xl" maxW="2xl" mx="auto">
      <Heading size="lg" color="gray.700" mb={6} borderBottomWidth="1px" pb={3}>
        Cadastrar Nova Empresa
      </Heading>

      {success && (
        <Box
          bg="green.50"
          borderWidth="1px"
          borderColor="green.300"
          color="green.700"
          p={3}
          borderRadius="md"
          mb={4}
        >
          <Text>{success}</Text>
        </Box>
      )}

      {error && (
        <Box
          bg="red.50"
          borderWidth="1px"
          borderColor="red.300"
          color="red.700"
          p={3}
          borderRadius="md"
          mb={4}
        >
          <Text fontWeight="bold">Erro:</Text>
          <Text>{error}</Text>
        </Box>
      )}

      <Box as="form" onSubmit={handleSubmit}>
        <VStack align="stretch" gap={5}>
          <Heading
            size="md"
            color="gray.600"
            pt={2}
            borderTopWidth="1px"
            mt={2}
          >
            Dados da Empresa
          </Heading>

          <Box>
            <Text mb={1} fontWeight="medium" color="gray.700">
              Nome da Empresa
            </Text>
            <Input
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </Box>

          <Box>
            <Text mb={1} fontWeight="medium" color="gray.700">
              CNPJ
            </Text>
            <Input
              name="cnpj"
              value={formData.cnpj}
              onChange={handleChange}
              required
            />
          </Box>

          <Heading
            size="md"
            color="gray.600"
            pt={2}
            borderTopWidth="1px"
            mt={2}
          >
            Dados do Administrador Inicial
          </Heading>

          <Box>
            <Text mb={1} fontWeight="medium" color="gray.700">
              Nome Completo do Admin
            </Text>
            <Input
              name="nameAdmin"
              value={formData.nameAdmin}
              onChange={handleChange}
              required
            />
          </Box>

          <Box>
            <Text mb={1} fontWeight="medium" color="gray.700">
              E-mail do Administrador
            </Text>
            <Input
              type="email"
              name="emailAdmin"
              value={formData.emailAdmin}
              onChange={handleChange}
              required
            />
          </Box>

          <Box>
            <Text mb={1} fontWeight="medium" color="gray.700">
              Senha Temporária
            </Text>
            <Input
              type="password"
              name="senhaAdmin"
              value={formData.senhaAdmin}
              onChange={handleChange}
              required
            />
          </Box>

          <Flex justify="flex-end" pt={2}>
            <Button
              type="submit"
              colorPalette="blue"
              disabled={loading}
              minW="220px"
            >
              {loading ? (
                <>
                  <Spinner size="sm" mr={2} />
                  Cadastrando...
                </>
              ) : (
                <>
                  <FaSave style={{ marginRight: 8 }} />
                  Cadastrar Empresa
                </>
              )}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

export default CriarEmpresa;
