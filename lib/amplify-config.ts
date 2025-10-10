import { Amplify } from "aws-amplify";
import outputs from "../amplify_outputs.json";

// Configure Amplify with environment variable overrides
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.USER_POOL_ID || outputs.auth.user_pool_id,
      userPoolClientId:
        process.env.USER_POOL_CLIENT_ID || outputs.auth.user_pool_client_id,
      identityPoolId:
        process.env.IDENTITY_POOL_ID || outputs.auth.identity_pool_id,
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
  // Keep your existing data configuration if present
  ...((outputs as any).data && { data: (outputs as any).data }),
});
