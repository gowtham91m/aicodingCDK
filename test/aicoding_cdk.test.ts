import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { GeminiStack } from '../lib/gemini-stack';
import { test } from '@jest/globals';

// Example test for the GeminiStack
test('API Gateway Created', () => {
  // Uncomment to run the test
  // const app = new cdk.App();
  // const stack = new GeminiStack(app, 'TestGeminiStack');
  // const template = Template.fromStack(stack);
  
  // template.hasResourceProperties('AWS::ApiGateway::RestApi', {
  //   Name: 'Gemini API'
  // });
});
