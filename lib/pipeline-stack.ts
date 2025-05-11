import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as pipelines from 'aws-cdk-lib/pipelines';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import { AicodingCdkStack } from './aicoding_cdk-stack';

export class PipelineStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create a CodeCommit repository
    const repo = new codecommit.Repository(this, 'AicodingCdkRepo', {
      repositoryName: 'aicoding-cdk-repo',
      description: 'Repository for the AicodingCDK project',
    });

    // Create the pipeline
    const pipeline = new pipelines.CodePipeline(this, 'Pipeline', {
      pipelineName: 'AicodingCdkPipeline',
      synth: new pipelines.CodeBuildStep('SynthStep', {
        input: pipelines.CodePipelineSource.codeCommit(repo, 'main'),
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

    // Output the repository clone URL
    new cdk.CfnOutput(this, 'RepositoryCloneUrlHttp', {
      value: repo.repositoryCloneUrlHttp,
      description: 'The HTTP URL to clone the repository',
    });

    new cdk.CfnOutput(this, 'RepositoryCloneUrlSsh', {
      value: repo.repositoryCloneUrlSsh,
      description: 'The SSH URL to clone the repository',
    });
  }
}

// Define a deployment stage
class DeployStage extends cdk.Stage {
  constructor(scope: Construct, id: string, props?: cdk.StageProps) {
    super(scope, id, props);

    // Create the application stack in this stage
    new AicodingCdkStack(this, 'AicodingCdkStack', {
      env: props?.env,
    });
  }
}
