import { Amplify } from "aws-amplify";
import { fetchAuthSession } from "aws-amplify/auth";
import outputs from "../amplify_outputs.json";

// Configure Amplify with environment variable overrides
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
      userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
      identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID!,
      loginWith: {
        email: true,
      },
      signUpVerificationMethod: "code",
      userAttributes: {
        email: {
          required: true,
        },
      },
      allowGuestAccess: true,
      passwordFormat: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireNumbers: true,
        requireSpecialCharacters: false,
      },
    },
  },
  API: {
    REST: {
      "dal-api": {
        endpoint:
          process.env.NEXT_PUBLIC_DAL_API_URL || "http://localhost:3100",
        region: "us-east-1",
        headers: async () => {
          try {
            const session = await fetchAuthSession();
            const idToken = session.tokens?.idToken?.toString();
            if (idToken) {
              return { Authorization: idToken };
            }
          } catch (error) {
            console.warn("No Cognito session available:", error);
          }
          return {};
        },
      },
    },
  },
  // Keep your existing data configuration if present
  ...((outputs as any).data && { data: (outputs as any).data }),
});
