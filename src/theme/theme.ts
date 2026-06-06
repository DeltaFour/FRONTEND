import { createSystem, defaultConfig, defineConfig } from "@chakra-ui/react";

const config = defineConfig({
  theme: {
    tokens: {
      fonts: {
        body: {
          value:
            "Nunito, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
        heading: {
          value:
            "Nunito, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        },
      },
      colors: {
        brand: {
          50: { value: "#eef2ff" },
          100: { value: "#e0e7ff" },
          500: { value: "#3b82f6" },
          600: { value: "#2563eb" },
        },
        gradient: {
          800: {
            value:
              "linear-gradient(360deg, #f8c623 0%, #fca015 40%, #ff8c00 70%, #ff4d00 100%)",
          },
        },
        primary: { 500: { value: "#4C1D95" } },
      },
    },
    semanticTokens: {
      colors: {
        surface: {
          DEFAULT: {
            value: { _light: "{colors.white}", _dark: "{colors.gray.700}" },
          },
          muted: {
            value: {
              _light: "{colors.gray.50}",
              _dark: "{colors.gray.900}",
            },
          },
          subtle: {
            value: {
              _light: "{colors.gray.100}",
              _dark: "{colors.gray.700}",
            },
          },
        },
      },
    },
  },
});

export const theme = createSystem(defaultConfig, config);
