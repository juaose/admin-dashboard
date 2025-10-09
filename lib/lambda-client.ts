/**
 * Lambda Client Utility
 * AWS SDK Lambda invocation for admin dashboard API
 */

import { LambdaClient, InvokeCommand } from "@aws-sdk/client-lambda";

// Initialize Lambda client
const lambdaClient = new LambdaClient({
  region: process.env.AWS_REGION || "us-east-1",
});

/**
 * Invoke a Lambda function
 * @param functionName - Name of the Lambda function (without environment suffix)
 * @param payload - Payload to send to the Lambda function
 * @returns Parsed response from Lambda
 */
export async function invokeLambda(
  functionName: string,
  payload: any = {}
): Promise<any> {
  try {
    // Get the current environment (dev, staging, prod)
    const stage = process.env.NODE_ENV === "production" ? "prod" : "dev";

    // Construct full function name with stage
    const fullFunctionName = `lotto-backend-${stage}-${functionName}`;

    console.log(`Invoking Lambda: ${fullFunctionName}`);

    const command = new InvokeCommand({
      FunctionName: fullFunctionName,
      InvocationType: "RequestResponse",
      Payload: JSON.stringify({
        queryStringParameters: payload.queryStringParameters || null,
        pathParameters: payload.pathParameters || null,
        body: payload.body ? JSON.stringify(payload.body) : null,
      }),
    });

    const response = await lambdaClient.send(command);

    // Parse the response
    if (response.Payload) {
      const payloadString = new TextDecoder().decode(response.Payload);
      const lambdaResponse = JSON.parse(payloadString);

      // Check if Lambda returned an error
      if (lambdaResponse.statusCode && lambdaResponse.statusCode >= 400) {
        const errorBody = JSON.parse(lambdaResponse.body);
        throw new Error(errorBody.error || "Lambda execution failed");
      }

      // Return the parsed body
      return JSON.parse(lambdaResponse.body);
    }

    throw new Error("No response payload from Lambda");
  } catch (error) {
    console.error(`Error invoking Lambda ${functionName}:`, error);
    throw error;
  }
}

/**
 * Invoke a Lambda function with query parameters
 */
export async function invokeLambdaWithQuery(
  functionName: string,
  queryParams: Record<string, string>
): Promise<any> {
  return invokeLambda(functionName, {
    queryStringParameters: queryParams,
  });
}

/**
 * Invoke a Lambda function with path parameters
 */
export async function invokeLambdaWithPath(
  functionName: string,
  pathParams: Record<string, string>,
  queryParams?: Record<string, string>
): Promise<any> {
  return invokeLambda(functionName, {
    pathParameters: pathParams,
    queryStringParameters: queryParams || null,
  });
}

/**
 * Invoke a Lambda function with a request body
 */
export async function invokeLambdaWithBody(
  functionName: string,
  body: any
): Promise<any> {
  return invokeLambda(functionName, {
    body,
  });
}
