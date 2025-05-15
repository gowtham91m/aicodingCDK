# Lambda CDK Project with Hello World, Gemini API, and TTS

This project contains an AWS CDK application that deploys three Lambda functions as separate stacks:
1. A simple Hello World function with API Gateway integration
2. A Google Gemini API integration function
3. A Text-to-Speech (TTS) function with SSML support
4. A CI/CD pipeline for automated deployment

## Project Structure

- `lib/hello-world-stack.ts`: Stack for Hello World Lambda function with API Gateway
- `lib/gemini-stack.ts`: Stack for Gemini API Lambda function with API Gateway
- `lib/tts-stack.ts`: Stack for Text-to-Speech Lambda function with API Gateway
- `lib/pipeline-stack.ts`: CI/CD pipeline stack using AWS CodePipeline with GitHub integration
- `lambda/hello-world/index.ts`: Hello World Lambda function code
- `lambda/gemini-function/index.ts`: Gemini API Lambda function code
- `lambda/tts-function/index.ts`: Text-to-Speech Lambda function code
- `bin/aicoding_cdk.ts`: Entry point for the CDK application
- `template.yaml`: SAM template for local testing
- `events/api-gateway-event.json`: Sample API Gateway event for Hello World function
- `events/gemini-event.json`: Sample API Gateway event for Gemini function
- `events/tts-ssml-event.json`: Sample API Gateway event for TTS function with SSML

## Prerequisites

- Node.js 18.x or later
- AWS CLI configured with appropriate credentials
- AWS CDK v2 installed globally (`npm install -g aws-cdk`)
- AWS SAM CLI installed (`brew install aws-sam-cli` on macOS or see [SAM CLI Installation Guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html))
- Docker installed and running (required for SAM CLI local testing)
  - On macOS: Install Docker Desktop and ensure it's running
  - You can verify Docker is running with `docker ps`

## Local Testing with SAM CLI

You can test the Lambda functions locally using the AWS SAM CLI:

### Option 1: Start a local API endpoint

```bash
# Start a local API endpoint
npm run sam:local
```

This will start a local API Gateway at http://localhost:3000. You can access:

- Hello World function: `http://localhost:3000/hello` (GET request)
- Gemini function: `http://localhost:3000/gemini` (POST request with JSON body)
- TTS function: `http://localhost:3000/tts` (POST request with JSON body)

Example curl command for testing the Gemini function locally:

```bash
curl -X POST \
  http://localhost:3000/gemini \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"What are the key benefits of using AWS Lambda for serverless computing?"}'
```

Example curl command for testing the TTS function locally with plain text:

```bash
curl -X POST \
  http://localhost:3000/tts \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello, this is a test of the text to speech functionality.","voice":"en-US-Standard-A"}'
```

Example curl command for testing the TTS function with SSML:

```bash
curl -X POST \
  http://localhost:3000/tts \
  -H 'Content-Type: application/json' \
  -d '{"ssml":"<speak>Hello, this is a test of the <sub alias=\"text to speech\">TTS</sub> functionality with <emphasis>SSML</emphasis> support.</speak>","voice":"en-US-Standard-A"}'
```

### Option 2: Invoke the Lambda functions directly

```bash
# Invoke the Hello World function with a sample event
npm run sam:invoke -- -e events/api-gateway-event.json

# Invoke the Gemini function with a sample event
npm run sam:gemini

# Invoke the TTS function with a sample SSML event
npm run sam:tts-ssml
```

### Option 3: Build the SAM application

```bash
# Build the SAM application
npm run sam:build
```

## Deployment Options

### Option 1: Direct Deployment

To deploy the application stacks directly:

```bash
# Build the project
npm run build

# Deploy individual stacks
npx cdk deploy HelloWorldStack  # Deploy only the Hello World stack
npx cdk deploy AicodingCdkPipelineStack/Deploy/GeminiStack  # Deploy only the Gemini stack
npx cdk deploy AicodingCdkPipelineStack/Deploy/TTSStack  # Deploy only the TTS stack

# Or deploy all stacks
npx cdk deploy --all
```

### Option 2: Deploy via CI/CD Pipeline with GitHub

To set up the CI/CD pipeline with GitHub:

1. Create a GitHub connection in the AWS Console:
   - Go to AWS Console > Developer Tools > Settings > Connections
   - Click "Create connection"
   - Select "GitHub" as the provider
   - Follow the prompts to connect to your GitHub account
   - Note the connection ARN after it's created

2. Update the connection ARN in the pipeline stack:
   - Open `lib/pipeline-stack.ts`
   - Replace the placeholder connection ARN with your actual connection ARN
   - Update the GitHub owner and repository name to match your GitHub repository

