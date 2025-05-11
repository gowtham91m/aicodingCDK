import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class AicodingCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Hello World Lambda function
    const helloWorldFunction = new nodejs.NodejsFunction(this, 'HelloWorldFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/hello-world/index.ts'),
      bundling: {
        minify: true,
        sourceMap: true,
        esbuildArgs: {
          '--packages': 'bundle'
        },
      },
      description: 'A simple Hello World Lambda function',
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
      },
    });

    // Create an API Gateway REST API
    const api = new apigateway.RestApi(this, 'HelloWorldApi', {
      restApiName: 'Hello World API',
      description: 'API Gateway for Hello World Lambda function',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

    // Create a resource and method to invoke the Lambda function
    const helloResource = api.root.addResource('hello');
    helloResource.addMethod('GET', new apigateway.LambdaIntegration(helloWorldFunction, {
      proxy: true,
    }));

    // Output the Lambda function ARN
    new cdk.CfnOutput(this, 'HelloWorldFunctionArn', {
      value: helloWorldFunction.functionArn,
      description: 'The ARN of the Hello World Lambda function',
      exportName: 'HelloWorldFunctionArn',
    });

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

    // Create a resource and method to invoke the Gemini function
    const geminiResource = api.root.addResource('gemini');
    geminiResource.addMethod('POST', new apigateway.LambdaIntegration(geminiFunction, {
      proxy: true,
    }));

    // Output the Lambda function ARN
    new cdk.CfnOutput(this, 'GeminiFunctionArn', {
      value: geminiFunction.functionArn,
      description: 'The ARN of the Gemini Lambda function',
      exportName: 'GeminiFunctionArn',
    });

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: `${api.url}hello`,
      description: 'The URL of the Hello World API endpoint',
      exportName: 'HelloWorldApiEndpoint',
    });

    // Output the Gemini API Gateway URL
    new cdk.CfnOutput(this, 'GeminiApiEndpoint', {
      value: `${api.url}gemini`,
      description: 'The URL of the Gemini API endpoint',
      exportName: 'GeminiApiEndpoint',
    });
  }
}
