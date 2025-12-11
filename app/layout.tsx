"use client";

import localFont from "next/font/local";
import "./globals.css";
import "./app.css";
import "./spanish-auth.css";
import { ThemeProvider } from "../components/ThemeProvider";
import Navigation from "../components/Navigation";
import {
  Authenticator,
  ThemeProvider as AmplifyThemeProvider,
} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { formFields, components } from "../lib/authenticator-config";
import { AppAuthProvider } from "../contexts/AppAuthContext";
// Import Amplify configuration with environment variable support
import "../lib/amplify-config";

const inter = localFont({
  src: [
    {
      path: "../public/fonts/InterVariable.ttf",
      style: "normal",
    },
    {
      path: "../public/fonts/InterVariable-Italic.ttf",
      style: "italic",
    },
  ],
  variable: "--font-inter",
});

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
