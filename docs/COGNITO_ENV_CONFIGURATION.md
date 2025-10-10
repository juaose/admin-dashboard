# Cognito Environment Variable Configuration

## Overview

The admin-dashboard now supports configuring Cognito User Pool settings via environment variables. This allows you to override the default `amplify_outputs.json` values and point to a pre-existing Cognito user pool.

## How It Works

The `lib/amplify-config.ts` file uses a fallback pattern:

```typescript
userPoolId: process.env.USER_POOL_ID || outputs.auth.user_pool_id,
userPoolClientId: process.env.USER_POOL_CLIENT_ID || outputs.auth.user_pool_client_id,
identityPoolId: process.env.IDENTITY_POOL_ID || outputs.auth.identity_pool_id,
```

**Behavior:**

- If environment variables are set → Uses the environment variable values
- If environment variables are NOT set → Falls back to `amplify_outputs.json` values

## Environment Variables

Add these to your Amplify backend environment settings:

- `USER_POOL_ID` - The Cognito User Pool ID (e.g., `us-east-1_3QOXrkS9v`)
- `USER_POOL_CLIENT_ID` - The User Pool Client ID
- `IDENTITY_POOL_ID` - The Identity Pool ID

## Deployment Configuration

### In AWS Amplify Console:

1. Go to your Amplify app in AWS Console
2. Navigate to **App settings** → **Environment variables**
3. Add the three environment variables with your pre-existing Cognito pool values
4. Redeploy your application

### Local Development:

For local testing, create a `.env.local` file (not tracked in git):

```bash
USER_POOL_ID=us-east-1_YourPoolId
USER_POOL_CLIENT_ID=YourClientId
IDENTITY_POOL_ID=us-east-1:YourIdentityPoolId
```

## Testing

### Without Environment Variables:

The app will use the values from `amplify_outputs.json`:

- User Pool: `us-east-1_mDTapLjK0`

### With Environment Variables:

The app will use your configured Cognito pool from the environment variables.

## Benefits

1. **Flexibility**: Use different Cognito pools per environment (dev, staging, prod)
2. **Pre-existing pools**: Point to existing Cognito user pools without recreating them
3. **Easy updates**: Change authentication configuration without code changes
4. **No code duplication**: Share the same Cognito pool across multiple apps

## Implementation Details

The configuration is loaded in `app/layout.tsx`:

```typescript
import "../lib/amplify-config";
```

This ensures Amplify is configured before any authentication components are rendered.
