[🏠 Home](../README.md) | [⬅️ AWS Services](./aws-services-guide.md)

# 🏗️ AWS CDK with TypeScript Deep Dive

> Master Infrastructure as Code (IaC) using the full power of TypeScript

---

## ⚡ Quick Reference: Why TypeScript for CDK?

| Feature | Infrastructure Benefit |
| :--- | :--- |
| **Interfaces** | Define strict contracts for your resource properties (Props) |
| **Static Types** | Catch misconfigurations (e.g., passing string instead of number) at build time |
| **Generics** | Create reusable, type-safe constructs for multiple teams |
| **Utility Types** | Modify existing resource configurations easily (`Partial`, `Pick`, `Omit`) |

---

## 🏗️ CDK Core Architecture

### The Construct Tree

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                            CDK APP LIFECYCLE                                  │
└──────────────────────────────────────────────────────────────────────────────┘

  ┌──────────────┐
  │   App (Root) │  (The Project Container)
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │    Stack     │  (Deployable Unit - CloudFormation Stack)
  └──────┬───────┘
         │
         ▼
  ┌──────────────┐
  │  Construct   │  (Logical Resource Group)
  └──────┬───────┘
         │
         ├────────────────────────┐
         ▼                        ▼
  ┌──────────────┐         ┌──────────────┐
  │ L2 Construct │         │ L1 Construct │
  │ (S3 Bucket)  │         │ (CfnBucket)  │
  │ *High Level* │         │ *Raw CFN*    │
  └──────────────┘         └──────────────┘
```

---

## 1️⃣ TypeScript & CDK: The "Props" Pattern

> Every construct takes three arguments: `scope`, `id`, and `props`. The `props` argument is where TypeScript shines.

### Defining Strict Interfaces

```typescript
// ❌ Bad: Loose typing
const createBucket = (name: string, public: boolean) => { ... }

// ✅ Good: Props Interface
interface SafeBucketProps {
  readonly bucketName: string;
  readonly isPublic?: boolean; // Optional with ?
  readonly versioned: boolean;
}

export class SafeBucket extends Construct {
  constructor(scope: Construct, id: string, props: SafeBucketProps) {
    super(scope, id);
    
    new s3.Bucket(this, 'Bucket', {
      bucketName: props.bucketName,
      versioned: props.versioned,
      // Logic based on types
      publicReadAccess: props.isPublic ?? false, 
    });
  }
}
```

### Why `readonly`?
In CDK, infrastructure configuration shouldn't change after initialization. Using `readonly` in interfaces enforces immutability.

---

## 2️⃣ Advanced TypeScript Patterns

### 🔹 1. Utility Types for Configuration
Use built-in TypeScript utilities to extend existing CDK types.

```typescript
import { TableProps } from 'aws-cdk-lib/aws-dynamodb';

// 1. Pick: Only allow specific properties
type SimpleTableProps = Pick<TableProps, 'partitionKey' | 'tableName'>;

// 2. Omit: Force specific defaults by hiding options
// User CANNOT set billingMode, we enforce it strictly
type StandardTableProps = Omit<TableProps, 'billingMode'>;

class StandardTable extends Construct {
  constructor(scope: Construct, id: string, props: StandardTableProps) {
    super(scope, id);
    new Table(this, 'Table', {
      ...props, // Spread allowed options
      billingMode: BillingMode.PAY_PER_REQUEST // Enforced
    });
  }
}
```

### 🔹 2. Generics for Reusable Constructs
Create constructs that can handle different types of compute or storage.

```typescript
interface ComputeProps<T> {
  readonly runtime: T;
  readonly handler: string;
}

