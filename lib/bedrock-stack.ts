import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import * as iam from 'aws-cdk-lib/aws-iam';

export class BedrockStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the Bedrock Lambda function
    const bedrockFunction = new nodejs.NodejsFunction(this, 'BedrockFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/bedrock-function/index.ts'),
      bundling: {
        minify: true,
        sourceMap: true,
        esbuildArgs: {
          '--packages': 'bundle'
        },
      },
      description: 'A Lambda function that uses AWS Bedrock API',
      timeout: cdk.Duration.seconds(60),
      memorySize: 512, // Increased for Bedrock processing
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        BEDROCK_MODEL_ID: process.env.BEDROCK_MODEL_ID || 'anthropic.claude-3-haiku-20240307-v1:0', // Default to Claude 3 Sonnet
      },
    });

    // Add Bedrock permissions to the Lambda function
    bedrockFunction.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'bedrock:InvokeModel',
        'bedrock:InvokeModelWithResponseStream'
      ],
      resources: ['*'], // Restrict to specific models in production
    }));

    // Create an API Gateway REST API with method throttling
    const api = new apigateway.RestApi(this, 'BedrockApi', {
      restApiName: 'Bedrock API',
      description: 'API Gateway for AWS Bedrock Lambda function',
      deployOptions: {
        stageName: 'prod',
        tracingEnabled: true,
        // Apply throttling at the stage level (applies to all methods)
        throttlingRateLimit: 10,    // requests per second
        throttlingBurstLimit: 20,   // maximum concurrent requests
        // Enable CloudWatch metrics for monitoring
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      // Disable the default CORS configuration
      defaultCorsPreflightOptions: undefined,
    });
    
    // Create a resource for the Bedrock function
    const bedrockResource = api.root.addResource('bedrock');
    
    // Add CORS configuration manually
    bedrockResource.addCorsPreflight({
      allowOrigins: ['https://interactivelearning.io', 'http://localhost:3000'],
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
      allowCredentials: true,
      maxAge: cdk.Duration.seconds(300),
    });
    
    // Add the POST method to the resource
    bedrockResource.addMethod('POST', new apigateway.LambdaIntegration(bedrockFunction, {
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
        resourcePath: '/bedrock',
        httpMethod: 'POST',
        throttlingRateLimit: 5,     // More restrictive than stage-level
        throttlingBurstLimit: 10,
      },
    ];

    // Output the Lambda function ARN with a unique export name based on the stack ID
    new cdk.CfnOutput(this, 'BedrockFunctionArn', {
      value: bedrockFunction.functionArn,
      description: 'The ARN of the Bedrock Lambda function',
      exportName: `${this.stackName}-BedrockFunctionArn`,
    });

    // Output the API Gateway URL with a unique export name based on the stack ID
    new cdk.CfnOutput(this, 'BedrockApiEndpoint', {
      value: `${api.url}bedrock`,
      description: 'The URL of the Bedrock API endpoint',
      exportName: `${this.stackName}-BedrockApiEndpoint`,
    });
  }
}
