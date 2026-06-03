import { useMemo } from "react";

export function usePrototypeData() {
  return useMemo(() => ({
    productName: "Crm Platform",
    features: ["contact list","deal stages","activity log","basic dashboard"]
  }), []);
}
