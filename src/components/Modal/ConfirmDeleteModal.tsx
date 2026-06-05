import {
  Box,
  Button,
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  HStack,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useColorModeValue } from "../../theme/colorMode";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName?: string;
  isLoading?: boolean;
}

export const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  isLoading = false,
}: ConfirmDeleteModalProps) => {
  const contentBg = "surface";
  const headerBg = useColorModeValue("red.50", "red.900");
  const titleColor = useColorModeValue("red.700", "red.200");
  const textColor = "fg";
  const subTextColor = "fg.muted";
  const borderColor = "border";

  const handleOpenChange = (details: { open: boolean }) => {
    if (!details.open && !isLoading) {
      onClose();
    }
  };

  return (
    <DialogRoot
      open={isOpen}
      onOpenChange={handleOpenChange}
      placement="center"
      closeOnInteractOutside={!isLoading}
      closeOnEscape={!isLoading}
    >
      <Portal>
        <DialogBackdrop bg="blackAlpha.600" />

        <DialogPositioner>
          <DialogContent
            w={{ base: "92vw", md: "500px" }}
            maxH="85vh"
            borderRadius="15px"
            boxShadow="lg"
            px={6}
            py={4}
            bg={contentBg}
            borderWidth="1px"
            borderColor={borderColor}
          >
            <DialogHeader p={4} bg={headerBg}>
              <DialogTitle
                fontSize="lg"
                fontWeight="semibold"
                color={titleColor}
              >
                Confirmar exclusão
              </DialogTitle>
            </DialogHeader>

            <DialogBody p={4}>
              <VStack align="start" gap={2}>
                <Text fontSize="md" color={textColor}>
                  Tem certeza que deseja excluir{" "}
                  <Text as="span" fontWeight="bold" color={textColor}>
                    {itemName || "este item"}
                  </Text>
                  ?
                </Text>

                <Text fontSize="sm" color={subTextColor}>
                  Essa ação não poderá ser desfeita.
                </Text>
              </VStack>
            </DialogBody>

            <DialogFooter pt={4} justifyContent="center">
              <HStack gap={3}>
                <Button
                  variant="outline"
                  w="96px"
                  h="24px"
                  p="15px"
                  borderRadius="full"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>

                <Button
                  w="140px"
                  borderRadius="full"
                  h="24px"
                  p="15px"
                  colorPalette="red"
                  onClick={onConfirm}
                  loading={isLoading}
                >
                  Confirmar
                </Button>
              </HStack>
            </DialogFooter>
          </DialogContent>
        </DialogPositioner>
      </Portal>
    </DialogRoot>
  );
};
