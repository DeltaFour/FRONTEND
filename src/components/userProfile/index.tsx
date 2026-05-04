import {
  Box,
  Avatar,
  Menu,
  Text,
  Flex,
  Icon,
  IconButton,
} from "@chakra-ui/react";
import { Edit3, ExternalLink, Settings } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function UserProfileMenu() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  const displayName = user?.name || "Usuário";
  const displayEmail = user?.email || "Sem e-mail";

  return (
    <Box>
      <Menu.Root>
        <Menu.Trigger asChild>
          <IconButton variant="ghost" aria-label="Abrir menu do usuário">
            <Avatar.Root size="sm">
              <Avatar.Fallback name={displayName} />
            </Avatar.Root>
          </IconButton>
        </Menu.Trigger>

        <Menu.Positioner>
          <Menu.Content minW="210px" p="0.75rem">
            <Flex px="3" py="2" align="center" gap="3" cursor="normal">
              <Avatar.Root size="sm">
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

            <Menu.Item value="edit-profile" cursor="pointer">
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
    </Box>
  );
}
