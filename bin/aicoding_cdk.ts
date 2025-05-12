#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { GeminiStack } from '../lib/gemini-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

// Environment configuration
const env = { 
  account: '049586541010', 
  region: 'us-east-1'
};

// Common tags
const commonTags = {
  Environment: 'Development',
  ManagedBy: 'CDK'
};

// // Deploy Gemini Stack
// new GeminiStack(app, 'GeminiStack', {
//   env: env,
//   description: 'Gemini API Lambda function with API Gateway',
//   tags: {
//     ...commonTags,
//     Project: 'GeminiLambda',
//   }
// });

// For deployment via pipeline
new PipelineStack(app, 'AicodingCdkPipelineStack', {
  env: env,
  description: 'CI/CD Pipeline for the Lambda functions',
  tags: {
    ...commonTags,
    Project: 'LambdaPipeline',
  }
});
