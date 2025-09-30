"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { fetchUserAttributes } from "aws-amplify/auth";

interface AppAuthContextType {
  user: any;
  userAttributes: any;
  isAppReady: boolean;
  appError: string | null;
  clearAppError: () => void;
  getDisplayName: () => string;
}

const AppAuthContext = createContext<AppAuthContextType | null>(null);

export const useAppAuth = () => {
  const context = useContext(AppAuthContext);
  if (!context) {
    throw new Error("useAppAuth must be used within AppAuthProvider");
  }
  return context;
};

interface AppAuthProviderProps {
  children: ReactNode;
}

export const AppAuthProvider: React.FC<AppAuthProviderProps> = ({
  children,
}) => {
  const { user } = useAuthenticator((context) => [context.user]);
  const [userAttributes, setUserAttributes] = useState<any>(null);
  const [isAppReady, setIsAppReady] = useState(false);
  const [appError, setAppError] = useState<string | null>(null);

  // Function to get display name with proper fallback
  const getDisplayName = () => {
    if (userAttributes?.name) return userAttributes.name;
    if (userAttributes?.given_name) return userAttributes.given_name;
    if (user?.signInDetails?.loginId) return user.signInDetails.loginId;
    return user?.username || "Usuario";
  };

  // Initialize app-specific data when user changes
  useEffect(() => {
    const initializeApp = async () => {
      if (user) {
        try {
          setAppError(null);
          setIsAppReady(false);

          // Fetch user attributes
          const attributes = await fetchUserAttributes();
          setUserAttributes(attributes);

          // Add any other app initialization logic here
          // For example: load user preferences, app configuration, etc.

          setIsAppReady(true);
        } catch (error) {
          console.error("Error initializing app:", error);
          setAppError(
            "Error al inicializar la aplicación. Por favor, inténtalo de nuevo."
          );
        }
      } else {
        // Reset state when user logs out
        setUserAttributes(null);
        setIsAppReady(false);
        setAppError(null);
      }
    };

    initializeApp();
  }, [user]);

  const clearAppError = () => {
    setAppError(null);
  };

  const value: AppAuthContextType = {
    user,
    userAttributes,
    isAppReady,
    appError,
    clearAppError,
    getDisplayName,
  };

  return (
    <AppAuthContext.Provider value={value}>{children}</AppAuthContext.Provider>
  );
};
