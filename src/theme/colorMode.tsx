import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type ColorMode = "light" | "dark";

interface ColorModeContextValue {
  colorMode: ColorMode;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
}

const ColorModeContext = createContext<ColorModeContextValue | undefined>(
  undefined,
);

const STORAGE_KEY = "deltafour.colorMode";
const DEFAULT_MODE: ColorMode = "dark";

const readStoredMode = (): ColorMode => {
  if (typeof window === "undefined") {
    return DEFAULT_MODE;
  }

  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return DEFAULT_MODE;
};

export const ColorModeProvider = ({ children }: { children: ReactNode }) => {
  const [colorMode, setColorModeState] = useState<ColorMode>(readStoredMode);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, colorMode);
    } catch {
      // Ignore storage errors.
    }

    const root = document.documentElement;
    root.classList.toggle("dark", colorMode === "dark");
    root.classList.toggle("light", colorMode === "light");
    root.style.colorScheme = colorMode;
  }, [colorMode]);

  const value = useMemo<ColorModeContextValue>(
    () => ({
      colorMode,
      setColorMode: setColorModeState,
      toggleColorMode: () =>
        setColorModeState((prev) => (prev === "dark" ? "light" : "dark")),
    }),
    [colorMode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      {children}
    </ColorModeContext.Provider>
  );
};

export const useColorMode = (): ColorModeContextValue => {
  const context = useContext(ColorModeContext);
  if (!context) {
    throw new Error("useColorMode deve ser usado dentro de ColorModeProvider");
  }

  return context;
};

export const useColorModeValue = <T,>(light: T, dark: T): T => {
  const { colorMode } = useColorMode();
  return colorMode === "dark" ? dark : light;
};
