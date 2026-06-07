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
  HStack,
  Portal,
  Text,
  VStack,
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
  const contentBg = "surface";
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
            borderRadius="xl"
            boxShadow="2xl"
            bg={contentBg}
            borderWidth="1px"
            borderColor={borderColor}
          >
            <DialogHeader pb={3} pt={5} px={6}>
              <DialogTitle
                fontSize="lg"
                fontWeight="semibold"
                color="fg"
              >
                Confirmar exclusão
              </DialogTitle>
            </DialogHeader>

            <DialogBody px={6} py={2}>
              <VStack align="start" gap={1}>
                <Text fontSize="sm" color="fg">
                  Tem certeza que deseja excluir{" "}
                  <Text as="span" fontWeight="bold">
                    {itemName || "este item"}
                  </Text>
                  ?
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  Essa ação não poderá ser desfeita.
                </Text>
              </VStack>
            </DialogBody>

            <DialogFooter px={6} pb={5} pt={4} justifyContent="flex-end">
              <HStack gap={3}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>

                <Button
                  size="sm"
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
