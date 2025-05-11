# Hello World Lambda CDK Project

This project contains an AWS CDK application that deploys a Hello World Lambda function with API Gateway integration and a CI/CD pipeline.

## Project Structure

- `lib/aicoding_cdk-stack.ts`: Main application stack with Lambda function and API Gateway
- `lib/pipeline-stack.ts`: CI/CD pipeline stack using AWS CodePipeline and CodeCommit
- `lambda/hello-world/index.ts`: Lambda function code
- `bin/aicoding_cdk.ts`: Entry point for the CDK application
- `template.yaml`: SAM template for local testing
- `events/api-gateway-event.json`: Sample API Gateway event for testing

## Prerequisites

- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK v2 installed globally (`npm install -g aws-cdk`)
- AWS SAM CLI installed (`brew install aws-sam-cli` on macOS or see [SAM CLI Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html))
- Docker installed and running (required for SAM CLI local testing)
  - On macOS: Install Docker Desktop and ensure it's running
  - You can verify Docker is running with `docker ps`

## Local Testing with SAM CLI

You can test the Lambda function locally using the AWS SAM CLI:

### Option 1: Start a local API endpoint

```bash
# Start a local API endpoint
npm run sam:local
```

This will start a local API Gateway at http://localhost:3000. You can access the Hello World function at:

```
http://localhost:3000/hello
```

### Option 2: Invoke the Lambda function directly

```bash
# Invoke the Lambda function with a sample event
npm run sam:invoke -- -e events/api-gateway-event.json
```

### Option 3: Build the SAM application

```bash
# Build the SAM application
npm run sam:build
```

## Deployment Options

### Option 1: Direct Deployment

To deploy the application stack directly:

```bash
# Build the project
npm run build

# Deploy the application stack
npx cdk deploy AicodingCdkStack
```

### Option 2: Deploy via CI/CD Pipeline

To set up the CI/CD pipeline:

```bash
# Build the project
npm run build

# Deploy the pipeline stack
npx cdk deploy AicodingCdkPipelineStack
```

After deploying the pipeline stack:

1. Clone the CodeCommit repository using the URL from the stack outputs
2. Push your code to the repository
3. The pipeline will automatically deploy the application

## API Endpoint

After deployment, the API Gateway endpoint will be available in the stack outputs. You can access the Hello World function at:

```
https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/hello
```

## Useful Commands

* `npm run build`         Compile TypeScript to JavaScript
* `npm run watch`         Watch for changes and compile
* `npm run test`          Perform the Jest unit tests
* `npm run build:lambda`  Compile the Lambda function for local testing
* `npm run sam:local`     Start a local API Gateway endpoint
* `npm run sam:invoke`    Invoke the Lambda function locally
* `npm run sam:build`     Build the SAM application
* `npx cdk deploy`        Deploy this stack to your AWS account/region
* `npx cdk diff`          Compare deployed stack with current state
* `npx cdk synth`         Emit the synthesized CloudFormation template
