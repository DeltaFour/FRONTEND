import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider, Theme } from "@chakra-ui/react";
import AppRoutes from "./router/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import { AppToaster } from "./components/ui/toaster";
import "./index.css";
import { theme } from "./theme/theme";
import { ColorModeProvider, useColorMode } from "./theme/colorMode";

const rootElement = document.getElementById("root");

const AppShell = () => {
  const { colorMode } = useColorMode();

  return (
    <Theme appearance={colorMode} bg="surface.muted" minH="100vh">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
      <AppToaster />
    </Theme>
  );
};

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement as HTMLElement);

  root.render(
    <React.StrictMode>
      <ChakraProvider value={theme}>
        <ColorModeProvider>
          <AppShell />
        </ColorModeProvider>
      </ChakraProvider>
    </React.StrictMode>,
  );
}
