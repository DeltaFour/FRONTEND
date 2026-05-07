import {
	Box,
	Flex,
	Portal,
	Text,
	Toast,
	Toaster,
	createToaster,
} from "@chakra-ui/react";
import { AlertTriangle, CheckCircle, Info, X, XCircle } from "lucide-react";

const variants = {
	info: {
		iconBg: "#dbeafe",
		iconColor: "#2563eb",
		titleColor: "#1e40af",
		barColor: "#3b82f6",
	},
	warning: {
		iconBg: "#fef3c7",
		iconColor: "#d97706",
		titleColor: "#92400e",
		barColor: "#f59e0b",
	},
	error: {
		iconBg: "#fee2e2",
		iconColor: "#dc2626",
		titleColor: "#991b1b",
		barColor: "#ef4444",
	},
	success: {
		iconBg: "#dcfce7",
		iconColor: "#16a34a",
		titleColor: "#14532d",
		barColor: "#22c55e",
	},
} as const;

export const toaster = createToaster({
	placement: "top-end",
	pauseOnPageIdle: true,
});

export const AppToaster = () => {
	return (
		<Portal>
			<style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(24px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }

        [data-scope="toast"][data-part="root"] {
          animation: toastSlideIn 0.22s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

			<Toaster toaster={toaster}>
				{(toast) => {
					const type = (toast.type || "info") as keyof typeof variants;
					const variant = variants[type] ?? variants.info;
					const IconComponent =
						type === "warning"
							? AlertTriangle
							: type === "error"
								? XCircle
								: type === "success"
									? CheckCircle
									: Info;

					return (
						<Toast.Root
							w="340px"
							minH="70px"
							borderRadius="10px"
							boxSizing="border-box"
							p="12px 14px 12px 0"
							bg="white"
							boxShadow="0 4px 6px -1px rgba(0,0,0,0.07), 0 10px 30px -5px rgba(0,0,0,0.1)"
							border="1px solid rgba(0,0,0,0.06)"
							position="relative"
							overflow="hidden"
							display="flex"
							alignItems="center"
							gap="12px"
						>
							{/* Barra lateral colorida */}
							<Box
								position="absolute"
								left={0}
								top={0}
								bottom={0}
								w="4px"
								bg={variant.barColor}
								borderRadius="10px 0 0 10px"
							/>

							{/* Ícone */}
							<Flex
								w="34px"
								h="34px"
								flexShrink={0}
								align="center"
								justify="center"
								bg={variant.iconBg}
								borderRadius="8px"
								ml="18px"
								color={variant.iconColor}
							>
								<Box as={IconComponent} size={16} />
							</Flex>

							{/* Textos */}
							<Box flex="1" minW={0}>
								{toast.title && (
									<Text
										color={variant.titleColor}
										fontSize="14px"
										fontWeight="600"
										lineHeight="1.3"
										noOfLines={1}
									>
										{toast.title}
									</Text>
								)}
								{toast.description && (
									<Text
										fontSize="13px"
										color="#6b7280"
										lineHeight="1.4"
										mt={toast.title ? "2px" : 0}
										noOfLines={2}
									>
										{toast.description}
									</Text>
								)}
							</Box>

							{/* Botão fechar */}
							<Toast.CloseTrigger asChild>
								<Flex
									w="24px"
									h="24px"
									flexShrink={0}
									align="center"
									justify="center"
									color="#9ca3af"
									cursor="pointer"
									borderRadius="6px"
									mr="2px"
									transition="all 0.15s ease"
									_hover={{ color: "#374151", bg: "#f3f4f6" }}
								>
									<Box as={X} size={12} />
								</Flex>
							</Toast.CloseTrigger>
						</Toast.Root>
					);
				}}
			</Toaster>
		</Portal>
	);
};
