# AWS Deployment Guide

> **Deploy Agentik OS on Amazon Web Services with production-grade architecture**

Complete guide for deploying Agentik OS on AWS using ECS Fargate, RDS, ElastiCache, and other managed services.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Prerequisites](#prerequisites)
3. [Infrastructure Setup](#infrastructure-setup)
4. [Database Configuration](#database-configuration)
5. [Container Deployment](#container-deployment)
6. [Load Balancing & Auto-Scaling](#load-balancing--auto-scaling)
7. [Caching & Session Management](#caching--session-management)
8. [Monitoring & Logging](#monitoring--logging)
9. [Security & Compliance](#security--compliance)
10. [Cost Optimization](#cost-optimization)
11. [CI/CD with AWS CodePipeline](#cicd-with-aws-codepipeline)
12. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Production Architecture

```
                       ┌─────────────────────┐
                       │  Amazon CloudFront  │
                       │  (Global CDN)       │
                       └──────────┬──────────┘
                                  │
                       ┌──────────▼──────────┐
                       │  Application Load   │
                       │  Balancer (ALB)     │
                       └──────────┬──────────┘
                                  │
            ┌────────────────────┼────────────────────┐
            │                    │                    │
    ┌───────▼───────┐   ┌───────▼───────┐   ┌───────▼───────┐
    │  ECS Fargate  │   │  ECS Fargate  │   │  ECS Fargate  │
    │  (Runtime)    │   │  (Runtime)    │   │  (Runtime)    │
    │  Task 1       │   │  Task 2       │   │  Task 3       │
    └───────┬───────┘   └───────┬───────┘   └───────┬───────┘
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    │                         │
          ┌─────────▼─────────┐    ┌─────────▼─────────┐
          │  ElastiCache       │    │  Convex Cloud     │
          │  (Redis)           │    │  (Database)       │
          └────────────────────┘    └───────────────────┘
```

### Services Used

| AWS Service | Purpose | Alternative |
|-------------|---------|-------------|
| **ECS Fargate** | Serverless container runtime | EKS, EC2 |
| **Application Load Balancer** | HTTPS routing & health checks | NLB, CloudFront |
| **CloudFront** | Global CDN for dashboard | N/A |
| **ElastiCache (Redis)** | Session + rate limiting cache | MemoryDB |
| **Secrets Manager** | API keys, credentials | Parameter Store |
| **CloudWatch** | Logs, metrics, alarms | Third-party |
| **Route 53** | DNS management | External DNS |
| **ACM** | SSL/TLS certificates | Let's Encrypt |
| **S3** | Static assets, logs, backups | N/A |

---

## Prerequisites

### 1. AWS Account Setup

```bash
# Install AWS CLI
brew install awscli  # macOS
# or: sudo apt-get install awscli  # Linux

# Configure credentials
aws configure
# AWS Access Key ID: [your-key]
# AWS Secret Access Key: [your-secret]
# Default region: us-east-1
# Default output format: json
```

### 2. Required IAM Permissions

Create an IAM user with these policies:
- `AmazonECS_FullAccess`
- `AmazonEC2ContainerRegistryFullAccess`
- `ElastiCacheFullAccess`
- `SecretsManagerReadWrite`
- `CloudWatchFullAccess`
- `AWSCloudFormationFullAccess`

### 3. Tools Installation

```bash
# Install CDK (Infrastructure as Code)
npm install -g aws-cdk

# Install ECS CLI
brew install amazon-ecs-cli  # macOS

# Install Terraform (alternative to CDK)
brew install terraform  # macOS
```

---

## Infrastructure Setup

### Option 1: AWS CDK (Recommended)

Create `infrastructure/aws-cdk/lib/agentik-stack.ts`:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class AgentikStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC
    const vpc = new ec2.Vpc(this, 'AgentikVPC', {
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'AgentikCluster', {
      vpc,
      clusterName: 'agentik-production',
      containerInsights: true,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'AgentikTask', {
      memoryLimitMiB: 2048,
      cpu: 1024,
    });

    // Container
    const container = taskDefinition.addContainer('AgentikRuntime', {
      image: ecs.ContainerImage.fromRegistry('your-ecr-repo/agentik-runtime:latest'),
      logging: ecs.LogDrivers.awsLogs({ streamPrefix: 'agentik' }),
      environment: {
        NODE_ENV: 'production',
        CONVEX_URL: process.env.CONVEX_URL!,
      },
      secrets: {
        ANTHROPIC_API_KEY: ecs.Secret.fromSecretsManager(
          secretsmanager.Secret.fromSecretNameV2(this, 'AnthropicKey', 'anthropic-api-key')
        ),
      },
      portMappings: [{ containerPort: 3000 }],
    });

    // Fargate Service
    const service = new ecs.FargateService(this, 'AgentikService', {
      cluster,
      taskDefinition,
      desiredCount: 3,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'AgentikALB', {
      vpc,
      internetFacing: true,
    });

    const listener = alb.addListener('HttpsListener', {
      port: 443,
      certificates: [/* Import from ACM */],
    });

    listener.addTargets('AgentikTarget', {
      port: 3000,
      targets: [service],
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    // Auto Scaling
    const scaling = service.autoScaleTaskCount({
      minCapacity: 3,
      maxCapacity: 20,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
    });

    // ElastiCache Redis
    const securityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc,
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis access from VPC'
    );

    const subnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Agentik Redis',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    const redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: 'cache.t3.medium',
      engine: 'redis',
      numCacheNodes: 1,
      vpcSecurityGroupIds: [securityGroup.securityGroupId],
      cacheSubnetGroupName: subnetGroup.ref,
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: redisCluster.attrRedisEndpointAddress,
    });
  }
}
```

**Deploy:**

```bash
cd infrastructure/aws-cdk
cdk bootstrap  # First time only
cdk deploy --all
```

### Option 2: Terraform

Create `infrastructure/terraform/main.tf`:

```hcl
provider "aws" {
  region = "us-east-1"
}

# VPC
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "~> 5.0"

  name = "agentik-vpc"
  cidr = "10.0.0.0/16"

  azs             = ["us-east-1a", "us-east-1b", "us-east-1c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]

  enable_nat_gateway = true
  single_nat_gateway = false
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "agentik-production"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Task Definition
resource "aws_ecs_task_definition" "agentik" {
  family                   = "agentik-runtime"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([{
    name      = "agentik-runtime"
    image     = "${aws_ecr_repository.agentik.repository_url}:latest"
    essential = true

    portMappings = [{
      containerPort = 3000
      protocol      = "tcp"
    }]

    environment = [
      { name = "NODE_ENV", value = "production" },
      { name = "CONVEX_URL", value = var.convex_url }
    ]

    secrets = [
      {
        name      = "ANTHROPIC_API_KEY"
        valueFrom = aws_secretsmanager_secret.anthropic_key.arn
      }
    ]

    logConfiguration = {
      logDriver = "awslogs"
      options = {
        "awslogs-group"         = "/ecs/agentik-runtime"
        "awslogs-region"        = "us-east-1"
        "awslogs-stream-prefix" = "ecs"
      }
    }
  }])
}

# Fargate Service
resource "aws_ecs_service" "agentik" {
  name            = "agentik-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.agentik.arn
  desired_count   = 3
  launch_type     = "FARGATE"

  network_configuration {
    subnets          = module.vpc.private_subnets
    security_groups  = [aws_security_group.ecs_tasks.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.agentik.arn
    container_name   = "agentik-runtime"
    container_port   = 3000
  }

  depends_on = [aws_lb_listener.https]
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "agentik-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.vpc.public_subnets
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate.main.arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.agentik.arn
  }
}

# Auto Scaling
resource "aws_appautoscaling_target" "ecs_target" {
  max_capacity       = 20
  min_capacity       = 3
  resource_id        = "service/${aws_ecs_cluster.main.name}/${aws_ecs_service.agentik.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "ecs_cpu" {
  name               = "cpu-auto-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.ecs_target.resource_id
  scalable_dimension = aws_appautoscaling_target.ecs_target.scalable_dimension
  service_namespace  = aws_appautoscaling_target.ecs_target.service_namespace

  target_tracking_scaling_policy_configuration {
    target_value       = 70.0
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
  }
}
```

**Deploy:**

```bash
cd infrastructure/terraform
terraform init
terraform plan
terraform apply
```

---

## Database Configuration

### Convex Cloud (Recommended)

```bash
# Create production deployment
bunx convex dev --once
bunx convex deploy --prod

# Get production URL
bunx convex data
# Copy deployment URL (e.g., https://xxx.convex.cloud)
```

**Store in AWS Secrets Manager:**

```bash
aws secretsmanager create-secret \
  --name agentik/convex-url \
  --secret-string "https://xxx.convex.cloud"
```

### Alternative: Self-Hosted PostgreSQL on RDS

```typescript
// In CDK stack
import * as rds from 'aws-cdk-lib/aws-rds';

const database = new rds.DatabaseInstance(this, 'AgentikDB', {
  engine: rds.DatabaseInstanceEngine.postgres({
    version: rds.PostgresEngineVersion.VER_15_4,
  }),
  instanceType: ec2.InstanceType.of(
    ec2.InstanceClass.T3,
    ec2.InstanceSize.MEDIUM
  ),
  vpc,
  vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
  multiAz: true,
  allocatedStorage: 100,
  maxAllocatedStorage: 500,
  storageEncrypted: true,
  backupRetention: cdk.Duration.days(7),
  deletionProtection: true,
});
```

---

## Container Deployment

### 1. Create ECR Repository

```bash
# Create repository
aws ecr create-repository \
  --repository-name agentik-runtime \
  --image-scanning-configuration scanOnPush=true \
  --encryption-configuration encryptionType=AES256

# Get login credentials
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com
```

### 2. Build and Push Docker Image

```bash
# Build optimized image
docker build -t agentik-runtime:latest \
  --platform linux/amd64 \
  -f packages/runtime/Dockerfile .

# Tag for ECR
docker tag agentik-runtime:latest \
  YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/agentik-runtime:latest

# Push to ECR
docker push \
  YOUR_AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/agentik-runtime:latest
```

### 3. Multi-Stage Dockerfile

Create `packages/runtime/Dockerfile`:

```dockerfile
# Stage 1: Builder
FROM oven/bun:1.2-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lockb ./
COPY packages/runtime/package.json ./packages/runtime/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source
COPY packages/runtime ./packages/runtime
COPY packages/shared ./packages/shared

# Build
RUN cd packages/runtime && bun run build

# Stage 2: Production
FROM oven/bun:1.2-alpine

WORKDIR /app

# Copy only production dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder /app/bun.lockb ./
COPY --from=builder /app/packages/runtime/package.json ./packages/runtime/
COPY --from=builder /app/packages/shared/package.json ./packages/shared/

RUN bun install --production --frozen-lockfile

# Copy built artifacts
COPY --from=builder /app/packages/runtime/dist ./packages/runtime/dist
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD bun run packages/runtime/dist/health.js || exit 1

# Run as non-root
USER bun
EXPOSE 3000

CMD ["bun", "run", "packages/runtime/dist/index.js"]
```

---

## Load Balancing & Auto-Scaling

### Application Load Balancer Configuration

**Health Check Settings:**

```typescript
healthCheck: {
  path: '/health',
  interval: cdk.Duration.seconds(30),
  timeout: cdk.Duration.seconds(5),
  healthyThresholdCount: 2,
  unhealthyThresholdCount: 3,
  healthyHttpCodes: '200',
}
```

**Implement Health Endpoint:**

```typescript
// packages/runtime/src/health.ts
export async function healthCheck() {
  const checks = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: Date.now(),
    services: {
      convex: await checkConvex(),
      redis: await checkRedis(),
      memory: checkMemory(),
    },
  };

  const allHealthy = Object.values(checks.services).every(s => s.healthy);

  return {
    ...checks,
    healthy: allHealthy,
  };
}

async function checkConvex() {
  try {
    await convex.query(api.internal.health);
    return { healthy: true, latency: 0 };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

async function checkRedis() {
  try {
    await redis.ping();
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error.message };
  }
}

function checkMemory() {
  const usage = process.memoryUsage();
  const percentUsed = (usage.heapUsed / usage.heapTotal) * 100;

  return {
    healthy: percentUsed < 90,
    percentUsed: Math.round(percentUsed),
  };
}
```

### Auto-Scaling Policies

**CPU-Based Scaling:**

```typescript
scaling.scaleOnCpuUtilization('CpuScaling', {
  targetUtilizationPercent: 70,
  scaleInCooldown: cdk.Duration.seconds(300),  // 5 min
  scaleOutCooldown: cdk.Duration.seconds(60),  // 1 min
});
```

**Request-Based Scaling:**

```typescript
scaling.scaleOnRequestCount('RequestScaling', {
  requestsPerTarget: 1000,
  targetGroup: listener.addTargets('...').targetGroup,
});
```

**Custom Metric Scaling (Agent Count):**

```typescript
const agentCountMetric = new cloudwatch.Metric({
  namespace: 'Agentik',
  metricName: 'ActiveAgents',
  statistic: 'Average',
});

scaling.scaleOnMetric('AgentCountScaling', {
  metric: agentCountMetric,
  scalingSteps: [
    { upper: 100, change: 0 },
    { lower: 100, change: +1 },
    { lower: 500, change: +3 },
    { lower: 1000, change: +5 },
  ],
  adjustmentType: AdjustmentType.CHANGE_IN_CAPACITY,
});
```

---

## Caching & Session Management

### ElastiCache Redis Setup

**Connection Configuration:**

```typescript
import { createClient } from 'redis';

const redis = createClient({
  socket: {
    host: process.env.REDIS_ENDPOINT,
    port: 6379,
    tls: true,  // Enable TLS in production
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Too many retries');
      }
      return Math.min(retries * 50, 500);
    },
  },
});

redis.on('error', (err) => {
  console.error('Redis Client Error', err);
});

await redis.connect();
```

**Caching Patterns:**

```typescript
// Session caching
async function getSession(sessionId: string) {
  const cached = await redis.get(`session:${sessionId}`);
  if (cached) return JSON.parse(cached);

  const session = await convex.query(api.sessions.get, { sessionId });
  await redis.setEx(`session:${sessionId}`, 3600, JSON.stringify(session));

  return session;
}

// Rate limiting
async function checkRateLimit(userId: string): Promise<boolean> {
  const key = `ratelimit:${userId}`;
  const count = await redis.incr(key);

  if (count === 1) {
    await redis.expire(key, 60);  // 1 minute window
  }

  return count <= 100;  // 100 requests per minute
}

// Agent response caching
async function getCachedResponse(prompt: string) {
  const hash = hashPrompt(prompt);
  const cached = await redis.get(`response:${hash}`);

  if (cached) {
    return {
      cached: true,
      response: JSON.parse(cached),
    };
  }

  return { cached: false };
}
```

---

## Monitoring & Logging

### CloudWatch Configuration

**Log Groups:**

```typescript
const logGroup = new logs.LogGroup(this, 'AgentikLogs', {
  logGroupName: '/ecs/agentik-runtime',
  retention: logs.RetentionDays.ONE_MONTH,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

**Custom Metrics:**

```typescript
import { CloudWatchClient, PutMetricDataCommand } from '@aws-sdk/client-cloudwatch';

const cloudwatch = new CloudWatchClient({ region: 'us-east-1' });

async function recordMetric(name: string, value: number, unit = 'Count') {
  await cloudwatch.send(new PutMetricDataCommand({
    Namespace: 'Agentik',
    MetricData: [{
      MetricName: name,
      Value: value,
      Unit: unit,
      Timestamp: new Date(),
      Dimensions: [
        { Name: 'Environment', Value: 'production' },
        { Name: 'Service', Value: 'runtime' },
      ],
    }],
  }));
}

// Usage
await recordMetric('AgentCreated', 1);
await recordMetric('MessageProcessed', 1);
await recordMetric('TokensUsed', 1847, 'Count');
await recordMetric('ResponseTime', 234, 'Milliseconds');
```

**Alarms:**

```typescript
// High error rate alarm
const errorAlarm = new cloudwatch.Alarm(this, 'HighErrorRate', {
  metric: new cloudwatch.Metric({
    namespace: 'AWS/ECS',
    metricName: 'TargetResponseTime',
    statistic: 'Average',
    dimensionsMap: {
      ServiceName: service.serviceName,
    },
  }),
  threshold: 5000,  // 5 seconds
  evaluationPeriods: 2,
  comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
  alarmDescription: 'Alert when response time exceeds 5s',
});

// Send to SNS for notifications
const topic = new sns.Topic(this, 'AlertTopic');
errorAlarm.addAlarmAction(new actions.SnsAction(topic));
```

### X-Ray Tracing

```typescript
import { AWSXRay } from 'aws-xray-sdk-core';
import AWS from 'aws-sdk';

// Instrument AWS SDK
const instrumentedAWS = AWSXRay.captureAWS(AWS);

// Instrument HTTP calls
AWSXRay.captureHTTPsGlobal(require('http'));
AWSXRay.captureHTTPsGlobal(require('https'));

// Custom segments
const segment = AWSXRay.getSegment();
const subsegment = segment.addNewSubsegment('ProcessMessage');

try {
  // Your code
  subsegment.addAnnotation('userId', user.id);
  subsegment.addMetadata('message', message);
} catch (error) {
  subsegment.addError(error);
  throw error;
} finally {
  subsegment.close();
}
```

---

## Security & Compliance

### Secrets Management

```bash
# Store API keys
aws secretsmanager create-secret \
  --name agentik/anthropic-api-key \
  --secret-string "sk-ant-..."

aws secretsmanager create-secret \
  --name agentik/openai-api-key \
  --secret-string "sk-..."

# Access in code
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

const client = new SecretsManagerClient({ region: 'us-east-1' });

async function getSecret(secretName: string) {
  const response = await client.send(
    new GetSecretValueCommand({ SecretId: secretName })
  );
  return response.SecretString;
}

const anthropicKey = await getSecret('agentik/anthropic-api-key');
```

### VPC Security Groups

**ECS Tasks Security Group:**

```typescript
const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
  vpc,
  description: 'Allow traffic to ECS tasks',
  allowAllOutbound: true,
});

// Allow traffic from ALB only
ecsSecurityGroup.addIngressRule(
  albSecurityGroup,
  ec2.Port.tcp(3000),
  'Allow ALB traffic'
);
```

**ALB Security Group:**

```typescript
const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
  vpc,
  description: 'Allow HTTPS traffic to ALB',
  allowAllOutbound: true,
});

// Allow HTTPS from internet
albSecurityGroup.addIngressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(443),
  'Allow HTTPS from internet'
);
```

### IAM Roles

**Task Execution Role** (pulls images, writes logs):

```typescript
const executionRole = new iam.Role(this, 'ExecutionRole', {
  assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  managedPolicies: [
    iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
  ],
});

// Allow reading secrets
executionRole.addToPolicy(new iam.PolicyStatement({
  actions: ['secretsmanager:GetSecretValue'],
  resources: ['arn:aws:secretsmanager:*:*:secret:agentik/*'],
}));
```

**Task Role** (application permissions):

```typescript
const taskRole = new iam.Role(this, 'TaskRole', {
  assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
});

// Allow S3 access for file uploads
taskRole.addToPolicy(new iam.PolicyStatement({
  actions: ['s3:PutObject', 's3:GetObject'],
  resources: ['arn:aws:s3:::agentik-uploads/*'],
}));

// Allow CloudWatch metrics
taskRole.addToPolicy(new iam.PolicyStatement({
  actions: ['cloudwatch:PutMetricData'],
  resources: ['*'],
}));
```

### Encryption

**Enable encryption at rest:**

```typescript
// S3 bucket
const bucket = new s3.Bucket(this, 'AgentikBucket', {
  encryption: s3.BucketEncryption.S3_MANAGED,
  enforceSSL: true,
});

// EBS volumes (for EC2-based deployment)
blockDeviceMappings: [{
  deviceName: '/dev/xvda',
  ebs: {
    encrypted: true,
    kmsKeyId: kmsKey.keyArn,
  },
}],
```

---

## Cost Optimization

### 1. Right-Sizing Instances

**Monitor and adjust:**

```bash
# Check CPU/memory utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ServiceName,Value=agentik-service \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-07T23:59:59Z \
  --period 3600 \
  --statistics Average
```

**Recommendations:**

| CPU Avg | Memory Avg | Fargate Size | Monthly Cost |
|---------|-----------|--------------|--------------|
| <30% | <50% | 0.5 vCPU, 1GB | $30 |
| 30-60% | 50-75% | 1 vCPU, 2GB | $60 |
| 60-80% | 75-85% | 2 vCPU, 4GB | $120 |
| >80% | >85% | 4 vCPU, 8GB | $240 |

### 2. Spot Instances (for non-critical workloads)

```typescript
const spotCapacityProvider = new ecs.CfnCapacityProvider(this, 'SpotCapacity', {
  autoScalingGroupProvider: {
    autoScalingGroupArn: asg.autoScalingGroupArn,
    managedScaling: {
      status: 'ENABLED',
      targetCapacity: 100,
    },
    managedTerminationProtection: 'ENABLED',
  },
});

cluster.addCapacityProvider(spotCapacityProvider);

// Mix of Spot (70%) and On-Demand (30%)
const service = new ecs.Ec2Service(this, 'Service', {
  cluster,
  taskDefinition,
  capacityProviderStrategies: [
    {
      capacityProvider: spotCapacityProvider.ref,
      weight: 70,
    },
    {
      capacityProvider: 'FARGATE',
      weight: 30,
      base: 2,  // Always keep 2 on-demand
    },
  ],
});
```

### 3. Reserved Capacity (for predictable workloads)

Purchase Savings Plans for 30-60% discount:

```bash
# Calculate current usage
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity MONTHLY \
  --metrics BlendedCost \
  --filter file://fargate-filter.json

# Recommendations
aws ce get-savings-plans-purchase-recommendation \
  --savings-plans-type COMPUTE_SP \
  --term-in-years ONE_YEAR \
  --payment-option PARTIAL_UPFRONT \
  --lookback-period-in-days SIXTY_DAYS
```

### 4. Data Transfer Optimization

**Use CloudFront for static assets:**

```typescript
const distribution = new cloudfront.Distribution(this, 'Distribution', {
  defaultBehavior: {
    origin: new origins.S3Origin(bucket),
    cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
    viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
  },
});
```

**Costs breakdown:**

| Service | Monthly Cost (estimate) |
|---------|------------------------|
| ECS Fargate (3 tasks, 1 vCPU, 2GB each) | $180 |
| Application Load Balancer | $25 |
| ElastiCache (t3.medium) | $50 |
| Data Transfer (100GB out) | $9 |
| CloudWatch Logs (50GB) | $25 |
| **Total** | **~$289/month** |

---

## CI/CD with AWS CodePipeline

### Complete Pipeline Setup

```typescript
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';

// Source stage
const sourceOutput = new codepipeline.Artifact();
const sourceAction = new codepipeline_actions.GitHubSourceAction({
  actionName: 'GitHub_Source',
  owner: 'your-org',
  repo: 'agentik-os',
  oauthToken: cdk.SecretValue.secretsManager('github-token'),
  output: sourceOutput,
  branch: 'main',
});

// Build stage
const buildProject = new codebuild.PipelineProject(this, 'BuildProject', {
  environment: {
    buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
    privileged: true,  // Required for Docker
  },
  buildSpec: codebuild.BuildSpec.fromObject({
    version: '0.2',
    phases: {
      pre_build: {
        commands: [
          'echo Logging in to Amazon ECR...',
          'aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com',
          'COMMIT_HASH=$(echo $CODEBUILD_RESOLVED_SOURCE_VERSION | cut -c 1-7)',
          'IMAGE_TAG=${COMMIT_HASH:=latest}',
        ],
      },
      build: {
        commands: [
          'echo Build started on `date`',
          'echo Building the Docker image...',
          'docker build -t $IMAGE_REPO_NAME:$IMAGE_TAG .',
          'docker tag $IMAGE_REPO_NAME:$IMAGE_TAG $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
        ],
      },
      post_build: {
        commands: [
          'echo Build completed on `date`',
          'echo Pushing the Docker image...',
          'docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG',
          'printf \'[{"name":"agentik-runtime","imageUri":"%s"}]\' $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/$IMAGE_REPO_NAME:$IMAGE_TAG > imagedefinitions.json',
        ],
      },
    },
    artifacts: {
      files: ['imagedefinitions.json'],
    },
  }),
});

const buildOutput = new codepipeline.Artifact();
const buildAction = new codepipeline_actions.CodeBuildAction({
  actionName: 'Build',
  project: buildProject,
  input: sourceOutput,
  outputs: [buildOutput],
});

// Deploy stage
const deployAction = new codepipeline_actions.EcsDeployAction({
  actionName: 'Deploy',
  service: ecsService,
  input: buildOutput,
  deploymentTimeout: cdk.Duration.minutes(30),
});

// Pipeline
new codepipeline.Pipeline(this, 'Pipeline', {
  pipelineName: 'AgentikPipeline',
  stages: [
    {
      stageName: 'Source',
      actions: [sourceAction],
    },
    {
      stageName: 'Build',
      actions: [buildAction],
    },
    {
      stageName: 'Deploy',
      actions: [deployAction],
    },
  ],
});
```

---

## Troubleshooting

### Common Issues

#### 1. Tasks Failing Health Checks

**Symptoms:**
- Tasks start but ALB marks them unhealthy
- Tasks repeatedly restart

**Solution:**
```bash
# Check task logs
aws logs tail /ecs/agentik-runtime --follow

# Check health endpoint manually
aws ecs describe-tasks \
  --cluster agentik-production \
  --tasks TASK_ARN \
  | jq '.tasks[0].containers[0].networkInterfaces[0].privateIpv4Address'

curl http://TASK_IP:3000/health
```

#### 2. High Memory Usage

**Symptoms:**
- Tasks killed with exit code 137 (OOM)
- Memory utilization > 90%

**Solution:**
```typescript
// Increase task memory
memoryLimitMiB: 4096,  // Was: 2048

// Or optimize code
const cache = new LRUCache({
  max: 500,  // Limit cache size
  maxAge: 1000 * 60 * 60,  // 1 hour
});
```

#### 3. Slow Cold Starts

**Symptoms:**
- First request takes > 10 seconds
- Health checks fail during startup

**Solution:**
```typescript
// Increase health check grace period
healthCheckGracePeriod: cdk.Duration.seconds(120),  // Was: 60

// Warm up critical resources
async function warmup() {
  await Promise.all([
    redis.ping(),
    convex.query(api.internal.health),
    // Pre-load critical data
  ]);
}
```

#### 4. High Costs

**Symptoms:**
- Monthly bill higher than expected
- Data transfer charges excessive

**Solution:**
```bash
# Identify cost drivers
aws ce get-cost-and-usage \
  --time-period Start=2024-01-01,End=2024-01-31 \
  --granularity DAILY \
  --metrics BlendedCost \
  --group-by Type=DIMENSION,Key=SERVICE

# Enable Cost Anomaly Detection
aws ce create-anomaly-monitor \
  --anomaly-monitor file://monitor.json
```

---

## Next Steps

- [Google Cloud Deployment](./cloud-deployment-gcp.md) - Deploy on GCP with Cloud Run
- [Azure Deployment](./cloud-deployment-azure.md) - Deploy on Azure Container Apps
- [Multi-Cloud Strategy](./multi-cloud-deployment.md) - Deploy across multiple clouds
- [Disaster Recovery](./disaster-recovery.md) - Backup and recovery strategies

---

**Questions?** Join our [Discord](https://discord.gg/agentik-os) or open an issue on [GitHub](https://github.com/agentik-os/agentik-os).

---

*Last updated: February 14, 2026 • AWS Deployment Guide v1.0*
