"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

interface HookContextType {
  selectedHook: string;
  setSelectedHook: (hook: string) => void;
  selectedColor: string;
  setSelectedColor: (color: string) => void;
}

const HookContext = createContext<HookContextType | undefined>(undefined);

export const HookProvider = ({ children }: { children: ReactNode }) => {
  const [selectedHook, setSelectedHook] = useState<string>(
    "0x0000000000000000000000000000000000000000"
  );

  const [selectedColor, setSelectedColor] = useState<string>("pink");

  return (
    <HookContext.Provider
      value={{ selectedHook, setSelectedHook, selectedColor, setSelectedColor }}
    >
      {children}
    </HookContext.Provider>
  );
};

export const useHook = () => {
  const context = useContext(HookContext);
  if (!context) {
    throw new Error("useHook must be used within a HookProvider");
  }
  return context;
};