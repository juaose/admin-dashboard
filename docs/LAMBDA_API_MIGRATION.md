# Lambda API Migration Guide

## Overview

This guide documents the migration from direct database access in NextJS API routes to Lambda-based API calls, enabling AWS Amplify deployment without VPC access.

## Architecture Change

### Before Migration

```
NextJS App (Amplify) -> API Routes -> DALService -> lotto-core -> MongoDB (via VPC)
❌ Problem: Amplify has no VPC access, direct MongoDB connections fail
```

### After Migration

```
NextJS App (Amplify) -> API Routes -> AWS SDK -> Lambda Functions -> lotto-core -> MongoDB (via VPC)
✅ Solution: Lambda functions in VPC handle database operations
```

## What Was Migrated

### Core Endpoints (Completed)

1. **Player Search** - `/api/jugadores` → `getPlayers` Lambda
2. **Player Details** - `/api/jugadores/[id]` → `getPlayerById` Lambda
3. **Dashboard Stats** - `/api/dashboard/stats` → `getDashboardStats` Lambda

### Infrastructure Created

1. **Lambda Handlers** (`backend-services/src/admin-api/`)

   - `lambdaUtils.ts` - Shared utilities for Lambda responses
   - `playersHandler.ts` - Player management functions
   - `dashboardHandler.ts` - Dashboard statistics functions

2. **Lambda Client** (`admin-dashboard/lib/lambda-client.ts`)

   - AWS SDK Lambda invocation wrapper
   - Environment-based function naming (dev/prod)
   - Error handling and response parsing

3. **Serverless Configuration** (Updated `backend-services/serverless.yml`)
   - Added 7 new Lambda functions for admin API
   - Configured with VPC access for MongoDB connectivity

## Environment Configuration

### NextJS App (admin-dashboard)

Add to your `.env` file:

```bash
AWS_REGION=us-east-1
NODE_ENV=development  # or 'production'
```

### Lambda Functions (backend-services)

The Lambda functions inherit environment variables from your existing serverless configuration through the layer.

## Lambda Function Naming Convention

Functions are named dynamically based on environment:

```typescript
const functionName = `lotto-backend-${
  process.env.NODE_ENV === "production" ? "prod" : "dev"
}-${handlerName}`;
```

Examples:

- Development: `lotto-backend-dev-getPlayers`
- Production: `lotto-backend-prod-getPlayers`

## Deployment Instructions

### 1. Install Dependencies

**Admin Dashboard:**

```bash
cd admin-dashboard
npm install
```

**Backend Services:**

```bash
cd backend-services
npm install
```

### 2. Build Backend Services

```bash
cd backend-services
npm run build
```

### 3. Deploy Lambda Functions

**Deploy to dev:**

```bash
serverless deploy --stage dev
```

**Deploy to prod:**

```bash
serverless deploy --stage prod
```

### 4. Deploy Admin Dashboard to Amplify

The NextJS app can now be deployed to AWS Amplify without VPC requirements. The API routes will invoke Lambda functions which have VPC access.

## Migrated Lambda Functions

| Function Name          | Handler                               | Description                | Memory | Timeout |
| ---------------------- | ------------------------------------- | -------------------------- | ------ | ------- |
| `getPlayers`           | `playersHandler.getPlayers`           | Search for players by clue | 512 MB | 30s     |
| `getPlayerById`        | `playersHandler.getPlayerById`        | Get player by ID           | 256 MB | 30s     |
| `getPlayerDeposits`    | `playersHandler.getPlayerDeposits`    | Get player deposits        | 512 MB | 30s     |
| `getPlayerReloads`     | `playersHandler.getPlayerReloads`     | Get player reloads         | 256 MB | 30s     |
| `getPlayerWithdrawals` | `playersHandler.getPlayerWithdrawals` | Get player withdrawals     | 256 MB | 30s     |
| `getDashboardStats`    | `dashboardHandler.getDashboardStats`  | Get dashboard statistics   | 512 MB | 30s     |
| `getHomeStats`         | `dashboardHandler.getHomeStats`       | Get home page statistics   | 256 MB | 30s     |

## How to Migrate Additional Routes

### Step 1: Create Lambda Handler

Create a new handler in `backend-services/src/admin-api/` or add to an existing handler:

```typescript
// Example: backend-services/src/admin-api/reportsHandler.ts
import type { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { successResponse, errorResponse, getQueryParams } from "./lambdaUtils.js";

export const getReportData = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const params = getQueryParams(event);

    // Import and use lotto-core
    const { DAL } = await import("@juaose/lotto-core");
    await DAL.ensureReady();

    // Your business logic here
    const data = await YourModel.find({...});

    return successResponse({ data });
  } catch (error) {
    return errorResponse("Error message", error.message);
  }
};
```