// Generic class works for both Node and Python runtimes
class GenericFunction<T extends lambda.Runtime> extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: ComputeProps<T>) {
    super(scope, id);
    this.function = new lambda.Function(this, 'Fn', {
      runtime: props.runtime,
      handler: props.handler,
      code: lambda.Code.fromAsset('src'),
    });
  }
}
```

---

## 3️⃣ Project Structure & Organization

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                        RECOMMENDED FOLDER STRUCTURE                           │
└──────────────────────────────────────────────────────────────────────────────┘

  my-cdk-app/
  │
  ├── bin/
  │   └── app.ts                 (Entry point: New App(), New Stack())
  │
  ├── lib/
  │   ├── network-stack.ts       (Stack: VPC, Subnets)
  │   └── database-stack.ts      (Stack: RDS, DynamoDB)
  │
  ├── constructs/                (CUSTOM COMPONENTS)
  │   ├── storage/
  │   │   └── secure-bucket.ts   (L3 Construct: Bucket + Encryption)
  │   └── compute/
  │       └── api-handler.ts     (L3 Construct: Lambda + Monitoring)
  │
  ├── src/                       (APPLICATION CODE)
  │   └── lambda/
  │       └── index.ts
  │
  └── cdk.json                   (Configuration)
```

### Best Practice: The "L3 Construct" Pattern
Don't use raw resources (L2) directly in Stacks. Wrap them in custom L3 Constructs to enforce company standards.

```typescript
// constructs/storage/SecureBucket.ts
export class SecureBucket extends Construct {
  public readonly bucket: s3.Bucket; // Expose main resource

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.bucket = new s3.Bucket(this, 'Resource', {
      encryption: s3.BucketEncryption.S3_MANAGED, // Forced Security
      enforceSSL: true,                           // Forced Security
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, 
    });
  }
}
```

---

## 4️⃣ Passing Data Between Stacks

> How to share a VPC or Table from one Stack to another?

### Option A: Direct Reference (Same App)
TypeScript allows passing objects directly. CDK Engine automatically creates CloudFormation Exports/Imports.

```typescript
// bin/app.ts
const net = new NetworkStack(app, 'NetStack');
const db = new DatabaseStack(app, 'DbStack', {
  vpc: net.vpc // ✅ Passing the actual VPC object
});
```

### Option B: SSM Parameter Store (Decoupled)
For stacks that don't deploy together, use StringParameter.

```typescript
// Stack 1 (Producer)
new ssm.StringParameter(this, 'VpcIdParam', {
  parameterName: '/my-app/vpc-id',
  stringValue: this.vpc.vpcId,
});

// Stack 2 (Consumer)
const vpcId = ssm.StringParameter.valueFromLookup(this, '/my-app/vpc-id');
```

---

## 5️⃣ Testing Infrastructure

### Unit Testing (Fine-grained assertions)
Verify that your specific logical ID or property exists.

```typescript
test('DynamoDB Table Created with Encryption', () => {
  const stack = new MyStack(app, 'TestStack');
  const template = Template.fromStack(stack);

  template.hasResourceProperties('AWS::DynamoDB::Table', {
    SSESpecification: {
      SSEEnabled: true
    }
  });
});
```

### Snapshot Testing
Verify the entire generated YAML hasn't changed unexpectedly.

```typescript
test('Stack Matches Snapshot', () => {
  const stack = new MyStack(app, 'TestStack');
  const template = Template.fromStack(stack);
  
  expect(template.toJSON()).toMatchSnapshot();
});
```

---

## 6️⃣ Comprehensive Code Examples

### Example 1: VPC with Public and Private Subnets

```typescript
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class NetworkStack extends Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Create VPC with 2 AZs, public + private subnets
    this.vpc = new ec2.Vpc(this, 'AppVpc', {
      maxAzs: 2,
      natGateways: 1, // Cost optimization: 1 NAT instead of per-AZ
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
        {
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED, // For RDS
        },
      ],
    });

    // Add VPC Flow Logs for security auditing
    new ec2.FlowLog(this, 'FlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
    });
  }
}
```

### Example 2: Lambda Function with Layers and Environment Variables

