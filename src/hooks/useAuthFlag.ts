import { useEffect, useState } from "react";

export function useAuthFlag(): boolean | null {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    const match = document.cookie.match(/(^| )flag_authFeatures=([^;]+)/);
    const val = match ? match[2] : null;
    setEnabled(val === null ? false : val === "true");
  }, []);
  return enabled;
}