### Step 2: Add to serverless.yml

```yaml
functions:
  getReportData:
    handler: dist/admin-api/reportsHandler.getReportData
    description: Get report data
    memorySize: 512
    timeout: 30
```

### Step 3: Update NextJS API Route

```typescript
// admin-dashboard/app/api/your-route/route.ts
import { NextRequest, NextResponse } from "next/server";
import { invokeLambdaWithQuery } from "../../../lib/lambda-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const result = await invokeLambdaWithQuery("getReportData", {
      param1: searchParams.get("param1") || "",
      param2: searchParams.get("param2") || "",
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { success: false, error: "Error message" },
      { status: 500 }
    );
  }
}
```

### Step 4: Deploy

```bash
cd backend-services
npm run build
serverless deploy --stage dev
```

## Remaining Routes to Migrate

Based on the current API structure, these routes still need migration:

### High Priority (Core Functionality)

- [x] `/api/home/stats` → `getHomeStats` ✅ **COMPLETED** - Migrated with timezone-aware calculations
- [x] `/api/jugadores/[id]/depositos` → `getPlayerDeposits` ✅ **COMPLETED** - Deployed to AWS Lambda
- [x] `/api/jugadores/[id]/recargas` → `getPlayerReloads` ✅ **COMPLETED** - Deployed to AWS Lambda
- [x] `/api/jugadores/[id]/retiros` → `getPlayerWithdrawals` ✅ **COMPLETED** - Deployed to AWS Lambda

### Medium Priority (Financial Operations)

- [ ] `/api/depositos/*` - Various deposit queries
- [ ] `/api/recargas/*` - Reload operations
- [ ] `/api/retiros/*` - Withdrawal operations

### Lower Priority (Admin/Directory)

- [ ] `/api/directorios/*` - Directory services
- [ ] `/api/promociones/*` - Promotions
- [ ] `/api/admins/*` - Admin management

## IAM Permissions Required

The Lambda functions need these permissions (already configured in your AWS account):

- VPC access to connect to MongoDB
- CloudWatch Logs for monitoring
- Lambda invoke permissions for the NextJS app

For the NextJS app to invoke Lambda functions, ensure the Amplify execution role has:

```json
{
  "Effect": "Allow",
  "Action": "lambda:InvokeFunction",
  "Resource": "arn:aws:lambda:us-east-1:681730164872:function:lotto-backend-*"
}
```

## Testing

### Local Testing (Lambda)

```bash
cd backend-services
npm run build

# Test a specific function
serverless invoke local --function getPlayers --data '{"queryStringParameters": {"search": "test"}}'
```

### Testing in Development

1. Deploy Lambda functions to dev
2. Run NextJS app locally with `npm run dev`
3. Test API endpoints - they should invoke the Lambda functions

### Testing in Production

1. Deploy Lambda functions to prod
2. Deploy NextJS app to Amplify
3. Verify endpoints work correctly

## Monitoring

### CloudWatch Logs

Lambda function logs are available in CloudWatch:

- Log Group Pattern: `/aws/lambda/lotto-backend-{stage}-{functionName}`
- Example: `/aws/lambda/lotto-backend-dev-getPlayers`

### Debugging

Enable detailed logging by checking Lambda function outputs in CloudWatch. Each function logs:

- Incoming event details
- Query parameters
- Error details with stack traces

## Troubleshooting

### Error: "No response payload from Lambda"

- Check Lambda function logs in CloudWatch
- Verify function is returning proper `APIGatewayProxyResult`
- Ensure function completed within timeout

### Error: "Lambda execution failed"

- Check MongoDB connection in VPC
- Verify environment variables are set
- Review Lambda function CloudWatch logs

### Error: "Function not found"

- Verify function name matches pattern: `lotto-backend-{stage}-{functionName}`
- Check `NODE_ENV` environment variable is set correctly
- Ensure Lambda function was deployed successfully

## Benefits of This Architecture

1. **Amplify Compatible**: No VPC requirement for NextJS app
2. **Scalable**: Independent Lambda scaling per endpoint
3. **Secure**: Database credentials never exposed to frontend
4. **Maintainable**: Clear separation of concerns
5. **Cost Effective**: Pay-per-use Lambda execution

## Next Steps

1. ✅ Core player and dashboard endpoints migrated
2. 📝 Migrate remaining high-priority routes
3. 📝 Update PUT/POST operations to use Lambda
4. 📝 Add comprehensive error handling
5. 📝 Implement request/response caching if needed
6. 📝 Set up monitoring and alerting

## Support

For issues or questions about this migration:

1. Check CloudWatch logs for Lambda execution details
2. Review this documentation
3. Check the example handlers in `backend-services/src/admin-api/`
