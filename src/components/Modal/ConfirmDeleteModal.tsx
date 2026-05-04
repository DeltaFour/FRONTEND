import {
  Button,
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Portal,
  Text,
  VStack,
  HStack,
  Box,
} from "@chakra-ui/react";

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
            w="500px"
            height="350px"
            borderRadius="15px"
            boxShadow="lg"
            px={6}
            py={4}
          >
            <DialogHeader p={4} bg="red">
              <DialogTitle fontSize="lg" fontWeight="semibold" color="gray.700">
                Confirmar exclusão
              </DialogTitle>
            </DialogHeader>

            <DialogBody p={4}>
              <VStack align="start" gap={2}>
                <Text fontSize="md" color="gray.700">
                  Tem certeza que deseja excluir{" "}
                  <Text as="span" fontWeight="bold" color="gray.700">
                    {itemName || "este item"}
                  </Text>
                  ?
                </Text>

                <Text fontSize="sm" color="gray.500">
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
