import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
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
import { FaArrowLeft, FaBuilding, FaSave } from "react-icons/fa";
import api from "../../services/api";

interface EditCompanyFormData {
  name: string;
  cnpj: string;
}

const EditarEmpresa = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<EditCompanyFormData>({
    name: "",
    cnpj: "",
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!id) {
        setError("Empresa não encontrada.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await api.get(`/super-admin/company/${id}`);
        const { name, cnpj } = response.data as EditCompanyFormData;
        setFormData({ name, cnpj });
      } catch {
        setError("Empresa não encontrada ou erro ao carregar dados.");
      } finally {
        setLoading(false);
      }
    };

    fetchCompany();
  }, [id]);

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!id) {
      setError("Empresa não encontrada.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      await api.put(`/super-admin/company/${id}`, {
        name: formData.name,
        cnpj: formData.cnpj,
      });

      setSuccess(`Empresa "${formData.name}" atualizada com sucesso!`);
      setTimeout(() => {
        navigate("/dashboard-admin/empresas");
      }, 1500);
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ||
        "Ocorreu um erro ao atualizar a empresa. Verifique os dados.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Flex align="center" justify="center" py={10} gap={3}>
        <Spinner />
        <Text>Carregando dados da empresa...</Text>
      </Flex>
    );
  }

  if (error && !submitting) {
    return (
      <Box
        bg="red.50"
        color="red.700"
        p={4}
        borderRadius="md"
        maxW="2xl"
        mx="auto"
        borderWidth="1px"
        borderColor="red.300"
      >
        <Text>{error}</Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg="white" borderRadius="lg" boxShadow="xl" maxW="2xl" mx="auto">
      <Flex
        justify="space-between"
        align="center"
        mb={6}
        borderBottomWidth="1px"
        pb={3}
      >
        <Heading
          size="lg"
          color="gray.700"
          display="flex"
          alignItems="center"
          gap={2}
        >
          <FaBuilding />
          Editar Empresa
        </Heading>

        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
          <FaArrowLeft style={{ marginRight: 8 }} />
          Voltar
        </Button>
      </Flex>

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

      {error && submitting && (
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
          <Box>
            <Text mb={1} fontWeight="medium" color="gray.700">
              Nome da Empresa
            </Text>
            <Input
              name="name"
              value={formData.name}
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

          <Flex justify="flex-end" pt={2}>
            <Button
              type="submit"
              colorPalette="blue"
              disabled={submitting}
              minW="220px"
            >
              {submitting ? (
                <>
                  <Spinner size="sm" mr={2} />
                  Atualizando...
                </>
              ) : (
                <>
                  <FaSave style={{ marginRight: 8 }} />
                  Salvar Alterações
                </>
              )}
            </Button>
          </Flex>
        </VStack>
      </Box>
    </Box>
  );
};

export default EditarEmpresa;
