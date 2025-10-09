#!/bin/bash
# Script to apply Lambda invoke permissions to the Amplify SSR Logging Role

set -e

REGION="us-east-1"
ACCOUNT_ID="681730164872"
ROLE_NAME="AmplifySSRLoggingRole-73448f9b-43e4-4337-b470-e6aa7ded042f"
POLICY_NAME="AmplifyLambdaInvokePolicy"
POLICY_FILE="admin-dashboard/scripts/amplify-lambda-invoke-policy.json"

echo "🔧 Applying Lambda invoke permissions to Amplify role..."
echo "Role: $ROLE_NAME"
echo "Policy: $POLICY_NAME"
echo ""

# Check if the policy file exists
if [ ! -f "$POLICY_FILE" ]; then
    echo "❌ Policy file not found: $POLICY_FILE"
    exit 1
fi

echo "📋 Policy file found: $POLICY_FILE"
echo ""

# Create the inline policy on the IAM role
echo "📝 Creating inline policy on role..."
aws iam put-role-policy \
    --role-name "$ROLE_NAME" \
    --policy-name "$POLICY_NAME" \
    --policy-document file://"$POLICY_FILE" \
    --region "$REGION"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully applied Lambda invoke permissions to Amplify role!"
    echo ""
    echo "The following Lambda functions can now be invoked during Amplify builds:"
    echo "  • lotto-backend-dev-getPhoneLines"
    echo "  • lotto-backend-dev-getHostAccounts"
    echo "  • lotto-backend-dev-getPhoneLinesCached"
    echo "  • lotto-backend-dev-getHostAccountsCached"
    echo "  • lotto-backend-dev-getAdminsCached"
    echo "  • lotto-backend-dev-getTelegramChatsCached"
    echo "  • All report aggregation functions"
    echo ""
    echo "🚀 You can now rebuild your Amplify app!"
else
    echo ""
    echo "❌ Failed to apply permissions. Please check your AWS credentials and try again."
    exit 1
fi
