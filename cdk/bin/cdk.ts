#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CdkStack } from '../lib/cdk-stack';

const app = new cdk.App();

const env = {
  account: '437307506719',
  region: 'ap-northeast-1',
}

new CdkStack(app, 'sample-task-stack', {
  env,
});