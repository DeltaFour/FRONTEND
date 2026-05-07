import {
	useCallback,
	useEffect,
	useState,
	type ChangeEvent,
	type FormEvent,
} from "react";
import {
	Box,
	Button,
	Flex,
	Heading,
	IconButton,
	MenuContent,
	MenuItem,
	MenuPositioner,
	MenuRoot,
	MenuTrigger,
	Portal,
	Spinner,
	Text,
	VStack,
} from "@chakra-ui/react";
import {
	FaClock,
	FaEdit,
	FaEllipsisV,
	FaPlus,
	FaSave,
	FaTimes,
	FaTrash,
} from "react-icons/fa";
import api from "../../services/api";
import { Input } from "../../components/ui/Input";
import { ConfirmDeleteModal } from "../../components/Modal/ConfirmDeleteModal";
import { toaster } from "../../components/ui/toaster";

interface ShiftListItem {
	id: number;
	workShiftType: string;
	startTime: string;
	endTime: string;
	workShiftToleranceMinutes: number;
}

interface ShiftFormData {
	id?: number;
	workShiftType: string;
	startTime: string;
	endTime: string;
	workShiftToleranceMinutes: number;
}

const initialShiftForm: ShiftFormData = {
	workShiftType: "",
	startTime: "08:00:00",
	endTime: "17:00:00",
	workShiftToleranceMinutes: 15,
};

