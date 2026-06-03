import { useMemo } from "react";

export function usePrototypeData() {
  return useMemo(() => ({
    productName: "English Learning Platform",
    features: ["diagnostic quiz","daily micro-lessons","vocabulary review","learner dashboard"]
  }), []);
}