```typescript
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';

export class ApiHandlerConstruct extends Construct {
  public readonly function: lambda.Function;

  constructor(scope: Construct, id: string, props: { databaseUrl: string }) {
    super(scope, id);

    // Create Lambda Layer for shared dependencies
    const dependenciesLayer = new lambda.LayerVersion(this, 'DepsLayer', {
      code: lambda.Code.fromAsset('layers/dependencies'),
      compatibleRuntimes: [lambda.Runtime.NODEJS_20_X],
      description: 'Shared node_modules (axios, aws-sdk)',
    });

    this.function = new lambda.Function(this, 'Handler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambda'),
      timeout: Duration.seconds(30),
      memorySize: 512,
      layers: [dependenciesLayer],
      environment: {
        DATABASE_URL: props.databaseUrl,
        NODE_ENV: 'production',
        LOG_LEVEL: 'info',
      },
      // Best practice: CloudWatch Logs retention
      logRetention: logs.RetentionDays.ONE_WEEK,
      // Enable X-Ray tracing
      tracing: lambda.Tracing.ACTIVE,
    });
  }
}
```

### Example 3: DynamoDB Table with GSI and Auto-Scaling

```typescript
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export class UserTableConstruct extends Construct {
  public readonly table: dynamodb.Table;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    this.table = new dynamodb.Table(this, 'UserTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.NUMBER },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST, // On-demand
      pointInTimeRecovery: true, // Backup
      removalPolicy: RemovalPolicy.RETAIN, // Don't delete on stack destroy
      // Server-side encryption with AWS managed key
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
    });

    // Global Secondary Index for email lookups
    this.table.addGlobalSecondaryIndex({
      indexName: 'EmailIndex',
      partitionKey: { name: 'email', type: dynamodb.AttributeType.STRING },
      projectionType: dynamodb.ProjectionType.ALL,
    });
  }
}
```

### Example 4: API Gateway with Lambda Integration

```typescript
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';

export class RestApiConstruct extends Construct {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: { handler: lambda.Function }) {
    super(scope, id);

    this.api = new apigateway.RestApi(this, 'Api', {
      restApiName: 'User Service API',
      description: 'Handles user CRUD operations',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
        // Enable CloudWatch metrics
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
      },
      // CORS configuration
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
      },
    });

    const integration = new apigateway.LambdaIntegration(props.handler, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' },
    });

    // /users endpoint
    const users = this.api.root.addResource('users');
    users.addMethod('GET', integration); // GET /users
    users.addMethod('POST', integration); // POST /users

    // /users/{id} endpoint
    const user = users.addResource('{id}');
    user.addMethod('GET', integration); // GET /users/{id}
    user.addMethod('PUT', integration); // PUT /users/{id}
    user.addMethod('DELETE', integration); // DELETE /users/{id}
  }
}
```

### Example 5: S3 Bucket with CloudFront Distribution

```typescript
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';

export class StaticWebsiteConstruct extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // S3 bucket for static website
    this.bucket = new s3.Bucket(this, 'WebsiteBucket', {
      publicReadAccess: false, // CloudFront will access via OAI
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true, // Clean up on stack deletion
    });

    // CloudFront Origin Access Identity
    const oai = new cloudfront.OriginAccessIdentity(this, 'OAI');
    this.bucket.grantRead(oai);

    // CloudFront Distribution
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(this.bucket, {
          originAccessIdentity: oai,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      defaultRootObject: 'index.html',
      // Error handling for SPA (Single Page App)
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
        },
      ],
    });

    // Output the CloudFront URL
    new CfnOutput(this, 'DistributionUrl', {
      value: this.distribution.distributionDomainName,
    });
  }
}
```

### Example 6: RDS PostgreSQL with Secret Rotation

