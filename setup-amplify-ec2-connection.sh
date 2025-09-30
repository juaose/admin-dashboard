#!/bin/bash

# Setup script for connecting Amplify app to EC2 instance
# This script helps you configure the connection between your Amplify-hosted React app and EC2 server

echo "🔗 Amplify to EC2 Connection Setup"
echo "=================================="

# Check if required tools are available
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required but not installed. Please install it first."; exit 1; }

# Get EC2 instance information
echo ""
echo "📋 Step 1: Get your EC2 instance information"
echo "Please provide the following information:"

read -p "Enter your EC2 instance ID (e.g., i-1234567890abcdef0): " INSTANCE_ID
read -p "Enter your EC2 public IP address: " EC2_PUBLIC_IP
read -p "Enter your Amplify app ID: " AMPLIFY_APP_ID

# Validate inputs
if [[ -z "$INSTANCE_ID" || -z "$EC2_PUBLIC_IP" || -z "$AMPLIFY_APP_ID" ]]; then
    echo "❌ All fields are required. Please run the script again."
    exit 1
fi

echo ""
echo "🔍 Step 2: Checking EC2 instance details..."

# Get security group ID
SECURITY_GROUP_ID=$(aws ec2 describe-instances --instance-ids $INSTANCE_ID --query 'Reservations[0].Instances[0].SecurityGroups[0].GroupId' --output text 2>/dev/null)

if [[ "$SECURITY_GROUP_ID" == "None" || -z "$SECURITY_GROUP_ID" ]]; then
    echo "❌ Could not retrieve security group for instance $INSTANCE_ID"
    echo "Please check your instance ID and AWS credentials."
    exit 1
fi

echo "✅ Found security group: $SECURITY_GROUP_ID"

# Check if port 4005 is already open
echo ""
echo "🔍 Step 3: Checking security group rules..."

PORT_OPEN=$(aws ec2 describe-security-groups --group-ids $SECURITY_GROUP_ID --query "SecurityGroups[0].IpPermissions[?FromPort==\`4005\` && ToPort==\`4005\`]" --output text 2>/dev/null)

if [[ -z "$PORT_OPEN" ]]; then
    echo "⚠️  Port 4005 is not open. Adding security group rule..."
    
    # Add security group rule for port 4005
    aws ec2 authorize-security-group-ingress \
        --group-id $SECURITY_GROUP_ID \
        --protocol tcp \
        --port 4005 \
        --cidr 0.0.0.0/0 \
        --tag-specifications "ResourceType=security-group-rule,Tags=[{Key=Name,Value=Amplify-WebSocket-Access}]" 2>/dev/null
    
    if [[ $? -eq 0 ]]; then
        echo "✅ Successfully added port 4005 to security group"
    else
        echo "❌ Failed to add security group rule. You may need to add it manually:"
        echo "   - Go to EC2 Console > Security Groups > $SECURITY_GROUP_ID"
        echo "   - Add inbound rule: Custom TCP, Port 4005, Source: 0.0.0.0/0"
    fi
else
    echo "✅ Port 4005 is already open in security group"
fi

# Test port connectivity
echo ""
echo "🔍 Step 4: Testing port connectivity..."

if command -v nc >/dev/null 2>&1; then
    echo "Testing connection to $EC2_PUBLIC_IP:4005..."
    timeout 5 nc -zv $EC2_PUBLIC_IP 4005 2>/dev/null
    if [[ $? -eq 0 ]]; then
        echo "✅ Port 4005 is accessible"
    else
        echo "⚠️  Port 4005 is not accessible. Make sure your server is running."
    fi
else
    echo "⚠️  netcat (nc) not available. Please test manually: telnet $EC2_PUBLIC_IP 4005"
fi

# Set Amplify environment variable
echo ""
echo "🔍 Step 5: Setting Amplify environment variable..."

WEBSOCKET_URL="http://$EC2_PUBLIC_IP:4005"

aws amplify put-app --app-id $AMPLIFY_APP_ID --environment-variables NEXT_PUBLIC_WEBSOCKET_URL=$WEBSOCKET_URL 2>/dev/null

if [[ $? -eq 0 ]]; then
    echo "✅ Successfully set NEXT_PUBLIC_WEBSOCKET_URL in Amplify"
else
    echo "⚠️  Could not set environment variable automatically. Please set it manually:"
    echo "   - Go to Amplify Console > $AMPLIFY_APP_ID > App Settings > Environment variables"
    echo "   - Add: NEXT_PUBLIC_WEBSOCKET_URL = $WEBSOCKET_URL"
fi

# Trigger deployment
echo ""
echo "🔍 Step 6: Triggering Amplify deployment..."

read -p "Do you want to trigger a new deployment? (y/n): " DEPLOY_CHOICE

if [[ "$DEPLOY_CHOICE" == "y" || "$DEPLOY_CHOICE" == "Y" ]]; then
    # Get the main branch name (usually 'main' or 'master')
    BRANCH_NAME=$(aws amplify list-branches --app-id $AMPLIFY_APP_ID --query 'branches[0].branchName' --output text 2>/dev/null)
    
    if [[ "$BRANCH_NAME" != "None" && -n "$BRANCH_NAME" ]]; then
        aws amplify start-job --app-id $AMPLIFY_APP_ID --branch-name $BRANCH_NAME --job-type RELEASE 2>/dev/null
        
        if [[ $? -eq 0 ]]; then
            echo "✅ Deployment triggered successfully"
        else
            echo "⚠️  Could not trigger deployment automatically. Please deploy manually in Amplify Console."
        fi
    else
        echo "⚠️  Could not determine branch name. Please deploy manually in Amplify Console."
    fi
else
    echo "⚠️  Remember to deploy your Amplify app to apply the environment variable changes."
fi

# Summary
echo ""
echo "📋 Setup Summary"
echo "================"
echo "EC2 Instance ID: $INSTANCE_ID"
echo "EC2 Public IP: $EC2_PUBLIC_IP"
echo "Security Group: $SECURITY_GROUP_ID"
echo "WebSocket URL: $WEBSOCKET_URL"
echo "Amplify App ID: $AMPLIFY_APP_ID"
echo ""
echo "🎉 Setup complete! Your Amplify app should now be able to connect to your EC2 instance."
echo ""
echo "📝 Next steps:"
echo "1. Wait for Amplify deployment to complete"
echo "2. Ensure your server is running on EC2 (port 4005)"
echo "3. Test the connection by opening your Amplify app"
echo "4. Check browser console for WebSocket connection messages"
echo ""
echo "🔧 Troubleshooting:"
echo "- If connection fails, check EC2 server logs: pm2 logs"
echo "- Verify server is running: pm2 status"
echo "- Test port manually: telnet $EC2_PUBLIC_IP 4005"
echo ""
echo "📚 For detailed instructions, see: EC2_AMPLIFY_CONNECTION_SETUP.md"
