import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';
import * as process from 'process';

export class OpenAIStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the OpenAI Lambda function
    const openaiFunction = new nodejs.NodejsFunction(this, 'OpenAIFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'handler',
      entry: path.join(__dirname, '../lambda/openai-function/index.ts'),
      bundling: {
        minify: true,
        sourceMap: true,
        esbuildArgs: {
          '--packages': 'bundle'
        },
      },
      description: 'A Lambda function that uses OpenAI ChatGPT API',
      timeout: cdk.Duration.seconds(60),
      memorySize: 256,
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || 'your-api-key-here', // Replace with your actual API key or use environment variable
      },
    });

    // Create an API Gateway REST API with method throttling
    const api = new apigateway.RestApi(this, 'OpenAIApi', {
      restApiName: 'OpenAI API',
      description: 'API Gateway for OpenAI Lambda function',
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
    
    // Create a resource for the OpenAI function
    const openaiResource = api.root.addResource('openai');
    
    // Add CORS configuration manually
    openaiResource.addCorsPreflight({
      allowOrigins: ['https://interactivelearning.io', 'http://localhost:3000'],
      allowMethods: ['POST', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization', 'X-Amz-Date', 'X-Api-Key', 'X-Amz-Security-Token'],
      allowCredentials: true,
      maxAge: cdk.Duration.seconds(300),
    });
    
    // Add the POST method to the resource
    openaiResource.addMethod('POST', new apigateway.LambdaIntegration(openaiFunction, {
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
        resourcePath: '/openai',
        httpMethod: 'POST',
        throttlingRateLimit: 5,     // More restrictive than stage-level
        throttlingBurstLimit: 10,
      },
    ];

    // Output the Lambda function ARN with a unique export name based on the stack ID
    new cdk.CfnOutput(this, 'OpenAIFunctionArn', {
      value: openaiFunction.functionArn,
      description: 'The ARN of the OpenAI Lambda function',
      exportName: `${this.stackName}-OpenAIFunctionArn`,
    });

    // Output the API Gateway URL with a unique export name based on the stack ID
    new cdk.CfnOutput(this, 'OpenAIApiEndpoint', {
      value: `${api.url}openai`,
      description: 'The URL of the OpenAI API endpoint',
      exportName: `${this.stackName}-OpenAIApiEndpoint`,
    });
  }
}