```typescript
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';

export class DatabaseConstruct extends Construct {
  public readonly instance: rds.DatabaseInstance;
  public readonly secret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: { vpc: ec2.Vpc }) {
    super(scope, id);

    // Create credentials in Secrets Manager
    this.secret = new secretsmanager.Secret(this, 'DbSecret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'postgres' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });

    this.instance = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      credentials: rds.Credentials.fromSecret(this.secret),
      multiAz: false, // Set true for production
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // Auto-scaling storage
      backupRetention: Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: RemovalPolicy.SNAPSHOT, // Create snapshot on deletion
    });

    // Enable secret rotation (every 30 days)
    this.secret.addRotationSchedule('Rotation', {
      automaticallyAfter: Duration.days(30),
    });
  }
}
```

### Example 7: EventBridge Rule with SNS Target

```typescript
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

export class AlertingConstruct extends Construct {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'Critical Alerts',
    });

    // Subscribe email to topic
    alertTopic.addSubscription(
      new subscriptions.EmailSubscription('ops@company.com')
    );

    // EventBridge Rule: Trigger on EC2 instance state change
    const rule = new events.Rule(this, 'Ec2StateChangeRule', {
      eventPattern: {
        source: ['aws.ec2'],
        detailType: ['EC2 Instance State-change Notification'],
        detail: {
          state: ['terminated'],
        },
      },
    });

    rule.addTarget(new targets.SnsTopic(alertTopic, {
      message: events.RuleTargetInput.fromText(
        `EC2 Instance terminated: ${events.EventField.fromPath('$.detail.instance-id')}`
      ),
    }));
  }
}
```

---

## 7️⃣ Real-World Project: E-Commerce Backend

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    E-COMMERCE BACKEND ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Internet                                                               │
│     │                                                                   │
│     ▼                                                                   │
│  ┌────────────────┐                                                     │
│  │  CloudFront    │ ← Static Assets (React App)                        │
│  │  + S3 Bucket   │                                                     │
│  └────────────────┘                                                     │
│                                                                         │
│     │                                                                   │
│     ▼                                                                   │
│  ┌────────────────┐                                                     │
│  │  API Gateway   │ ← REST API                                          │
│  └───────┬────────┘                                                     │
│          │                                                              │
│          ├──── /products ────▶ Lambda ────▶ DynamoDB (Products)        │
│          │                                                              │
│          ├──── /orders ──────▶ Lambda ────▶ DynamoDB (Orders)          │
│          │                         │                                    │
│          │                         └────▶ SQS ────▶ Lambda (Process)   │
│          │                                                              │
│          └──── /users ────────▶ Lambda ────▶ RDS PostgreSQL (Users)    │
│                                                                         │
│  VPC:                                                                   │
│    - Public Subnet: NAT Gateway                                         │
│    - Private Subnet: Lambda functions                                   │
│    - Isolated Subnet: RDS                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Project Structure

```typescript
// bin/app.ts
const app = new App();

const networkStack = new NetworkStack(app, 'EcommerceNetwork');
const databaseStack = new DatabaseStack(app, 'EcommerceDatabase', {
  vpc: networkStack.vpc,
});
const apiStack = new ApiStack(app, 'EcommerceApi', {
  vpc: networkStack.vpc,
  userDb: databaseStack.userDb,
});
const frontendStack = new FrontendStack(app, 'EcommerceFrontend', {
  apiUrl: apiStack.api.url,
});
```

### lib/network-stack.ts

```typescript
export class NetworkStack extends Stack {
  public readonly vpc: ec2.Vpc;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 28,
        },
      ],
    });

    // VPC Flow Logs
    new ec2.FlowLog(this, 'FlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(this.vpc),
    });

    // Export VPC ID for cross-stack reference
    new CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      exportName: 'EcommerceVpcId',
    });
  }
}
```

### lib/database-stack.ts

