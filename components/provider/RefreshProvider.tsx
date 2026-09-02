"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

type RefreshContextType = {
  isRefreshing: boolean;
  startRefresh: () => void;
  endRefresh: () => void;
};

const RefreshContext = createContext<RefreshContextType | undefined>(
  undefined
);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const startRefresh = useCallback(() => {
    setIsRefreshing(true);
  }, []);

  const endRefresh = useCallback(() => {
    setIsRefreshing(false);
  }, []);

  return (
    <RefreshContext.Provider
      value={{
        isRefreshing,
        startRefresh,
        endRefresh,
      }}
    >
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  const context = useContext(RefreshContext);
  if (context === undefined) {
    throw new Error("useRefresh must be used within a RefreshProvider");
  }
  return context;
}
