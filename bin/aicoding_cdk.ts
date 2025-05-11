#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AicodingCdkStack } from '../lib/aicoding_cdk-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

// For direct deployment without pipeline
new AicodingCdkStack(app, 'AicodingCdkStack', {
  /* Configure the stack to deploy to the specified AWS account */
  env: { 
    account: '049586541010', 
    region: 'us-east-1'
  },
  
  /* Add stack description */
  description: 'Hello World Lambda function deployed with CDK',
  
  /* Add tags for better resource management */
  tags: {
    Environment: 'Development',
    Project: 'HelloWorldLambda',
    ManagedBy: 'CDK'
  }
});

// For deployment via pipeline
new PipelineStack(app, 'AicodingCdkPipelineStack', {
  env: { 
    account: '049586541010', 
    region: 'us-east-1'
  },
  description: 'CI/CD Pipeline for the Hello World Lambda function',
  tags: {
    Environment: 'Development',
    Project: 'HelloWorldLambda',
    ManagedBy: 'CDK'
  }
});