```typescript
export interface DatabaseStackProps extends StackProps {
  readonly vpc: ec2.Vpc;
}

export class DatabaseStack extends Stack {
  public readonly productTable: dynamodb.Table;
  public readonly orderTable: dynamodb.Table;
  public readonly userDb: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // DynamoDB: Products Table
    this.productTable = new dynamodb.Table(this, 'ProductTable', {
      partitionKey: { name: 'productId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      removalPolicy: RemovalPolicy.RETAIN,
    });

    this.productTable.addGlobalSecondaryIndex({
      indexName: 'CategoryIndex',
      partitionKey: { name: 'category', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'price', type: dynamodb.AttributeType.NUMBER },
    });

    // DynamoDB: Orders Table
    this.orderTable = new dynamodb.Table(this, 'OrderTable', {
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'orderId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES, // For analytics
    });

    // RDS: User Database
    const dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'ecommerce_admin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
      },
    });

    this.userDb = new rds.DatabaseInstance(this, 'UserDb', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL
      ),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      credentials: rds.Credentials.fromSecret(dbSecret),
      multiAz: true, // High availability
      allocatedStorage: 20,
      backupRetention: Duration.days(7),
    });
  }
}
```

### lib/api-stack.ts

```typescript
export interface ApiStackProps extends StackProps {
  readonly vpc: ec2.Vpc;
  readonly userDb: rds.DatabaseInstance;
}

export class ApiStack extends Stack {
  public readonly api: apigateway.RestApi;

  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // Lambda: Product Service
    const productHandler = new lambda.Function(this, 'ProductHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambda/products'),
      environment: {
        PRODUCT_TABLE: 'ProductTable',
      },
      timeout: Duration.seconds(10),
    });

    // Lambda: Order Service
    const orderHandler = new lambda.Function(this, 'OrderHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambda/orders'),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      environment: {
        ORDER_TABLE: 'OrderTable',
        ORDER_QUEUE_URL: 'https://sqs.us-east-1.amazonaws.com/...',
      },
    });

    // Lambda: User Service
    const userHandler = new lambda.Function(this, 'UserHandler', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('src/lambda/users'),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      environment: {
        DB_HOST: props.userDb.dbInstanceEndpointAddress,
        DB_PORT: props.userDb.dbInstanceEndpointPort,
        DB_SECRET_ARN: props.userDb.secret!.secretArn,
      },
    });

    // Grant permissions
    props.userDb.secret!.grantRead(userHandler);
    props.userDb.connections.allowDefaultPortFrom(userHandler);

    // API Gateway
    this.api = new apigateway.RestApi(this, 'EcommerceApi', {
      restApiName: 'Ecommerce API',
      deployOptions: {
        stageName: 'prod',
        throttlingRateLimit: 1000,
        throttlingBurstLimit: 2000,
      },
    });

    // Routes
    const products = this.api.root.addResource('products');
    products.addMethod('GET', new apigateway.LambdaIntegration(productHandler));
    products.addMethod('POST', new apigateway.LambdaIntegration(productHandler));

    const orders = this.api.root.addResource('orders');
    orders.addMethod('GET', new apigateway.LambdaIntegration(orderHandler));
    orders.addMethod('POST', new apigateway.LambdaIntegration(orderHandler));

    const users = this.api.root.addResource('users');
    users.addMethod('GET', new apigateway.LambdaIntegration(userHandler));
    users.addMethod('POST', new apigateway.LambdaIntegration(userHandler));

    // Output
    new CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
    });
  }
}
```

### Best Practices Applied

1. **Multi-Stack Architecture**: Separate concerns (network, database, API, frontend)
2. **Security**:
   - Secrets Manager for database credentials
   - VPC with private/isolated subnets
   - No public access to databases
   - CloudFront for static content (DDoS protection)
3. **High Availability**:
   - Multi-AZ RDS
   - DynamoDB with PITR
   - Lambda auto-scales
4. **Cost Optimization**:
   - Single NAT Gateway
   - DynamoDB on-demand billing
   - CloudFront caching
5. **Monitoring**:
   - VPC Flow Logs
   - Lambda X-Ray tracing
   - API Gateway CloudWatch logs

---

## 8️⃣ Interview Questions & Answers

