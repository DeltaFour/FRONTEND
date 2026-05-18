import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Box, Flex, Image, Text, VStack } from "@chakra-ui/react";
import { BiCategory } from "react-icons/bi";
import { Icon } from "@chakra-ui/react";
import { IconType } from "react-icons";
import { motion, AnimatePresence } from "framer-motion";
import LogoHorizontal from "../../assets/LogoHorizontal.png";

const MotionBox = motion(Box);

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

const EXPANDED_W = 256;
const COLLAPSED_W = 64;

const Sidebar = ({ items, userName, onLogout }: SidebarProps) => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const sidebarBg = "#0D0D0F";
  const sidebarBorder = "whiteAlpha.100";
  const dividerBg = "whiteAlpha.100";
  const activeBg = "rgba(109,40,217,0.25)";
  const activeHoverBg = "rgba(109,40,217,0.3)";
  const inactiveHoverBg = "whiteAlpha.100";
  const activeBorder = "purple.400";
  const labelActive = "white";
  const labelMuted = "whiteAlpha.700";
  const iconActive = "purple.300";
  const iconMuted = "whiteAlpha.600";
  const toggleBg = collapsed ? "rgba(109,40,217,0.2)" : "whiteAlpha.100";
  const toggleHoverBg = "rgba(109,40,217,0.3)";
  const toggleIconColor = "purple.300";
  const bgGradient =
    "radial-gradient(ellipse 180% 140px at 50% 0%, rgba(109,40,217,0.35) 0%, transparent 100%)";

  return (
    <MotionBox
      as="nav"
      color={labelActive}
      display="flex"
      flexDirection="column"
      h="100vh"
      position="sticky"
      top="0"
      flexShrink={0}
      overflow="hidden"
      bg={sidebarBg}
      borderRightWidth="1px"
      borderColor={sidebarBorder}
      animate={{ width: collapsed ? COLLAPSED_W : EXPANDED_W }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      style={{
        backgroundImage: bgGradient,
      }}
    >
      {/* ── logo ─────────────────────────────────────────────── */}
      <Flex
        px={collapsed ? 0 : 5}
        pt={6}
        pb={5}
        justifyContent={collapsed ? "center" : "flex-start"}
        alignItems="center"
        transition="padding 0.25s"
        minH="72px"
      >
        <AnimatePresence mode="wait">
          {!collapsed && (
            <MotionBox
              key="logo"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Image src={LogoHorizontal} alt="Logo" maxW="140px" />
            </MotionBox>
          )}
        </AnimatePresence>
      </Flex>

      {/* divisor */}
      <Box mx={collapsed ? 2 : 4} h="1px" bg={dividerBg} mb={3} />

      {/* ── botão colapsar ────────────────────────────────────── */}
      <Box
        px={collapsed ? 0 : 3}
        mb={1}
        display="flex"
        justifyContent={collapsed ? "center" : "flex-start"}
      >
        <Box
          px={3}
          py={2.5}
          borderRadius="10px"
          bg={toggleBg}
          display="inline-flex"
          alignItems="center"
          justifyContent="center"
          cursor="pointer"
          onClick={() => setCollapsed((c) => !c)}
          _hover={{ bg: toggleHoverBg }}
          transition="background 0.2s"
          title={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          <Icon
            as={BiCategory}
            boxSize={5}
            color={toggleIconColor}
            style={{
              transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.3s ease",
            }}
          />
        </Box>
      </Box>

      {/* ── itens de navegação ───────────────────────────────── */}
      <VStack
        align="stretch"
        flex={1}
        mt={2}
        gap="1"
        px={collapsed ? 1.5 : 3}
        overflowY="auto"
        overflowX="hidden"
        css={{ "&::-webkit-scrollbar": { width: "0px" } }}
        transition="padding 0.25s"
      >
        {items.map((item) => {
          const isActive = item.exact
            ? location.pathname === item.to
            : location.pathname === item.to ||
              location.pathname.startsWith(`${item.to}/`);

          return (
            <RouterLink
              key={item.to}
              to={item.to}
              style={{ textDecoration: "none" }}
              title={collapsed ? item.label : undefined}
            >
              <Box
                px={collapsed ? 0 : 3}
                py={2.5}
                borderRadius="10px"
                position="relative"
                overflow="hidden"
                transition="all 0.2s"
                bg={isActive ? activeBg : "transparent"}
                _hover={{
                  bg: isActive ? activeHoverBg : inactiveHoverBg,
                }}
                borderLeftWidth="2px"
                borderLeftColor={
                  isActive && !collapsed ? activeBorder : "transparent"
                }
                display="flex"
                alignItems="center"
                justifyContent={collapsed ? "center" : "flex-start"}
                style={
                  isActive
                    ? { boxShadow: "inset 0 0 20px rgba(109,40,217,0.15)" }
                    : {}
                }
              >
                <Flex
                  align="center"
                  gap={collapsed ? 0 : 3}
                  justify={collapsed ? "center" : "flex-start"}
                  w="100%"
                >
                  <Icon
                    as={item.icon}
                    boxSize={5}
                    color={isActive ? iconActive : iconMuted}
                    transition="color 0.2s"
                    flexShrink={0}
                  />

                  <AnimatePresence initial={false}>
                    {!collapsed && (
                      <MotionBox
                        key="label"
                        initial={{ opacity: 0, width: 0 }}
                        animate={{ opacity: 1, width: "auto" }}
                        exit={{ opacity: 0, width: 0 }}
                        transition={{ duration: 0.2, ease: "easeInOut" }}
                        overflow="hidden"
                        whiteSpace="nowrap"
                      >
                        <Text
                          fontSize="sm"
                          fontWeight={isActive ? 600 : 400}
                          color={isActive ? labelActive : labelMuted}
                          transition="color 0.2s"
                          letterSpacing="0.01em"
                        >
                          {item.label}
                        </Text>
                      </MotionBox>
                    )}
                  </AnimatePresence>
                </Flex>
              </Box>
            </RouterLink>
          );
        })}
      </VStack>
    </MotionBox>
  );
};

export default Sidebar;
