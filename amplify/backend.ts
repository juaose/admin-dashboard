import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource.js";

const backend = defineBackend({
  auth,
  // data removed for simplified sandbox
});

// Use existing pool only in production
if (
  process.env.NODE_ENV?.toLowerCase() === "prod" ||
  process.env.NODE_ENV?.toLowerCase() === "production"
) {
  backend.addOutput({
    auth: {
      user_pool_id: process.env.PRODUCTION_USER_POOL_ID!,
      user_pool_client_id: process.env.PRODUCTION_USER_POOL_CLIENT_ID!,
      aws_region: process.env.AWS_REGION || "us-east-1",
    },
  });
}
