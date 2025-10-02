import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

/*== SCHEMA ===============================================================
This schema can be extended to include models for customer data, reports,
and other admin functionality as needed.
=========================================================================*/
// ✅ Or with actual models
const schema = a.schema({
  Todo: a
    .model({
      content: a.string(),
      done: a.boolean(),
    })
    .authorization((allow) => [allow.owner()]),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});