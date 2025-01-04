import { Stack, StackProps, RemovalPolicy, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { BuildConfig } from '../bin/build_config';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { AttributeType, Table, BillingMode } from 'aws-cdk-lib/aws-dynamodb';
import * as apigw from 'aws-cdk-lib/aws-apigateway'

export class YakarFarmhouseBookingsStack extends Stack {
  constructor(scope: Construct, id: string, config: BuildConfig, props?: StackProps) {
    super(scope, id, props);
    
    // 1. Create an S3 bucket for static website hosting
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

    // 2. Create our Lambda functions to handle requests
    const apiFunction = this.buildAPIFunction(config)

    // 3: Create API gateway
    const apiGateway = this.buildAPIGateway(config, apiFunction)

    // 4. Grant our Lambda functions access to our DynamoDB table
    dbTable.grantReadWriteData(apiFunction);

    // Output the website URL
    new CfnOutput(this, 'WebsiteURL', {
      value: staticWebsiteBucket.bucketWebsiteUrl, // URL for static website
      description: 'The URL of the static website bucket',
    });
  }
  
  private buildAPIFunction(config: BuildConfig){
    return new lambda.Function(this, 'APILambda', {
      runtime:lambda.Runtime.PYTHON_3_9,
      code: lambda.Code.fromAsset('deploy.zip'),
      handler: 'functions/main.handler',
      environment: {
        LOG_LEVEL: config.logLevel,
        REGION: config.region,
        ENVIRONMENT: config.environment
      } 
    });
  }

  private buildAPIGateway(config: BuildConfig, apiFunction: lambda.Function){
    const api_gateway = new apigw.LambdaRestApi(this, 'APIGatway', {
      restApiName: `BookingManagementAPI-${config.region}-${config.environment}`,
      handler: apiFunction,
      proxy: false
    })

    api_gateway.root.addResource('docs').addMethod('GET');

    //TODO: add token authorizer
    // const tokenAuthorizer = new apigw.TokenAuthorizer(this, 'Auothorizer',{
    //   handler: lambda.Function.fromFunctionArn(this, 'CustomAuthorizer', config.auothorizer_arn),
    //   identitySource: 'method.request.header.Authorization'
    // })

    api_gateway.root
      .addResource('bookings')
      .addResource('v1')
      // TODO: add token authorizer
      // .addProxy({
      //   anyMethod: false,
      //   defaultMethodOptions: {
      //     authorizer: tokenAuthorizer
      //   }
      // })
      .addMethod('POST');
      
    return api_gateway;
  }
}
