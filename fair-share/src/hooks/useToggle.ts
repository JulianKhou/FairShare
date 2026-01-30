// src/hooks/useToggle.ts
import { useState } from "react";

export const useToggle = (initialValue = false) => {
  const [value, setValue] = useState(initialValue);
  const toggle = () => setValue(!value);
  const close = () => setValue(false);
  return { value, toggle, close };
};
