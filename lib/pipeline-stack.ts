import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as pipelines from 'aws-cdk-lib/pipelines';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import { HelloWorldStack } from './hello-world-stack';
import { GeminiStack } from './gemini-stack';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define the GitHub repository information
    const githubOwner = 'gowtham91m'; // Replace with your GitHub username
    const githubRepo = 'aicodingCDK'; // Replace with your GitHub repository name
    const githubBranch = 'main'; // Replace with your branch name

    // Create the pipeline with GitHub source
    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      pipelineName: 'AicodingCdkPipeline',
      synth: new pipelines.CodeBuildStep('SynthStep', {
        // Use GitHub as the source
        input: pipelines.CodePipelineSource.connection(`${githubOwner}/${githubRepo}`, githubBranch, {
          // You'll need to create a GitHub connection in the AWS console
          // and provide the connection ARN here
          connectionArn: 'arn:aws:codestar-connections:us-east-1:049586541010:connection/1c246387-1a8d-4e0b-a6a4-d531a8dc980a', 
        }),
        installCommands: [
          'npm ci',
        ],
        commands: [
          'npm run build',
          'npx cdk synth',
        ],
      }),
      dockerEnabledForSynth: true,
      dockerEnabledForSelfMutation: true,
    });

    // Add the application stage to the pipeline
    const deployStage = new DeployStage(this, 'Deploy', {
      env: {
        account: '049586541010',
        region: 'us-east-1',
      },
    });

    pipeline.addStage(deployStage);

    // Output the GitHub repository URL
    new cdk.CfnOutput(this, 'GitHubRepositoryUrl', {
      value: `https://github.com/${githubOwner}/${githubRepo}`,
      description: 'The GitHub repository URL',
    });

    // Add instructions for setting up GitHub connection
    new cdk.CfnOutput(this, 'GitHubConnectionInstructions', {
      value: 'To set up the GitHub connection, go to the AWS Console > Developer Tools > Settings > Connections and create a new connection to GitHub',
      description: 'Instructions for setting up GitHub connection',
    });
  }
}

// Define a deployment stage
class DeployStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    // Create the Hello World stack in this stage
    new HelloWorldStack(this, 'HelloWorldStack', {
      env: props?.env,
    });

    // Create the Gemini stack in this stage
    new GeminiStack(this, 'GeminiStack', {
      env: props?.env,
    });
  }
}
