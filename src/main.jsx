import React from "react";
import ReactDOM from "react-dom/client";
import { ChakraProvider } from "@chakra-ui/react";
import AppRoutes from "./router/AppRoutes";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";
import { theme } from "./theme/theme";

const rootElement = document.getElementById("root");

if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <ChakraProvider value={theme}>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ChakraProvider>
    </React.StrictMode>,
  );
}
