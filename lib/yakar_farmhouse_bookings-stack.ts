import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import {
  Cors,
  LambdaIntegration,
  RestApi,
  ApiKeySourceType,
  ApiKey,
  UsagePlan,
} from 'aws-cdk-lib/aws-apigateway';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';

export class YakarFarmhouseBookingsStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);
    
    // Create an S3 bucket for static website hosting
    const staticWebsiteBucket = new s3.Bucket(this, 'MyStaticWebsiteBucket', {
      websiteIndexDocument: 'templates/index.html', // Set the index document
      websiteErrorDocument: 'teamplates/error.html', // Set the error document
      removalPolicy: RemovalPolicy.DESTROY, // Will delete the bucket when the stack is deleted (use carefully)
      autoDeleteObjects: true, // Automatically delete objects when the bucket is deleted
    });
  
    // 1. Create our DynamoDB table
    const dbTable = new Table(this, 'DbTable', {
      partitionKey: { name: 'pk', type: AttributeType.STRING },
      removalPolicy: RemovalPolicy.DESTROY,
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // 2. Create our API Gateway
    const api = new RestApi(this, 'RestAPI', {
      restApiName: 'RestAPI',
      defaultCorsPreflightOptions: {
        allowOrigins: Cors.ALL_ORIGINS,
        allowMethods: Cors.ALL_METHODS,
      },
      apiKeySourceType: ApiKeySourceType.HEADER,
    });

    // 3. Create our API Key
    const apiKey = new ApiKey(this, 'ApiKey');

    // 4. Create a usage plan and add the API key to it
    const usagePlan = new UsagePlan(this, 'UsagePlan', {
      name: 'Usage Plan',
      apiStages: [
        {
          api,
          stage: api.deploymentStage,
        },
      ],
    });

    usagePlan.addApiKey(apiKey);

    // 5. Create our Lambda functions to handle requests
    const postsLambda = new lambda.Function(this, 'Function', {
      runtime: lambda.Runtime.PYTHON_3_12,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda-handler')),
    });

    const postLambda = new NodejsFunction(this, 'PostLambda', {
      entry: 'resources/endpoints/post.ts',
      handler: 'handler',
      environment: {
        TABLE_NAME: dbTable.tableName,
      },
    });

    // 6. Grant our Lambda functions access to our DynamoDB table
    dbTable.grantReadWriteData(postsLambda);
    dbTable.grantReadWriteData(postLambda);

    // 7. Define our API Gateway endpoints
    const posts = api.root.addResource('posts');
    const post = posts.addResource('{id}');

    // 8. Connect our Lambda functions to our API Gateway endpoints
    const postsIntegration = new LambdaIntegration(postsLambda);
    const postIntegration = new LambdaIntegration(postLambda);

    // 9. Define our API Gateway methods
    posts.addMethod('GET', postsIntegration, {
      apiKeyRequired: true,
    });
    posts.addMethod('POST', postsIntegration, {
      apiKeyRequired: true,
    });

    post.addMethod('GET', postIntegration, {
      apiKeyRequired: true,
    });
    post.addMethod('DELETE', postIntegration, {
      apiKeyRequired: true,
    });

    // Misc: Outputs
    new CfnOutput(this, 'API Key ID', {
      value: apiKey.keyId,
    });
    // Output the website URL
    new CfnOutput(this, 'WebsiteURL', {
      value: staticWebsiteBucket.bucketWebsiteUrl, // URL for static website
      description: 'The URL of the static website bucket',
    });
  }
}
