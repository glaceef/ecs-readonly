import * as cdk from 'aws-cdk-lib';
import { RemovalPolicy, Tags } from 'aws-cdk-lib';
import { Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { AwsLogDriver, Compatibility, EcrImage, EfsVolumeConfiguration, NetworkMode, TaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { FileSystem } from 'aws-cdk-lib/aws-efs';
import { Role } from 'aws-cdk-lib/aws-iam';
import { LogGroup, RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

const PROJECT = 'sample-task';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, `${PROJECT}-vpc`, {
      vpcName: `${PROJECT}-vpc`,
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: SubnetType.PUBLIC,
        }
      ],
    });

    // EFS用のセキュリティグループ
    const efsSecurityGroup = new SecurityGroup(this, `${PROJECT}-efs-security-group`, {
      securityGroupName: `${PROJECT}-efs-security-group`,
      vpc,
    });
    // ポート2049番のTCP通信のみを許可
    efsSecurityGroup.addIngressRule(
      Peer.securityGroupId('sg-023a56a1fc16e2846'),
      Port.tcp(2049),
      'Allow inbound nfs traffics'
    );
    Tags.of(efsSecurityGroup).add('Name', `${PROJECT}-efs-security-group`);
    efsSecurityGroup.applyRemovalPolicy(RemovalPolicy.DESTROY);

    // EFS作成
    const efs = new FileSystem(this, `${PROJECT}-efs`, {
      fileSystemName: `${PROJECT}-efs`,
      vpc,
      vpcSubnets: vpc.selectSubnets(),
      securityGroup: efsSecurityGroup,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const volumeConfig = {
      name: "efs-volume",
      // this is the main config
      efsVolumeConfiguration: {
        fileSystemId: efs.fileSystemId,
      },
    };

    // タスク定義作成
    const taskExecutionRole = Role.fromRoleName(this, `${PROJECT}-execution-role`, `${PROJECT}-execution-role`);
    const taskDifinition = new TaskDefinition(this, `${PROJECT}-task-definition`, {
      compatibility: Compatibility.FARGATE,
      family: `${PROJECT}-ecs-family`,
      cpu: '256',
      memoryMiB: '512',
      networkMode: NetworkMode.AWS_VPC,
      executionRole: taskExecutionRole,
      ephemeralStorageGiB: 1, // GiB. デフォルトで20
      volumes: [volumeConfig],
    });

    const logGroup = new LogGroup(this, `${PROJECT}-log-group`, {
      logGroupName: `/aws/ecs/${PROJECT}`,
      retention: RetentionDays.ONE_WEEK,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    const logDriver = new AwsLogDriver({
      streamPrefix: PROJECT,
      logGroup,
    });

    const image = EcrImage.fromRegistry('437307506719.dkr.ecr.ap-northeast-1.amazonaws.com/sample-task:latest');
    const container = taskDifinition.addContainer(`${PROJECT}-ecs-container`, {
      containerName: `${PROJECT}-ecs-container`,
      image,
      memoryReservationMiB: 128,
      logging: logDriver,
      readonlyRootFilesystem: true, // readonly化
    });
    // EFSのマウントポイントを追加
    container.addMountPoints({
      containerPath: "/mnt/efs",
      sourceVolume: volumeConfig.name,
      readOnly: false,
    });
  }
}
