"use client";

import { createContext, useContext, type ReactNode } from "react";

export interface RecipeNavActions {
  navigateToGuide: () => void;
}

const RecipeNavContext = createContext<RecipeNavActions | null>(null);

export function RecipeNavProvider({
  value,
  children,
}: {
  value: RecipeNavActions;
  children: ReactNode;
}) {
  return (
    <RecipeNavContext.Provider value={value}>{children}</RecipeNavContext.Provider>
  );
}

export function useRecipeNav(): RecipeNavActions | null {
  return useContext(RecipeNavContext);
}
