# Cognito Environment Variable Configuration

## Overview

The admin-dashboard now supports configuring Cognito User Pool settings via environment variables. This allows you to override the default `amplify_outputs.json` values and point to a pre-existing Cognito user pool.

## How It Works

The `lib/amplify-config.ts` file uses a fallback pattern:

```typescript
userPoolId: process.env.NEXT_PUBLIC_USER_POOL_ID!,
userPoolClientId: process.env.NEXT_PUBLIC_USER_POOL_CLIENT_ID!,
identityPoolId: process.env.NEXT_PUBLIC_IDENTITY_POOL_ID!,
```

**Behavior:**

- Environment variables are **required** - the app will fail if they're not set
- No fallback to `amplify_outputs.json` since we removed the auth resource from Amplify backend

## Environment Variables

Add these to your Amplify backend environment settings:

- `NEXT_PUBLIC_USER_POOL_ID` - The Cognito User Pool ID (e.g., `us-east-1_3QOXrkS9v`)
- `NEXT_PUBLIC_USER_POOL_CLIENT_ID` - The User Pool Client ID
- `NEXT_PUBLIC_IDENTITY_POOL_ID` - The Identity Pool ID

**Note:** The `NEXT_PUBLIC_` prefix is required because these variables are used in client-side code. Next.js only exposes variables with this prefix to the browser bundle.

## Deployment Configuration

### In AWS Amplify Console:

1. Go to your Amplify app in AWS Console
2. Navigate to **App settings** → **Environment variables**
3. Add the three environment variables with your pre-existing Cognito pool values
4. Redeploy your application

### Local Development:

For local testing, create a `.env.local` file (not tracked in git):

```bash
NEXT_PUBLIC_USER_POOL_ID=us-east-1_YourPoolId
NEXT_PUBLIC_USER_POOL_CLIENT_ID=YourClientId
NEXT_PUBLIC_IDENTITY_POOL_ID=us-east-1:YourIdentityPoolId
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