### Q1: What is the difference between L1, L2, and L3 constructs in CDK?

```
ANSWER:
┌────────────────────────────────────────────────────────────────┐
│ Level │ Description              │ Example                     │
├───────┼──────────────────────────┼─────────────────────────────┤
│ L1    │ CloudFormation exact     │ CfnBucket (raw CFN)        │
│       │ Low-level, all props     │ new CfnBucket(this, ...)   │
│       │                          │                             │
│ L2    │ High-level, intent-based │ Bucket (S3 with defaults)  │
│       │ Built-in methods         │ bucket.addCorsRule()       │
│       │                          │                             │
│ L3    │ Patterns/architectures   │ Custom SecureBucket        │
│       │ Opinionated, company std │ Multiple services bundled  │
└────────────────────────────────────────────────────────────────┘

WHEN TO USE:
- L1: When L2 doesn't support new AWS feature yet
- L2: Default choice for most resources
- L3: Enforce standards across teams (e.g., "all buckets encrypted")
```

### Q2: How do you handle secrets in CDK?

```
ANSWER:
✅ DO:
1. Use Secrets Manager for dynamic secrets
   const secret = new secretsmanager.Secret(this, 'DbPassword', {
     generateSecretString: { ... }
   });

2. Use SSM Parameter Store for configuration
   const apiKey = ssm.StringParameter.valueFromLookup(
     this, '/myapp/api-key'
   );

3. Environment variables from Secrets Manager in Lambda
   environment: {
     DB_SECRET_ARN: dbSecret.secretArn
   }
   // In Lambda code: const secret = await getSecretValue(arn);

❌ DON'T:
- Hardcode secrets in code
- Commit .env files with secrets
- Use plain text environment variables for sensitive data
```

### Q3: How do you share resources between stacks?

```
ANSWER:
METHOD 1: Direct Reference (Same CDK App)
const vpc = new NetworkStack(app, 'Network').vpc;
const db = new DatabaseStack(app, 'Db', { vpc });

METHOD 2: CloudFormation Exports/Imports
// Stack A (Export)
new CfnOutput(this, 'VpcId', {
  value: this.vpc.vpcId,
  exportName: 'MyVpcId'
});

// Stack B (Import)
const vpcId = Fn.importValue('MyVpcId');

METHOD 3: SSM Parameter Store (Decoupled)
// Stack A
new ssm.StringParameter(this, 'Param', {
  parameterName: '/shared/vpc-id',
  stringValue: vpc.vpcId
});

// Stack B (Different deploy time)
const vpcId = ssm.StringParameter.valueFromLookup(
  this, '/shared/vpc-id'
);

BEST PRACTICE: Use METHOD 1 for tightly coupled resources,
               METHOD 3 for truly independent deployments
```

### Q4: What is CDK Context and when to use it?

```
ANSWER:
Context = Key-value pairs that affect CDK synthesis

TYPES:
1. Runtime Context (cdk.json)
   {
     "context": {
       "@aws-cdk/core:enableStackNameDuplicates": false
     }
   }

2. Lookup Context (cached lookups)
   - VPC CIDR lookups
   - Availability zones
   - AMI IDs

WHEN TO USE:
- Feature flags (enable/disable CDK behaviors)
- Environment-specific values
  const isProd = this.node.tryGetContext('environment') === 'prod';
  const instanceType = isProd ? 'm5.large' : 't3.micro';

IMPORTANT:
- cdk.context.json is auto-generated (commit to git!)
- Use cdk context --reset to clear cached lookups
```

### Q5: How do you handle CDK asset uploads (Lambda code, Docker images)?

