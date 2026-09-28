import { createContext, useContext } from "react";
import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

export interface AuthUser {
  id: number;
  email: string;
  role: "customer" | "operator" | "support" | "admin";
  status: "active" | "restricted" | "banned";
  createdAt: string;
  updatedAt: string;
  emailVerified: boolean;
  fullName: string | null;
  phone: string | null;
  company: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  refetch: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  refetch: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  const { data: user, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      retry: false,
    },
  });

  function refetch() {
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  }

  return (
    <AuthContext.Provider
      value={{
        user: (user as AuthUser | undefined) ?? null,
        isLoading,
        refetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
