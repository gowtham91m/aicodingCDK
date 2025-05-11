import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class GeminiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Gemini Lambda function
    const geminiFunction = new nodejs.NodejsFunction(this, 'GeminiFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/gemini-function/index.ts'),
      bundling: {
        minify: true,
        sourceMap: true,
        esbuildArgs: {
          '--packages': 'bundle'
        },
      },
      description: 'A Lambda function that uses Google Gemini API',
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'your-api-key-here', // Replace with your actual API key or use environment variable
      },
    });

    // Create an API Gateway REST API
    const api = new apigateway.RestApi(this, 'GeminiApi', {
      restApiName: 'Gemini API',
      description: 'API Gateway for Gemini Lambda function',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create a resource and method to invoke the Gemini function
    const geminiResource = api.root.addResource('gemini');
    geminiResource.addMethod('POST', new apigateway.LambdaIntegration(geminiFunction, {
      proxy: true,
    }));

    // Output the Lambda function ARN
    new cdk.CfnOutput(this, 'GeminiFunctionArn', {
      value: geminiFunction.functionArn,
      description: 'The ARN of the Gemini Lambda function',
      exportName: 'GeminiStack-FunctionArn',
    });

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: `${api.url}gemini`,
      description: 'The URL of the Gemini API endpoint',
      exportName: 'GeminiStack-ApiEndpoint',
    });
  }
}