3. Deploy the pipeline stack:
   ```bash
   # Build the project
   npm run build

   # Deploy the pipeline stack
   npx cdk deploy AicodingCdkPipelineStack
   ```

   Note: The pipeline is already configured to use the GitHub repository at `gowtham91m/aicodingCDK`. If you're using a different repository, update the `githubOwner` and `githubRepo` variables in `lib/pipeline-stack.ts`.

After deploying the pipeline stack:

1. The pipeline will automatically trigger when you push changes to your GitHub repository
2. You can monitor the pipeline in the AWS Console > CodePipeline
3. The pipeline will automatically deploy all Lambda functions

## API Endpoints

After deployment, the API Gateway endpoints will be available in the stack outputs:

### Hello World Endpoint

```
https://{hello-world-api-id}.execute-api.us-east-1.amazonaws.com/prod/hello
```

### Gemini API Endpoint

```
https://{gemini-api-id}.execute-api.us-east-1.amazonaws.com/prod/gemini
```

### TTS API Endpoint

```
https://{tts-api-id}.execute-api.us-east-1.amazonaws.com/prod/tts
```

Note: Each Lambda function has its own dedicated API Gateway, so the API IDs will be different.

The API endpoints have CORS configured to only allow requests from `https://interactivelearning.io`. This means:
- Only requests from this domain will be accepted
- Only POST and OPTIONS methods are allowed
- Credentials are allowed (for cookies/authentication)

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

## Google Text-to-Speech API Setup

To use the TTS function, you need to:

1. Create a Google Cloud project and enable the Text-to-Speech API
2. Create a service account with access to the Text-to-Speech API
3. Download the service account JSON key file

4. Set the service account credentials as an environment variable before deploying:

```bash
# Option 1: Use a service account JSON (preferred)
export GOOGLE_SERVICE_ACCOUNT='{"type":"service_account","project_id":"your-project-id",...}'

# Option 2: Use an API key
export GEMINI_API_KEY=your-api-key-here
```

5. Install the dependencies in the lambda/tts-function directory:

```bash
cd lambda/tts-function
npm install
```

6. For local testing, create a `.env` file in the project root with your credentials:

```
# Copy from .env.example and fill in your credentials
cp .env.example .env
```

## Using the TTS API

The TTS API supports both plain text and SSML input:

### Plain Text Input

```bash
curl -X POST \
  https://{tts-api-id}.execute-api.us-east-1.amazonaws.com/prod/tts \
  -H 'Content-Type: application/json' \
  -d '{"text":"Hello, this is a test of the text to speech functionality.","voice":"en-US-Standard-A"}'
```

### SSML Input

```bash
curl -X POST \
  https://{tts-api-id}.execute-api.us-east-1.amazonaws.com/prod/tts \
  -H 'Content-Type: application/json' \
  -d '{"ssml":"<speak>Hello, this is a test of the <sub alias=\"text to speech\">TTS</sub> functionality with <emphasis>SSML</emphasis> support.</speak>","voice":"en-US-Standard-A"}'
```

### Voice Options

The TTS API supports a wide variety of voices across different languages, accents, and voice types:

- **Standard voices**: Basic voices with good quality (e.g., `en-US-Standard-A`)
- **WaveNet voices**: Higher quality, more natural-sounding voices (e.g., `en-US-Wavenet-F`)
- **Neural2 voices**: Premium voices with the most natural-sounding speech (e.g., `en-US-Neural2-F`)
- **Studio voices**: Professional studio-quality voices (e.g., `en-US-Studio-O`)

For a complete list of available voices and how to use them, see:
- [TTS Voice Options](docs/tts-voices.md) - Comprehensive list of available voices
- [TTS Event Files](docs/tts-events.md) - Documentation for testing with different voices

The API returns a JSON response with a base64-encoded audio file:

```json
{
  "audioData": "base64-encoded-audio-data",
  "format": "mp3",
  "text": "The input text or SSML"
}
```

## Useful Commands

* `npm run build`         Compile TypeScript to JavaScript
* `npm run watch`         Watch for changes and compile
* `npm run test`          Perform the Jest unit tests
* `npm run build:lambda`  Compile the Hello World Lambda function
* `npm run build:gemini`  Compile the Gemini Lambda function
* `npm run build:tts`     Compile the TTS Lambda function
* `npm run sam:local`     Start a local API Gateway endpoint
* `npm run sam:invoke`    Invoke the Hello World function locally
* `npm run sam:gemini`    Invoke the Gemini function locally
* `npm run sam:tts-ssml`  Invoke the TTS function locally with SSML
* `npm run sam:build`     Build the SAM application
* `npx cdk deploy`        Deploy this stack to your AWS account/region
* `npx cdk diff`          Compare deployed stack with current state
* `npx cdk synth`         Emit the synthesized CloudFormation template
