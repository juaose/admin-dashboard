# Amplify Deployment Fix Documentation

## Problem Summary

The Amplify deployment was failing during the static page generation phase due to two critical issues:

### Issue 1: Redis VPC Connectivity

**Error:**

```
[ioredis] Unhandled error event: Error: connect EHOSTUNREACH 10.0.1.104:6379
```

**Root Cause:**

- Redis instance is located in a VPC (10.0.1.104:6379)
- Amplify's build environment cannot reach VPC resources directly
- During static page generation, the app tries to call Redis cache getters which fail

### Issue 2: Lambda Invocation Permissions

**Error:**

```
Error invoking Lambda getHostAccounts: AccessDeniedException:
User: arn:aws:sts::681730164872:assumed-role/AmplifySSRLoggingRole-73448f9b-43e4-4337-b470-e6aa7ded042f/BuildSession
is not authorized to perform: lambda:InvokeFunction on resource:
arn:aws:lambda:us-east-1:681730164872:function:lotto-backend-dev-getHostAccounts
because no identity-based policy allows the lambda:InvokeFunction action
```

**Root Cause:**

- Amplify's SSR Logging Role lacks permissions to invoke Lambda functions
- During static generation, Next.js tries to call Lambda functions but gets denied

## Solution Architecture

### Part 1: VPC-Enabled Lambda Wrappers

Created new Lambda functions that wrap Redis cache operations:

**New Functions:**

- `getPhoneLinesCached` - Wraps `phoneLinesGetter()`
- `getHostAccountsCached` - Wraps `allHostAccountsGetter()`
- `getAdminsCached` - Wraps `adminsGetter()`
- `getTelegramChatsCached` - Wraps `telegramChatsGetter()`

**How it Works:**

1. These Lambda functions run in the VPC (configured in `serverless.yml`)
2. They can access Redis directly (10.0.1.104:6379)
3. Amplify's build environment calls these Lambdas instead of trying to reach Redis directly
4. The Lambdas fetch data from Redis and return it to Amplify

**Files Created/Modified:**

- ✅ `backend-services/src/redis/cacheHandlers.ts` (new file)
- ✅ `backend-services/serverless.yml` (added 4 new function definitions)

### Part 2: IAM Permissions

Created IAM policy to allow Amplify's role to invoke Lambda functions:

**Files Created:**

- ✅ `admin-dashboard/scripts/amplify-lambda-invoke-policy.json` - IAM policy document
- ✅ `admin-dashboard/scripts/apply-amplify-permissions.sh` - Script to apply permissions

### Part 3: API Route Updates

Updated admin dashboard API routes to use the new cached Lambda functions:

**Files Modified:**

- ✅ `admin-dashboard/app/api/directorios/cuentas/route.ts` - Now calls `getHostAccountsCached`
- ✅ `admin-dashboard/app/api/directorios/telefonos/route.ts` - Now calls `getPhoneLinesCached`

## Deployment Steps

### Step 1: Deploy Backend Lambda Functions

```bash
cd backend-services

# Build the Lambda functions
npm run build

# Deploy to AWS
serverless deploy --stage dev
```

This will deploy the new cached Lambda functions:

- `lotto-backend-dev-getPhoneLinesCached`
- `lotto-backend-dev-getHostAccountsCached`
- `lotto-backend-dev-getAdminsCached`
- `lotto-backend-dev-getTelegramChatsCached`

### Step 2: Apply IAM Permissions

```bash
# From the project root
cd admin-dashboard/scripts

# Make the script executable (if not already)
chmod +x apply-amplify-permissions.sh

# Run the script to apply permissions
./apply-amplify-permissions.sh
```

**What this does:**

- Attaches an inline policy to `AmplifySSRLoggingRole-73448f9b-43e4-4337-b470-e6aa7ded042f`
- Grants `lambda:InvokeFunction` permission for all backend Lambda functions
- Enables Amplify to call these functions during static page generation

**Expected Output:**

```
🔧 Applying Lambda invoke permissions to Amplify role...
Role: AmplifySSRLoggingRole-73448f9b-43e4-4337-b470-e6aa7ded042f
Policy: AmplifyLambdaInvokePolicy

📋 Policy file found: admin-dashboard/scripts/amplify-lambda-invoke-policy.json

📝 Creating inline policy on role...
✅ Successfully applied Lambda invoke permissions to Amplify role!
```

### Step 3: Deploy Admin Dashboard to Amplify

The admin dashboard changes are already in the codebase. Simply trigger a new Amplify build:

**Option A: Via AWS Console**

1. Go to AWS Amplify Console
2. Select your app
3. Click "Run build"

**Option B: Via Git Push**

```bash
cd admin-dashboard
git add .
git commit -m "Fix: Use VPC-enabled Lambda wrappers for Redis cache access"
git push origin main  # or your branch name
```

Amplify will automatically detect the push and start a new build.

## Testing the Fix

### Test 1: Verify Lambda Functions

```bash
# Test getPhoneLinesCached
aws lambda invoke \
  --function-name lotto-backend-dev-getPhoneLinesCached \
  --region us-east-1 \
  /tmp/phonelines-response.json

cat /tmp/phonelines-response.json

# Test getHostAccountsCached
aws lambda invoke \
  --function-name lotto-backend-dev-getHostAccountsCached \
  --region us-east-1 \
  /tmp/hostaccounts-response.json

cat /tmp/hostaccounts-response.json
```

**Expected Response:**

