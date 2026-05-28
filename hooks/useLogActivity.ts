import { useContext } from "react";
import { LogActivityContext } from "@/context/LogActivityContext";

export function useLogActivity() {
  const context = useContext(LogActivityContext);
  if (!context) {
    throw new Error("useLogActivity must be used within LogActivityProvider");
  }
  return context;
}
