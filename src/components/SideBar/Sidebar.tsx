import { Link as RouterLink, useLocation } from "react-router-dom";
import { Box, Button, Flex, Image, Text, VStack } from "@chakra-ui/react";
import { FaSignOutAlt } from "react-icons/fa";
import LogoHorizontal from "../../assets/LogoHorizontal.png";
import { BiCategory } from "react-icons/bi";
import { Icon } from "@chakra-ui/react";
import { IconType } from "react-icons";

export interface SidebarItem {
  label: string;
  to: string;
  icon?: IconType;
  exact?: boolean;
}

interface SidebarProps {
  items: SidebarItem[];
  userName?: string;
  onLogout?: () => void;
}

const Sidebar = ({ items, userName, onLogout }: SidebarProps) => {
  const location = useLocation();

  return (
    <Box
      w="64"
      bg="#4C1D95"
      color="white"
      display="flex"
      flexDirection="column"
      h="100vh"
      position="sticky"
      top="0"
      flexShrink={0}
      overflow="hidden"
    >
      <Flex p={3} justifyContent="center">
        <Image src={LogoHorizontal} alt="Logo" maxW="45%" />
      </Flex>

      <VStack align="stretch" flex={1} mt={2} gap="0" overflowY="auto">
        <Box
          px={4}
          py={3}
          borderBottomWidth="1px"
          bg="purple.900"
          borderColor="blackAlpha.500"
          _hover={{ bg: "purple.800" }}
          fontSize="lg"
        >
          <Icon as={BiCategory} boxSize={8} />
        </Box>
        {items.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname === item.to ||
              location.pathname.startsWith(`${item.to}/`);

          return (
            <RouterLink key={item.to} to={item.to}>
              <Box
                px={4}
                py={4}
                borderBottomWidth="1px"
                borderColor="blackAlpha.500"
                bg={isActive ? "purple.900" : "transparent"}
                _hover={{ bg: "purple.800" }}
              >
                <Flex align="center" gap={3}>
                  <Icon as={item.icon} boxSize={6} />
                  <Text>{item.label}</Text>
                </Flex>
              </Box>
            </RouterLink>
          );
        })}
      </VStack>
    </Box>
  );
};

export default Sidebar;
