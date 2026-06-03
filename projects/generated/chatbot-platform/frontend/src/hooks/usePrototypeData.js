import { useMemo } from "react";

export function usePrototypeData() {
  return useMemo(() => ({
    productName: "Chatbot Platform",
    features: ["FAQ bot","conversation history","admin prompts"]
  }), []);
}
