#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { YakarFarmhouseBookingsStack } from '../lib/yakar_farmhouse_bookings-stack';
import { BuildConfig, getConfig } from './build_config';
import { CognitoUserPoolsAuthorizer } from 'aws-cdk-lib/aws-apigateway';

const app = new cdk.App();
const buildConfig: BuildConfig = getConfig(app)
const env = {
  account: buildConfig.accountId,
  region: buildConfig.region
}

const stack = new YakarFarmhouseBookingsStack(app, 'YakarFarmhouseBookingsStack', buildConfig, {
  env
});
addTags(stack, buildConfig)

function addTags(stack: YakarFarmhouseBookingsStack, config: BuildConfig) {
  const tags = cdk.Tags.of(stack);
  tags.add('ENVIRONMENT', config.environment)
  tags.add('BUILD_DATE', config.buildDate)
}