```
ANSWER:
CDK Assets = Files/Docker images that need to be in S3/ECR

LAMBDA CODE:
// Option 1: Local asset
code: lambda.Code.fromAsset('src/lambda')
// CDK uploads to S3 automatically during synth

// Option 2: Existing S3 bucket
code: lambda.Code.fromBucket(bucket, 'lambda.zip')

// Option 3: Inline (for tiny functions)
code: lambda.Code.fromInline('exports.handler = ...')

DOCKER IMAGES:
const image = ecs.ContainerImage.fromAsset('./app', {
  file: 'Dockerfile',
  buildArgs: { VERSION: '1.0' }
});
// CDK builds and pushes to ECR

BEST PRACTICES:
- Use asset bundling for Lambda layers
- Leverage Docker cache for faster builds
- Set CDK_DOCKER=true for CI/CD
```

### Q6: What happens during `cdk deploy`?

```
ANSWER:
STEPS:
1. SYNTHESIS (cdk synth)
   - Run TypeScript code
   - Generate CloudFormation template (JSON/YAML)
   - Upload assets to S3/ECR

2. DIFF (cdk diff) - Optional but recommended
   - Compare local template with deployed stack
   - Show what will change

3. DEPLOY
   - Create CloudFormation changeset
   - Execute changeset (resources created/updated/deleted)
   - Poll for completion

4. OUTPUT
   - Print stack outputs (URLs, ARNs, etc.)

UNDER THE HOOD:
Your Code → CDK Toolkit → CFN Template → CloudFormation API → AWS

OPTIONS:
--require-approval never   (CI/CD pipelines)
--hotswap                  (fast Lambda-only updates)
--rollback false           (debug failed deployments)
```

### Q7: How do you handle environment-specific configuration?

```typescript
ANSWER:
METHOD 1: Environment Variables in cdk.json
{
  "context": {
    "dev": {
      "instanceType": "t3.micro",
      "dbSize": "small"
    },
    "prod": {
      "instanceType": "m5.large",
      "dbSize": "large"
    }
  }
}

// In stack
const env = this.node.tryGetContext(process.env.ENVIRONMENT || 'dev');
const instanceType = env.instanceType;

METHOD 2: Separate Stack Instances
const devStack = new MyStack(app, 'Dev', {
  env: { account: '1111', region: 'us-east-1' },
  instanceType: 't3.micro'
});

const prodStack = new MyStack(app, 'Prod', {
  env: { account: '2222', region: 'us-west-2' },
  instanceType: 'm5.large'
});

METHOD 3: SSM Parameter Store
const config = ssm.StringParameter.valueFromLookup(
  this, `/config/${environment}/instance-type`
);

BEST: Combination of METHOD 1 (defaults) + METHOD 2 (account separation)
```

### Q8: What are CDK Aspects and when to use them?

```typescript
ANSWER:
Aspects = Visitors that can modify constructs after creation

USE CASES:
1. Tag enforcement
2. Security compliance
3. Cost allocation

EXAMPLE: Auto-tag all resources
class TagAspect implements IAspect {
  visit(node: IConstruct) {
    if (node instanceof CfnResource) {
      Tags.of(node).add('Environment', 'Production');
      Tags.of(node).add('ManagedBy', 'CDK');
    }
  }
}

// Apply to entire stack
Aspects.of(stack).add(new TagAspect());

EXAMPLE: Enforce S3 encryption
class EncryptionAspect implements IAspect {
  visit(node: IConstruct) {
    if (node instanceof s3.CfnBucket) {
      if (!node.bucketEncryption) {
        throw new Error('All S3 buckets must be encrypted!');
      }
    }
  }
}
```

---

## 📚 Summary: The TypeScript Advantage

1.  **Safety**: `readonly` and `Interfaces` prevent mutating configuration.
2.  **Abstraction**: `L3 Constructs` hide complexity and enforce standards.
3.  **Discovery**: Autocomplete in VS Code makes discovering properties (like `metricErrors()`) instant.
4.  **Refactoring**: Renaming a construct property acts just like renaming a variable—simultaneous update across the app.
5.  **Real-World**: Combine networking, compute, storage, and monitoring into production-ready architectures.

---

*Master CDK to automate your infrastructure, enforce best practices, and deploy with confidence.*
