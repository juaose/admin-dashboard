"use client";

import React, { useEffect, useState } from "react";
import {
  Authenticator,
  ThemeProvider as AmplifyThemeProvider,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import { fetchUserAttributes } from "aws-amplify/auth";
import "@aws-amplify/ui-react/styles.css";
import outputs from "../amplify_outputs.json";
import "./app.css";
import "./spanish-auth.css";
import Navigation from "../components/Navigation";
import { formFields, components } from "../lib/authenticator-config";

Amplify.configure(outputs);

export default function App() {
  const [userAttributes, setUserAttributes] = useState<any>(null);
  const [isLoadingAttributes, setIsLoadingAttributes] = useState(false);
  const [attributeError, setAttributeError] = useState<string | null>(null);

  // Optimized user attribute fetching with proper loading states
  useEffect(() => {
    async function getUserAttributes() {
      setIsLoadingAttributes(true);
      setAttributeError(null);

      try {
        const attributes = await fetchUserAttributes();
        console.log("Main page - Fetched user attributes:", attributes);
        setUserAttributes(attributes);
      } catch (error) {
        console.error("Main page - Error fetching user attributes:", error);
        setUserAttributes(null);

        // Set user-friendly error message in Spanish
        if (error instanceof Error) {
          setAttributeError("Error al cargar información del usuario");
        } else {
          setAttributeError("Error de conexión al cargar datos");
        }
      } finally {
        setIsLoadingAttributes(false);
      }
    }

    // Only fetch if we can (user is authenticated)
    getUserAttributes();
  }, []); // Run once when component mounts

  return (
    <AmplifyThemeProvider>
      <Authenticator
        hideSignUp={true}
        formFields={formFields}
        components={components}
      >
        {({ signOut, user }) => {
          // Function to get display name with proper loading states and fallback
          const getDisplayName = () => {
            // Show loading indicator while fetching attributes
            if (isLoadingAttributes) {
              return "Cargando...";
            }

            // Show error state if there was an error fetching attributes
            if (attributeError) {
              // Fall back to basic user info if attributes failed to load
              if (user?.signInDetails?.loginId)
                return user.signInDetails.loginId;
              return user?.username || "Usuario";
            }

            // Normal flow - use fetched attributes first, then fallback to user info
            if (userAttributes?.name) return userAttributes.name;
            if (userAttributes?.given_name) return userAttributes.given_name;
            if (user?.signInDetails?.loginId) return user.signInDetails.loginId;
            return user?.username || "Usuario";
          };

          return (
            <div
              style={{
                backgroundColor: "var(--bg-primary)",
                color: "var(--text-primary)",
                minHeight: "100vh",
              }}
            >
              <Navigation user={user} onSignOut={signOut} />
              <main
                style={{
                  padding: "2rem",
                  maxWidth: "1200px",
                  margin: "0 auto",
                }}
              >
                <div
                  style={{
                    marginBottom: "3rem",
                  }}
                >
                  <h1
                    style={{
                      color: "var(--text-primary)",
                      marginBottom: "1rem",
                      textAlign: "center",
                    }}
                  >
                    🤖 Monitor de Bots Bancarios
                  </h1>
                  <p
                    style={{
                      color: "var(--text-secondary)",
                      fontSize: "1.1rem",
                      textAlign: "center",
                      marginBottom: "3rem",
                    }}
                  >
                    ¡Bienvenido de vuelta, {getDisplayName()}! Selecciona el
                    banco para monitorear sus bots.
                  </p>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
                    gap: "2rem",
                    marginBottom: "3rem",
                  }}
                >
                  {/* BNCR Bot Legion */}
                  <div
                    style={{
                      background: "var(--bg-secondary)",
                      padding: "2rem",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "4rem",
                        marginBottom: "1rem",
                      }}
                    >
                      🏦
                    </div>
                    <h3
                      style={{
                        color: "var(--text-primary)",
                        marginBottom: "1rem",
                      }}
                    >
                      BNCR Bot Legion
                    </h3>
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        marginBottom: "1.5rem",
                      }}
                    >
                      Monitoreo y control de bots del Banco Nacional de Costa
                      Rica
                    </p>
                    <a href="/bot-monitor">
                      <button
                        style={{
                          padding: "12px 24px",
                          backgroundColor: "var(--brand-primary)",
                          color: "var(--brand-white)",
                          border: "none",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "16px",
                          width: "100%",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--brand-secondary)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--brand-primary)";
                        }}
                      >
                        Acceder a BNCR Bots
                      </button>
                    </a>
                  </div>

                  {/* Popular Bot Legion */}
                  <div
                    style={{
                      background: "var(--bg-secondary)",
                      padding: "2rem",
                      borderRadius: "12px",
                      border: "1px solid var(--border-color)",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "4rem",
                        marginBottom: "1rem",
                      }}
                    >
                      🏛️
                    </div>
                    <h3
                      style={{
                        color: "var(--text-primary)",
                        marginBottom: "1rem",
                      }}
                    >
                      Popular Bot Legion
                    </h3>
                    <p
                      style={{
                        color: "var(--text-secondary)",
                        marginBottom: "1.5rem",
                      }}
                    >
                      Monitoreo y control de bots del Banco Popular
                    </p>
                    <button
                      style={{
                        padding: "12px 24px",
                        backgroundColor: "var(--text-secondary)",
                        color: "var(--brand-white)",
                        border: "none",
                        borderRadius: "6px",
                        cursor: "not-allowed",
                        fontSize: "16px",
                        width: "100%",
                        opacity: 0.6,
                      }}
                      disabled
                    >
                      Próximamente
                    </button>
                  </div>
                </div>

                {/* Development Tools Section */}
                <div
                  style={{
                    background: "var(--bg-secondary)",
                    padding: "2rem",
                    borderRadius: "12px",
                    border: "1px solid var(--border-color)",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
                  }}
                >
                  <h3
                    style={{
                      color: "var(--text-primary)",
                      marginBottom: "1rem",
                      textAlign: "center",
                    }}
                  >
                    🛠️ Herramientas de Desarrollo
                  </h3>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "1rem",
                    }}
                  >
                    <a href="/color-palette-demo">
                      <button
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "transparent",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          width: "100%",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--brand-primary)";
                          e.currentTarget.style.color = "var(--brand-white)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "var(--text-primary)";
                        }}
                      >
                        🎨 Paleta de Colores
                      </button>
                    </a>
                    <a href="/test-theme">
                      <button
                        style={{
                          padding: "10px 20px",
                          backgroundColor: "transparent",
                          color: "var(--text-primary)",
                          border: "1px solid var(--border-color)",
                          borderRadius: "6px",
                          cursor: "pointer",
                          fontSize: "14px",
                          width: "100%",
                          transition: "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "var(--brand-primary)";
                          e.currentTarget.style.color = "var(--brand-white)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "transparent";
                          e.currentTarget.style.color = "var(--text-primary)";
                        }}
                      >
                        🎭 Test de Temas
                      </button>
                    </a>
                  </div>
                </div>
              </main>
            </div>
          );
        }}
      </Authenticator>
    </AmplifyThemeProvider>
  );
}
