import { Platform } from "react-native";

export const Colors = {
  light: {
    text: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.6)",
    textTertiary: "rgba(255, 255, 255, 0.4)",
    buttonText: "#FFFFFF",
    tabIconDefault: "rgba(255, 255, 255, 0.5)",
    tabIconSelected: "#135bec",
    link: "#135bec",
    primary: "#135bec",
    primaryLight: "#3d7bf0",
    success: "#34d399",
    successBg: "rgba(52, 211, 153, 0.1)",
    warning: "#f59e0b",
    error: "#ef4444",
    purple: "#c084fc",
    backgroundRoot: "#101622",
    backgroundDefault: "rgba(23, 29, 41, 0.6)",
    backgroundSecondary: "rgba(23, 29, 41, 0.8)",
    backgroundTertiary: "rgba(16, 22, 34, 0.9)",
    glassBorder: "rgba(255, 255, 255, 0.08)",
    glassHighlight: "rgba(255, 255, 255, 0.1)",
    orb1: "#135bec",
    orb2: "#2a3b55",
    orb3: "#1a2333",
  },
  dark: {
    text: "#FFFFFF",
    textSecondary: "rgba(255, 255, 255, 0.6)",
    textTertiary: "rgba(255, 255, 255, 0.4)",
    buttonText: "#FFFFFF",
    tabIconDefault: "rgba(255, 255, 255, 0.5)",
    tabIconSelected: "#135bec",
    link: "#135bec",
    primary: "#135bec",
    primaryLight: "#3d7bf0",
    success: "#34d399",
    successBg: "rgba(52, 211, 153, 0.1)",
    warning: "#f59e0b",
    error: "#ef4444",
    purple: "#c084fc",
    backgroundRoot: "#101622",
    backgroundDefault: "rgba(23, 29, 41, 0.6)",
    backgroundSecondary: "rgba(23, 29, 41, 0.8)",
    backgroundTertiary: "rgba(16, 22, 34, 0.9)",
    glassBorder: "rgba(255, 255, 255, 0.08)",
    glassHighlight: "rgba(255, 255, 255, 0.1)",
    orb1: "#135bec",
    orb2: "#2a3b55",
    orb3: "#1a2333",
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
  inputHeight: 48,
  buttonHeight: 52,
};

export const BorderRadius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  "2xl": 32,
  "3xl": 50,
  full: 9999,
};

export const Typography = {
  display: {
    fontSize: 48,
    fontWeight: "900" as const,
    letterSpacing: -1.5,
  },
  revenue: {
    fontSize: 40,
    fontWeight: "900" as const,
    letterSpacing: -1.2,
  },
  h1: {
    fontSize: 32,
    fontWeight: "800" as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 24,
    fontWeight: "600" as const,
  },
  h4: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
  },
  small: {
    fontSize: 14,
    fontWeight: "400" as const,
  },
  caption: {
    fontSize: 12,
    fontWeight: "500" as const,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 10,
    fontWeight: "600" as const,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  link: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: "system-ui",
    serif: "ui-serif",
    rounded: "ui-rounded",
    mono: "ui-monospace",
  },
  default: {
    sans: "normal",
    serif: "serif",
    rounded: "normal",
    mono: "monospace",
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const Shadows = {
  glass: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 32,
    elevation: 8,
  },
  glow: {
    shadowColor: "#135bec",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  subtle: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
};
