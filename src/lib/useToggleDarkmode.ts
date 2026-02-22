import { useTheme } from "../components/utility/theme-provider";

export const useToggleDarkmode = () => {
  const { theme, setTheme } = useTheme();

  const isDarkMode =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const toggleDarkMode = () => {
    setTheme(isDarkMode ? "light" : "dark");
  };

  return { isDarkMode, toggleDarkMode };
};
