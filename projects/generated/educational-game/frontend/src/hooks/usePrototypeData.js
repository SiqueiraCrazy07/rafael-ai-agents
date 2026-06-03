import { useMemo } from "react";

export function usePrototypeData() {
  return useMemo(() => ({
    productName: "Educational Game",
    features: ["core mechanic","3 levels","score feedback","learning summary"]
  }), []);
}