```json
{
  "statusCode": 200,
  "headers": {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*"
  },
  "body": "{\"success\":true,\"data\":[...]}"
}
```

### Test 2: Verify IAM Permissions

```bash
# Check if the policy was applied
aws iam get-role-policy \
  --role-name AmplifySSRLoggingRole-73448f9b-43e4-4337-b470-e6aa7ded042f \
  --policy-name AmplifyLambdaInvokePolicy \
  --region us-east-1
```

**Expected Output:**
Should show the policy document with Lambda invoke permissions.

### Test 3: Monitor Amplify Build

1. Go to AWS Amplify Console
2. Watch the build logs for the new deployment
3. Look for successful Lambda invocations during "Generating static pages"

**Expected Log Output:**

```
Generating static pages (0/11) ...
Invoking Lambda: lotto-backend-dev-getPhoneLinesCached
Invoking Lambda: lotto-backend-dev-getHostAccountsCached
Generating static pages (2/11)
✓ Generating static pages (11/11)
```

**No more errors like:**

- ❌ `Error: connect EHOSTUNREACH 10.0.1.104:6379`
- ❌ `AccessDeniedException: User is not authorized to perform: lambda:InvokeFunction`

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Amplify Build Environment                 │
│                                                              │
│  ┌──────────────────────────────────────┐                   │
│  │   Next.js Static Generation          │                   │
│  │                                       │                   │
│  │   ┌─────────────────────────────┐   │                   │
│  │   │ /api/directorios/cuentas    │───┼───────┐           │
│  │   └─────────────────────────────┘   │       │           │
│  │                                       │       │           │
│  │   ┌─────────────────────────────┐   │       │           │
│  │   │ /api/directorios/telefonos  │───┼───────┤           │
│  │   └─────────────────────────────┘   │       │           │
│  └──────────────────────────────────────┘       │           │
└─────────────────────────────────────────────────┼───────────┘
                                                   │
                              Lambda Invoke (with permissions)
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                        AWS Lambda                            │
│                      (VPC-Enabled)                           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  lotto-backend-dev-getPhoneLinesCached               │  │
│  │  lotto-backend-dev-getHostAccountsCached             │  │
│  │  lotto-backend-dev-getAdminsCached                   │  │
│  │  lotto-backend-dev-getTelegramChatsCached            │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                                  │
└───────────────────────────┼──────────────────────────────────┘
                            │
                            │ Redis Connection
                            │ (VPC: 10.0.1.104:6379)
                            ▼
                  ┌──────────────────┐
                  │   Redis Cache    │
                  │   (ElastiCache)  │
                  └──────────────────┘
```

## Benefits

1. **Separation of Concerns**: Amplify build environment doesn't need VPC access
2. **Security**: Redis remains isolated in VPC, only accessible via Lambda
3. **Performance**: Redis caching still provides fast data access
4. **Maintainability**: Clear separation between build-time and runtime operations
5. **Scalability**: Lambda functions can scale independently

## Rollback Plan

If issues occur, you can rollback:

### Remove IAM Policy

```bash
aws iam delete-role-policy \
  --role-name AmplifySSRLoggingRole-73448f9b-43e4-4337-b470-e6aa7ded042f \
  --policy-name AmplifyLambdaInvokePolicy \
  --region us-east-1
```

### Revert API Routes

```bash
# Revert the API route changes
git revert <commit-hash>
git push origin main
```

### Remove Lambda Functions

```bash
# Edit serverless.yml to remove the 4 new functions
# Then redeploy
cd backend-services
serverless deploy --stage dev
```

## Troubleshooting

### Issue: Lambda functions still can't reach Redis

**Solution:**
Verify VPC configuration in `serverless.yml`:

```yaml
provider:
  vpc:
    securityGroupIds:
      - sg-0cdc4207ca0068c4b
    subnetIds:
      - subnet-0ca99276982d0988f # RelRed_Lamda_B
      - subnet-06b1cc2d8fd80bcf6 # RelRed_Lamda_A
```

### Issue: Permission denied errors persist

**Solution:**

1. Check the role name is correct in the policy script
2. Verify the policy was applied:
   ```bash
   aws iam list-role-policies --role-name AmplifySSRLoggingRole-73448f9b-43e4-4337-b470-e6aa7ded042f
   ```
3. Re-run the permission script if needed

### Issue: Old Lambda functions still being called

**Solution:**

1. Clear Next.js build cache
2. Trigger a full rebuild in Amplify
3. Check that the API route files were properly updated

## Maintenance

### Adding New Cached Functions

If you need to add more cached getters in the future:

1. **Add handler to `cacheHandlers.ts`:**

```typescript
export const getNewDataCached = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const data = await newDataGetter();
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ success: true, data }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
    };
  }
};
```

2. **Add to `serverless.yml`:**

```yaml
getNewDataCached:
  handler: dist/redis/cacheHandlers.getNewDataCached
  description: Get new data from cache (VPC-enabled for Amplify)
  memorySize: 256
  timeout: 30
```

3. **Update IAM policy** to include the new function ARN

4. **Deploy:** Run `serverless deploy --stage dev`

## Related Documentation

- [Redis Cache Implementation](../../npm-packages/lotto-core/src/db/redis/README.md)
- [Lambda Client Library](../lib/lambda-client.ts)
- [Serverless Framework Documentation](https://www.serverless.com/framework/docs/)

## Support

For issues or questions:

1. Check the Amplify build logs
2. Review Lambda CloudWatch logs
3. Verify IAM permissions in AWS Console
4. Check VPC/Security Group configurations
