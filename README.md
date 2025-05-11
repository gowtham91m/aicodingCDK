# Lambda CDK Project with Hello World and Gemini API

This project contains an AWS CDK application that deploys two Lambda functions:
1. A simple Hello World function with API Gateway integration
2. A Google Gemini API integration function
3. A CI/CD pipeline for automated deployment

## Project Structure

- `lib/aicoding_cdk-stack.ts`: Main application stack with Lambda functions and API Gateway
- `lib/pipeline-stack.ts`: CI/CD pipeline stack using AWS CodePipeline and CodeCommit
- `lambda/hello-world/index.ts`: Hello World Lambda function code
- `lambda/gemini-function/index.ts`: Gemini API Lambda function code
- `bin/aicoding_cdk.ts`: Entry point for the CDK application
- `template.yaml`: SAM template for local testing
- `events/api-gateway-event.json`: Sample API Gateway event for Hello World function
- `events/gemini-event.json`: Sample API Gateway event for Gemini function

## Prerequisites

- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK v2 installed globally (`npm install -g aws-cdk`)
- AWS SAM CLI installed (`brew install aws-sam-cli` on macOS or see [SAM CLI Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html))
- Docker installed and running (required for SAM CLI local testing)
  - On macOS: Install Docker Desktop and ensure it's running
  - You can verify Docker is running with `docker ps`

## Local Testing with SAM CLI

You can test both Lambda functions locally using the AWS SAM CLI:

### Option 1: Start a local API endpoint

```bash
# Start a local API endpoint
npm run sam:local
```

This will start a local API Gateway at http://localhost:3000. You can access:

- Hello World function: `http://localhost:3000/hello` (GET request)
- Gemini function: `http://localhost:3000/gemini` (POST request with JSON body)

Example curl command for testing the Gemini function locally:

```bash
curl -X POST \
  http://localhost:3000/gemini \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"What are the key benefits of using AWS Lambda for serverless computing?"}'
```

### Option 2: Invoke the Lambda functions directly

```bash
# Invoke the Hello World function with a sample event
npm run sam:invoke -- -e events/api-gateway-event.json

# Invoke the Gemini function with a sample event
npm run sam:gemini
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

## API Endpoints

After deployment, the API Gateway endpoints will be available in the stack outputs:

### Hello World Endpoint

```
https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/hello
```

### Gemini API Endpoint

```
https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/gemini
```

To use the Gemini API endpoint, send a POST request with a JSON body containing a prompt:

```bash
curl -X POST \
  https://{api-id}.execute-api.us-east-1.amazonaws.com/prod/gemini \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"What are the key benefits of using AWS Lambda for serverless computing?"}'
```

## Google Gemini API Setup

To use the Gemini API function, you need to:

1. Obtain a Google Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

2. Set the API key as an environment variable before deploying:

```bash
export GEMINI_API_KEY=your-api-key-here
```

3. Install the dependencies in the lambda/gemini-function directory:

```bash
cd lambda/gemini-function
npm install
```

4. For local testing, update the API key in the `env.json` file:

```json
{
  "GeminiFunction": {
    "GEMINI_API_KEY": "your-api-key-here"
  }
}
```

This file is used by the SAM CLI to provide environment variables to the Lambda function during local testing.

## Useful Commands

* `npm run build`         Compile TypeScript to JavaScript
* `npm run watch`         Watch for changes and compile
* `npm run test`          Perform the Jest unit tests
* `npm run build:lambda`  Compile the Hello World Lambda function
* `npm run build:gemini`  Compile the Gemini Lambda function
* `npm run sam:local`     Start a local API Gateway endpoint
* `npm run sam:invoke`    Invoke the Hello World function locally
* `npm run sam:gemini`    Invoke the Gemini function locally
* `npm run sam:build`     Build the SAM application
* `npx cdk deploy`        Deploy this stack to your AWS account/region
* `npx cdk diff`          Compare deployed stack with current state
* `npx cdk synth`         Emit the synthesized CloudFormation template
