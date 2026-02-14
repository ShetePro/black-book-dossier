import { useContext, createContext, type PropsWithChildren } from "react";
import { setStorageItemAsync, useStorageState } from "@/hooks/useStorageState";

const AuthContext = createContext<{
  signIn: (tokens: { token: string; refreshToken: string }) => void;
  signOut: () => void;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: (tokens: { token: string; refreshToken: string }) => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const [[isLoading, session], setSession] = useStorageState("token");

  return (
    <AuthContext.Provider
      value={{
        signIn: (tokens: { token: string; refreshToken: string }) => {
          // Perform sign-in logic here
          setSession(tokens.token);
          setStorageItemAsync("refreshToken", tokens.refreshToken);
        },
        signOut: () => {
          setSession(null);
          setStorageItemAsync("refreshToken", null);
        },
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
