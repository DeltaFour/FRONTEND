import { useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { Box, Flex, Image, Text, VStack } from "@chakra-ui/react";
import { BiCategory } from "react-icons/bi";
import { Icon } from "@chakra-ui/react";
import { IconType } from "react-icons";
import { motion, AnimatePresence } from "framer-motion";
import LogoComEscrita from "../../assets/LogoComEscrita.svg";
import LogoSemEscrita from "../../assets/LogoSemEscrita.svg";

const MotionBox = motion(Box);

export interface SidebarItem {
  label: string;
  to: string;
  icon?: IconType;
  exact?: boolean;
  category?: "dashboard" | "gestao" | "ponto";
}

interface SidebarProps {
  items: SidebarItem[];
  userName?: string;
  onLogout?: () => void;
  /** Mobile drawer: whether the sidebar is open on mobile */
  isMobileOpen?: boolean;
  /** Mobile drawer: callback to close the sidebar on mobile */
  onMobileClose?: () => void;
}

const EXPANDED_W = 256;
const COLLAPSED_W = 64;

const Sidebar = ({ items, userName, onLogout, isMobileOpen = false, onMobileClose }: SidebarProps) => {
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

  const categoriesOrder = ["dashboard", "gestao", "ponto"] as const;
  const categoryLabels = {
    dashboard: "Dashboard",
    gestao: "Gestão de Pessoas",
    ponto: "Controle de Ponto",
  };

  const handleNavClick = () => {
    // Close mobile drawer when navigating
    if (onMobileClose) {
      onMobileClose();
    }
  };

  const sidebarContent = (
    <MotionBox
      as="nav"
      color={labelActive}
      display="flex"
      flexDirection="column"
      h="100vh"
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
        justifyContent="center"
        alignItems="center"
        transition="padding 0.25s"
        minH="72px"
      >
        <AnimatePresence mode="wait">
          {collapsed ? (
            <MotionBox
              key="logo-collapsed"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              display="flex"
              justifyContent="center"
              alignItems="center"
              w="100%"
            >
              <Box
                w="32px"
                h="32px"
                bg="#E9D5FF"
                style={{
                  maskImage: `url(${LogoSemEscrita})`,
                  WebkitMaskImage: `url(${LogoSemEscrita})`,
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                }}
              />
            </MotionBox>
          ) : (
            <MotionBox
              key="logo-expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <Box
                w="140px"
                h="36px"
                bg="#E9D5FF"
                style={{
                  maskImage: `url(${LogoComEscrita})`,
                  WebkitMaskImage: `url(${LogoComEscrita})`,
                  maskSize: "contain",
                  WebkitMaskSize: "contain",
                  maskRepeat: "no-repeat",
                  WebkitMaskRepeat: "no-repeat",
                  maskPosition: "center",
                  WebkitMaskPosition: "center",
                }}
              />
            </MotionBox>
          )}
        </AnimatePresence>
      </Flex>

      {/* divisor */}
      <Box mx={collapsed ? 2 : 4} h="1px" bg={dividerBg} mb={3} />

      {/* ── botão colapsar (hidden on mobile) ────────────────── */}
      <Box
        px={collapsed ? 0 : 3}
        mb={1}
        display={{ base: "none", md: "flex" }}
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
        {categoriesOrder.map((category) => {
          const categoryItems = items.filter((item) => (item.category || "dashboard") === category);
          if (categoryItems.length === 0) return null;

          return (
            <VStack align="stretch" gap="1" key={category} mt={4} _first={{ mt: 0 }}>
              {!collapsed ? (
                <Text
                  fontSize="10px"
                  fontWeight="700"
                  color="purple.300"
                  opacity={0.8}
                  px={3}
                  pb={1}
                  pt={2}
                  letterSpacing="0.08em"
                  textTransform="uppercase"
                >
                  {categoryLabels[category]}
                </Text>
              ) : (
                <Box mx={2} h="1px" bg="whiteAlpha.100" my={1} />
              )}

              {categoryItems.map((item) => {
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
                    onClick={handleNavClick}
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
          );
        })}
      </VStack>
    </MotionBox>
  );

  return (
    <>
      {/* ── Desktop sidebar (sticky, hidden on mobile) ────────── */}
      <Box
        display={{ base: "none", md: "block" }}
        position="sticky"
        top="0"
        h="100vh"
        flexShrink={0}
      >
        {sidebarContent}
      </Box>

      {/* ── Mobile sidebar overlay ────────────────────────────── */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <MotionBox
              position="fixed"
              inset={0}
              bg="blackAlpha.700"
              zIndex={40}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
              display={{ base: "block", md: "none" }}
            />
            {/* Sidebar drawer */}
            <MotionBox
              position="fixed"
              top={0}
              left={0}
              bottom={0}
              zIndex={41}
              initial={{ x: -EXPANDED_W }}
              animate={{ x: 0 }}
              exit={{ x: -EXPANDED_W }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              display={{ base: "block", md: "none" }}
            >
              {sidebarContent}
            </MotionBox>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
