import { useEffect, useRef, useState } from "react";
import {
  Box,
  Avatar,
  Button,
  DialogBackdrop,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogPositioner,
  DialogRoot,
  DialogTitle,
  Flex,
  Icon,
  IconButton,
  Menu,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { Edit3, ExternalLink, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { toaster } from "../ui/toaster";

const AVATAR_STORAGE_KEY = "deltafour.user.avatar";

export default function UserProfileMenu() {
  const { user, logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
  const [draftAvatar, setDraftAvatar] = useState<string | null>(null);
  const [draftFileName, setDraftFileName] = useState<string | null>(null);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  useEffect(() => {
    const storedAvatar = localStorage.getItem(AVATAR_STORAGE_KEY);
    if (storedAvatar) {
      setAvatarSrc(storedAvatar);
    }
  }, []);

  const handleOpenModal = () => {
    setDraftAvatar(avatarSrc);
    setDraftFileName(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toaster.error({
        title: "Arquivo inválido",
        description: "Selecione uma imagem válida.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toaster.error({
        title: "Arquivo muito grande",
        description: "A imagem deve ter no máximo 2MB.",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setDraftAvatar(String(reader.result ?? ""));
      setDraftFileName(file.name);
    };
    reader.onerror = () => {
      toaster.error({
        title: "Erro ao carregar imagem",
        description: "Não foi possível ler o arquivo.",
      });
      event.target.value = "";
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftAvatar(null);
    setDraftFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSaveAvatar = () => {
    if (draftAvatar) {
      localStorage.setItem(AVATAR_STORAGE_KEY, draftAvatar);
    } else {
      localStorage.removeItem(AVATAR_STORAGE_KEY);
    }
    setAvatarSrc(draftAvatar);
    setIsModalOpen(false);
  };

  const displayName = user?.name || "Usuário";
  const displayEmail = user?.email || "Sem e-mail";

  return (
    <Box>
      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.7); }
          to   { opacity: 1; transform: scale(1); }
        }

        .avatar-wrapper {
          position: relative;
          width: 80px;
          height: 80px;
          cursor: pointer;
          border-radius: 50%;
        }

        .avatar-wrapper::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea, #764ba2);
          opacity: 0;
          transition: opacity 0.25s ease;
          z-index: 0;
        }

        .avatar-wrapper:hover::before {
          opacity: 1;
        }

        .avatar-inner {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          overflow: hidden;
          z-index: 1;
          border: 2.5px solid white;
        }

        .avatar-overlay {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          transition: background 0.25s ease;
        }

        .avatar-wrapper:hover .avatar-overlay {
          background: rgba(0, 0, 0, 0.48);
          backdrop-filter: blur(1.5px);
        }

        .avatar-overlay-icon {
          color: white;
          opacity: 0;
          transform: scale(0.75);
          transition: opacity 0.2s ease, transform 0.2s ease;
        }

        .avatar-wrapper:hover .avatar-overlay-icon {
          opacity: 1;
          transform: scale(1);
        }

        .avatar-delete-btn {
          position: absolute;
          top: -5px;
          right: -5px;
          z-index: 3;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: white;
          border: 1.5px solid #fed7d7;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          animation: fadeScaleIn 0.2s ease forwards;
          transition: background 0.15s ease, border-color 0.15s ease, transform 0.15s ease;
        }

        .avatar-delete-btn:hover {
          background: #fff5f5;
          border-color: #fc8181;
          transform: scale(1.15);
        }

        .avatar-delete-btn svg {
          color: #e53e3e;
          width: 11px;
          height: 11px;
        }
      `}</style>

      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton variant="ghost" aria-label="Abrir menu do usuário">
            <Avatar.Root size="sm">
              {avatarSrc && <Avatar.Image src={avatarSrc} alt={displayName} />}
              <Avatar.Fallback name={displayName} />
            </Avatar.Root>
          </IconButton>
        </Menu.Trigger>

        <Menu.Positioner>
          <Menu.Content minW="210px" p="0.75rem">
            <Flex px="3" py="2" align="center" gap="3" cursor="normal">
              <Avatar.Root size="sm">
                {avatarSrc && (
                  <Avatar.Image src={avatarSrc} alt={displayName} />
                )}
                <Avatar.Fallback name={displayName} />
              </Avatar.Root>
              <Box>
                <Text fontWeight="bold">{displayName}</Text>
                <Text fontSize="sm" color="gray.500">
                  {displayEmail}
                </Text>
              </Box>
            </Flex>

            <Menu.Separator />

            <Menu.Item
              value="edit-profile"
              cursor="pointer"
              onClick={handleOpenModal}
            >
              <Flex align="center" gap="2" p="3px">
                <Icon as={Edit3} boxSize="4" />
                <Text>Editar perfil</Text>
              </Flex>
            </Menu.Item>

            <Menu.Separator />

            <Menu.Item
              value="logout"
              color="red.500"
              onClick={handleLogout}
              p="3px"
              cursor="pointer"
            >
              <Flex align="center" gap="2">
                <Icon as={ExternalLink} boxSize="4" />
                <Text>Sair</Text>
              </Flex>
            </Menu.Item>
          </Menu.Content>
        </Menu.Positioner>
      </Menu.Root>

      <DialogRoot
        open={isModalOpen}
        onOpenChange={(details) => {
          if (!details.open) handleCloseModal();
        }}
        placement="center"
      >
        <Portal>
          <DialogBackdrop bg="blackAlpha.600" />
          <DialogPositioner>
            <DialogContent
              w="520px"
              h="350px"
              borderRadius="16px"
              boxShadow="lg"
            >
              <DialogHeader px={6} pt={5} pb={3}>
                <DialogTitle
                  fontSize="lg"
                  fontWeight="semibold"
                  color="gray.700"
                >
                  Editar perfil
                </DialogTitle>
              </DialogHeader>

              <DialogBody px={6} pb={4}>
                <VStack align="stretch" gap={4}>
                  <Flex align="center" gap={4}>
                    <div
                      className="avatar-wrapper"
                      onClick={() => fileInputRef.current?.click()}
                      onMouseEnter={() => setIsHoveringAvatar(true)}
                      onMouseLeave={() => setIsHoveringAvatar(false)}
                    >
                      <div className="avatar-inner">
                        <Avatar.Root w="80px" h="80px" borderRadius="full">
                          {draftAvatar && (
                            <Avatar.Image src={draftAvatar} alt={displayName} />
                          )}
                          <Avatar.Fallback name={displayName} />
                        </Avatar.Root>
                      </div>
                      <div className="avatar-overlay">
                        <span className="avatar-overlay-icon">
                          {draftAvatar ? (
                            <Edit3 size={20} strokeWidth={2} />
                          ) : (
                            <Plus size={22} strokeWidth={2.5} />
                          )}
                        </span>
                      </div>
                      {draftAvatar && (
                        <button
                          className="avatar-delete-btn"
                          onClick={handleRemoveAvatar}
                          aria-label="Remover foto"
                        >
                          <Trash2 />
                        </button>
                      )}
                    </div>

                    <Box flex={1}>
                      <Text fontWeight="medium">{displayName}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {displayEmail}
                      </Text>
                      {draftFileName && (
                        <Text fontSize="xs" color="gray.400" mt={1}>
                          {draftFileName}
                        </Text>
                      )}
                    </Box>
                  </Flex>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                  />
                </VStack>
              </DialogBody>

              <DialogFooter px={6} pb={5} justifyContent="flex-end">
                <Flex gap={3}>
                  <Button
                    variant="ghost"
                    onClick={handleCloseModal}
                    w="120px"
                    h="32px"
                    p="10px"
                    borderRadius="full"
                  >
                    Cancelar
                  </Button>
                  <Button
                    bg="primary.500"
                    onClick={handleSaveAvatar}
                    w="150px"
                    h="32px"
                    p="10px"
                    borderRadius="full"
                  >
                    Salvar
                  </Button>
                </Flex>
              </DialogFooter>
            </DialogContent>
          </DialogPositioner>
        </Portal>
      </DialogRoot>
    </Box>
  );
}
