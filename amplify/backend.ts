import { defineBackend } from "@aws-amplify/backend";

const backend = defineBackend({
  // Auth is now configured via environment variables in lib/amplify-config.ts
  // No backend auth resource defined - using pre-existing Cognito user pool
});

// Note: Cognito configuration is now handled client-side via environment variables
// Set USER_POOL_ID, USER_POOL_CLIENT_ID, and IDENTITY_POOL_ID in your deployment environment