export const GerenciarTurnos = () => {
	const [shifts, setShifts] = useState<ShiftListItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [formData, setFormData] = useState<ShiftFormData>(initialShiftForm);
	const [isEditing, setIsEditing] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [shiftToDelete, setShiftToDelete] = useState<ShiftListItem | null>(
		null,
	);
	const [isDeleting, setIsDeleting] = useState(false);

	const fetchShifts = useCallback(async () => {
		try {
			setLoading(true);

			const response = await api.get("/workshift/list");
			const raw = (response.data?.data ?? response.data) as any[];

			const formatted: ShiftListItem[] = raw.map((shift) => ({
				id: shift.id,
				workShiftType: shift.shiftType,
				startTime: String(shift.startTime).slice(0, 8),
				endTime: String(shift.endTime).slice(0, 8),
				workShiftToleranceMinutes: Number(shift.toleranceMinutes ?? 0),
			}));

			setShifts(formatted);
		} catch {
			const description = "Não foi possível carregar a lista de turnos.";

			toaster.error({
				title: "Erro ao carregar turnos",
				description,
			});
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchShifts();
	}, [fetchShifts]);

	const handleChange = (
		event: ChangeEvent<HTMLInputElement | HTMLSelectElement>,
	) => {
		const { name, value } = event.target;
		setFormData((prev) => ({
			...prev,
			[name]: name === "workShiftToleranceMinutes" ? Number(value) : value,
		}));
	};

	const openModal = (shift?: ShiftListItem) => {
		if (shift) {
			setIsEditing(true);
			setFormData({
				id: shift.id,
				workShiftType: shift.workShiftType,
				startTime: shift.startTime,
				endTime: shift.endTime,
				workShiftToleranceMinutes: shift.workShiftToleranceMinutes,
			});
		} else {
			setIsEditing(false);
			setFormData(initialShiftForm);
		}
		setIsModalOpen(true);
	};

	const closeModal = () => {
		setIsModalOpen(false);
		setFormData(initialShiftForm);
		setIsEditing(false);
	};

	const handleSave = async (event: FormEvent<HTMLDivElement>) => {
		event.preventDefault();
		setSubmitting(true);

		const payload: Record<string, unknown> = {
			shiftType: formData.workShiftType,
			startTime: formData.startTime.includes(":")
				? formData.startTime
				: `${formData.startTime}:00`,
			endTime: formData.endTime.includes(":")
				? formData.endTime
				: `${formData.endTime}:00`,
			toleranceMinutes: Number(formData.workShiftToleranceMinutes),
		};

		if (isEditing && formData.id != null) {
			payload.id = formData.id;
		}

		const endpoint = isEditing ? "/workshift/update" : "/workshift/create";
		const method = isEditing ? api.patch : api.post;

		try {
			await method(endpoint, payload);
			toaster.success({
				title: "Turno salvo",
				description: `Turno ${isEditing ? "atualizado" : "criado"} com sucesso!`,
			});
			closeModal();
			void fetchShifts();
		} catch (err: unknown) {
			const errorData = (err as { response?: { data?: { message?: string } } })
				.response?.data;
			const description = `Erro ao salvar: ${
				errorData?.message ?? "Verifique os dados informados."
			}`;

			toaster.error({
				title: "Erro ao salvar turno",
				description,
			});
		} finally {
			setSubmitting(false);
		}
	};

	const openDeleteModal = (shift: ShiftListItem) => {
		setShiftToDelete(shift);
	};

	const closeDeleteModal = () => {
		if (isDeleting) {
			return;
		}
		setShiftToDelete(null);
	};

	const handleConfirmDelete = async () => {
		if (!shiftToDelete) {
			return;
		}

		try {
			setIsDeleting(true);
			await api.delete(`/workshift/change-status/${shiftToDelete.id}`);
			toaster.success({
				title: "Turno excluído",
				description: `Turno "${shiftToDelete.workShiftType}" excluído com sucesso!`,
			});
			setShiftToDelete(null);
			void fetchShifts();
		} catch {
			toaster.error({
				title: "Erro ao excluir turno",
				description: "Não foi possível excluir o turno selecionado.",
			});
		} finally {
			setIsDeleting(false);
		}
	};

	if (loading) {
		return (
			<Flex justify="center" align="center" py={10}>
				<Spinner mr={3} />
				<Text>Carregando jornadas de trabalho...</Text>
			</Flex>
		);
	}

	return (
		<Box bg="white" p={6} borderRadius="lg" boxShadow="xl">
			<Flex
				justify="space-between"
				align="center"
				mb={6}
				pb={3}
				borderBottomWidth="1px"
			>
				<Text fontSize="lg" fontWeight="semibold" color="gray.700">
					Lista de turnos
				</Text>
				<Button
					colorPalette="green"
					onClick={() => openModal()}
					display="flex"
					p="10px"
					alignItems="center"
					gap={2}
				>
					<FaPlus /> Novo Turno
				</Button>
			</Flex>

			{shifts.length === 0 ? (
				<Box
					mt={4}
					p={4}
					textAlign="center"
					color="gray.500"
					bg="gray.50"
					borderRadius="lg"
				>
					Nenhuma jornada de trabalho cadastrada.
				</Box>
			) : (
				<Box overflowX="auto" borderWidth="1px" borderRadius="lg">
					<Box as="table" w="full" borderCollapse="collapse">
						<Box as="thead" bg="gray.50">
							<Box as="tr">
								<Box
									as="th"
									textAlign="left"
									px={6}
									py={3}
									fontSize="xs"
									color="gray.500"
									textTransform="uppercase"
									letterSpacing="wide"
								>
									Nome do Turno
								</Box>
								<Box
									as="th"
									textAlign="left"
									px={6}
									py={3}
									fontSize="xs"
									color="gray.500"
									textTransform="uppercase"
									letterSpacing="wide"
								>
									Início
								</Box>
								<Box
									as="th"
									textAlign="left"
									px={6}
									py={3}
									fontSize="xs"
									color="gray.500"
									textTransform="uppercase"
									letterSpacing="wide"
								>
									Fim
								</Box>
								<Box
									as="th"
									textAlign="left"
									px={6}
									py={3}
									fontSize="xs"
									color="gray.500"
									textTransform="uppercase"
									letterSpacing="wide"
								>
									Tolerância (min)
								</Box>
								<Box
									as="th"
									textAlign="right"
									px={6}
									py={3}
									fontSize="xs"
									color="gray.500"
									textTransform="uppercase"
									letterSpacing="wide"
								>
									Ações
								</Box>
							</Box>
						</Box>
						<Box as="tbody" bg="white">
							{shifts.map((shift) => (
								<Box as="tr" key={shift.id} borderTopWidth="1px">
									<Box
										as="td"
										px={6}
										py={4}
										whiteSpace="nowrap"
										fontSize="sm"
										fontWeight="semibold"
										color="gray.800"
									>
										{shift.workShiftType}
									</Box>
									<Box
										as="td"
										px={6}
										py={4}
										whiteSpace="nowrap"
										fontSize="sm"
										color="gray.600"
									>
										{shift.startTime}
									</Box>
									<Box
										as="td"
										px={6}
										py={4}
										whiteSpace="nowrap"
										fontSize="sm"
										color="gray.600"
									>
										{shift.endTime}
									</Box>
									<Box
										as="td"
										px={6}
										py={4}
										whiteSpace="nowrap"
										fontSize="sm"
										color="gray.600"
									>
										{shift.workShiftToleranceMinutes}
									</Box>
									<Box as="td" px={6} py={4} textAlign="right">
										<Flex justify="flex-end">
											<MenuRoot
												positioning={{
													placement: "top-end",
													strategy: "fixed",
												}}
											>
												<MenuTrigger asChild>
													<IconButton
														aria-label={`Ações para ${shift.workShiftType}`}
														variant="ghost"
														size="sm"
													>
														<FaEllipsisV />
													</IconButton>
												</MenuTrigger>
												<Portal>
													<MenuPositioner>
														<MenuContent>
															<MenuItem
																p="10px"
																value={`editar-${shift.id}`}
																onSelect={() => openModal(shift)}
															>
																<FaEdit style={{ marginRight: 8 }} /> Editar
															</MenuItem>
															<MenuItem
																p="10px"
																value={`excluir-${shift.id}`}
																onSelect={() => openDeleteModal(shift)}
															>
																<FaTrash style={{ marginRight: 8 }} /> Excluir
															</MenuItem>
														</MenuContent>
													</MenuPositioner>
												</Portal>
											</MenuRoot>
										</Flex>
									</Box>
								</Box>
							))}
						</Box>
					</Box>
				</Box>
			)}

			{isModalOpen && (
				<Flex
					position="fixed"
					inset={0}
					bg="blackAlpha.600"
					align="center"
					justify="center"
					zIndex={50}
				>
					<Box
						bg="white"
						p={8}
						borderRadius="lg"
						boxShadow="2xl"
						w="full"
						maxW="md"
					>
						<Flex
							justify="space-between"
							align="center"
							pb={3}
							mb={4}
							borderBottomWidth="1px"
						>
							<Heading size="md" color="gray.800">
								{isEditing ? "Editar Turno" : "Criar Novo Turno"}
							</Heading>
							<Button
								variant="ghost"
								size="sm"
								onClick={closeModal}
								color="gray.500"
								_hover={{ color: "gray.700" }}
							>
								<FaTimes />
							</Button>
						</Flex>

						<Box as="form" onSubmit={handleSave}>
							<VStack align="stretch" gap={4}>
								<Box>
									<Text mb={1} fontWeight="medium" color="gray.700">
										Tipo de Turno
									</Text>
									<select
										name="workShiftType"
										value={formData.workShiftType}
										onChange={handleChange}
										required
										style={{
											width: "100%",
											padding: "8px 12px",
											borderRadius: "0.375rem",
											border: "1px solid #E2E8F0",
											backgroundColor: "#FFFFFF",
											color: "#1A202C",
											colorScheme: "light",
										}}
									>
										<option value="">Selecione</option>
										<option value="Matutino">Matutino</option>
										<option value="Diurno">Diurno</option>
										<option value="Noturno">Noturno</option>
									</select>
								</Box>

								<Flex gap={4}>
									<Box flex={1}>
										<Text mb={1} fontWeight="medium" color="gray.700">
											Horário de Início
										</Text>
										<Input
											type="time"
											name="startTime"
											value={formData.startTime}
											onChange={handleChange}
											step="1"
											required
										/>
									</Box>
									<Box flex={1}>
										<Text mb={1} fontWeight="medium" color="gray.700">
											Horário de Fim
										</Text>
										<Input
											type="time"
											name="endTime"
											value={formData.endTime}
											onChange={handleChange}
											step="1"
											required
										/>
									</Box>
								</Flex>

								<Box>
									<Text mb={1} fontWeight="medium" color="gray.700">
										Tolerância (minutos)
									</Text>
									<Input
										type="number"
										name="workShiftToleranceMinutes"
										value={formData.workShiftToleranceMinutes}
										onChange={handleChange}
										min={0}
										required
									/>
								</Box>

								<Flex justify="flex-end" pt={4} gap={3}>
									<Button
										type="button"
										variant="outline"
										onClick={closeModal}
										disabled={submitting}
									>
										Cancelar
									</Button>
									<Button
										type="submit"
										colorPalette="indigo"
										disabled={submitting}
									>
										{submitting ? (
											<>
												<Spinner size="sm" mr={2} /> Salvar...
											</>
										) : (
											<>
												<FaSave style={{ marginRight: 6 }} /> Salvar Turno
											</>
										)}
									</Button>
								</Flex>
							</VStack>
						</Box>
					</Box>
				</Flex>
			)}

			<ConfirmDeleteModal
				isOpen={Boolean(shiftToDelete)}
				onClose={closeDeleteModal}
				onConfirm={handleConfirmDelete}
				itemName={shiftToDelete?.workShiftType}
				isLoading={isDeleting}
			/>
		</Box>
	);
};

export default GerenciarTurnos;
