import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import * as process from 'process';

export class TTSStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the TTS Lambda function
    const ttsFunction = new nodejs.NodejsFunction(this, 'TTSFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/tts-function/index.ts'),
      bundling: {
        minify: true,
        sourceMap: true,
        esbuildArgs: {
          '--packages': 'bundle'
        },
      },
      description: 'A Lambda function that uses Google Gemini API for text-to-speech',
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        GEMINI_API_KEY: process.env.GEMINI_API_KEY || 'your-api-key-here',
        GOOGLE_SERVICE_ACCOUNT: process.env.GOOGLE_SERVICE_ACCOUNT || '{}', // Service account credentials JSON
      },
    });

    // Create an API Gateway REST API with method throttling
    const api = new apigateway.RestApi(this, 'TTSApi', {
      restApiName: 'TTS API',
      description: 'API Gateway for TTS Lambda function',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        // Apply throttling at the stage level
        throttlingRateLimit: 10,    // requests per second
        throttlingBurstLimit: 20,   // maximum concurrent requests
        // Enable CloudWatch metrics for monitoring
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      // Disable the default CORS configuration
      defaultCorsPreflightOptions: undefined,
    });
    
    // Create a resource for the TTS function
    const ttsResource = api.root.addResource('tts');
    
    // Add CORS configuration manually
    ttsResource.addCorsPreflight({
      allowOrigins: ['https://interactivelearning.io', 'http://localhost:3000'],
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
      allowCredentials: true,
      maxAge: cdk.Duration.seconds(300),
    });
    
    // Add the POST method to the resource
    ttsResource.addMethod('POST', new apigateway.LambdaIntegration(ttsFunction, {
      proxy: true,
    }), {
      // Add method responses for CORS headers
      methodResponses: [
        {
          statusCode: '200',
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
          },
        },
        {
          statusCode: '429', // Too Many Requests
          responseParameters: {
            'method.response.header.Access-Control-Allow-Origin': true,
            'method.response.header.Access-Control-Allow-Credentials': true,
          },
        },
      ],
    });

    // Apply method-level throttling using CfnStage
    const cfnStage = api.deploymentStage.node.defaultChild as apigateway.CfnStage;
    cfnStage.methodSettings = [
      {
        resourcePath: '/tts',
        httpMethod: 'POST',
        throttlingRateLimit: 5,     // More restrictive than stage-level
        throttlingBurstLimit: 10,
      },
    ];

    // Output the Lambda function ARN
    new cdk.CfnOutput(this, 'TTSFunctionArn', {
      value: ttsFunction.functionArn,
      description: 'The ARN of the TTS Lambda function',
      exportName: `${this.stackName}-TTSFunctionArn`,
    });

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'TTSApiEndpoint', {
      value: `${api.url}tts`,
      description: 'The URL of the TTS API endpoint',
      exportName: `${this.stackName}-TTSApiEndpoint`,
    });
  }
}
