"use client";

import { Inter } from "next/font/google";
import "./globals.css";
import "./app.css";
import "./spanish-auth.css";
import { ThemeProvider } from "../components/ThemeProvider";
import Navigation from "../components/Navigation";
import {
  Authenticator,
  ThemeProvider as AmplifyThemeProvider,
} from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import "@aws-amplify/ui-react/styles.css";
import outputs from "../amplify_outputs.json";
import { formFields, components } from "../lib/authenticator-config";
import { AppAuthProvider } from "../contexts/AppAuthContext";

const inter = Inter({ subsets: ["latin"] });

// Configure Amplify for client-side authentication
Amplify.configure(outputs);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AmplifyThemeProvider>
          <Authenticator
            hideSignUp={true}
            formFields={formFields}
            components={components}
          >
            {({ signOut, user }) => (
              <AppAuthProvider>
                <ThemeProvider>
                  <Navigation user={user} onSignOut={signOut} />
                  <div className="app-layout">{children}</div>
                </ThemeProvider>
              </AppAuthProvider>
            )}
          </Authenticator>
        </AmplifyThemeProvider>
      </body>
    </html>
  );
}
