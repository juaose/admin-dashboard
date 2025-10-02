import { defineBackend } from "@aws-amplify/backend";
import { auth } from "./auth/resource.js";

defineBackend({
  auth,
  // data removed for simplified sandbox
});
